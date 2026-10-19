/**
 * Migração única: leva bancada, convidados e artigos do código para o Supabase.
 *
 * Como rodar (da raiz do projeto, Node 22.6+):
 *
 *   1. Rodar supabase/migrations/0001_inicial.sql no SQL Editor do Supabase.
 *   2. Copiar scripts/contas.exemplo.json para scripts/contas.json e preencher
 *      usuário e senha provisória de cada um. Esse arquivo não vai para o git.
 *   3. Pôr no .env.local:
 *        NEXT_PUBLIC_SUPABASE_URL=...
 *        SUPABASE_SERVICE_ROLE_KEY=...   (Settings > API > service_role)
 *   4. npm run migrar
 *
 * Pode rodar de novo sem duplicar nada: conta existente é reaproveitada pelo
 * usuário, perfil e artigo são atualizados (artigo pelo slug), imagem é
 * sobrescrita. Só não rode depois que a bancada já estiver editando pelo
 * painel: o script sobrescreve perfis e artigos com o que está no código.
 *
 * Usa a chave service_role, que passa por cima da RLS. Ela fica só no
 * .env.local da sua máquina — nunca na Vercel com NEXT_PUBLIC_, nunca no git.
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';
import { bancada, convidados } from '../src/lib/site.ts';
import { emailDoUsuario, normalizarUsuario, usuarioValido } from '../src/lib/usuario.ts';

type Conta = { usuario: string; senha: string; admin?: boolean };

const RAIZ = process.cwd();
const BUCKET = 'imagens';

function limpar(valor: string | undefined) {
  return valor?.trim().replace(/^["']|["']$/g, '').trim() || undefined;
}

const url = limpar(process.env.NEXT_PUBLIC_SUPABASE_URL);
const chave = limpar(process.env.SUPABASE_SERVICE_ROLE_KEY);
if (!url || !chave) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.');
  process.exit(1);
}

const arquivoContas = path.join(RAIZ, 'scripts', 'contas.json');
if (!fs.existsSync(arquivoContas)) {
  console.error('Falta scripts/contas.json (copie de scripts/contas.exemplo.json).');
  process.exit(1);
}
const contas: Record<string, Conta> = JSON.parse(fs.readFileSync(arquivoContas, 'utf8'));

const supabase = createClient(url, chave, { auth: { persistSession: false } });

const tipos: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

/** Sobe um arquivo de /public e devolve a URL pública. SVG e inexistente ficam de fora. */
async function subir(caminhoPublico: string | undefined, destino: string): Promise<string | null> {
  if (!caminhoPublico) return null;
  const local = path.join(RAIZ, 'public', caminhoPublico.replace(/^\//, ''));
  const tipo = tipos[path.extname(local).toLowerCase()];
  if (!fs.existsSync(local) || !tipo) {
    console.warn(`  ! pulei ${caminhoPublico} (não existe ou formato não aceito)`);
    return null;
  }
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(destino, fs.readFileSync(local), { contentType: tipo, upsert: true, cacheControl: '31536000' });
  if (error) throw new Error(`upload de ${caminhoPublico}: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(destino).data.publicUrl;
}

async function usuarioPorEmail(email: string) {
  for (let pagina = 1; ; pagina++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page: pagina, perPage: 200 });
    if (error) throw error;
    const achado = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (achado || data.users.length < 200) return achado;
  }
}

/* ------------------------------------------------------------------ Perfis */

const pessoas = [
  ...bancada.map((p, i) => ({ ...p, naBancada: true, ordem: (i + 1) * 10 })),
  ...convidados.map((p) => ({ papel: 'Convidado', funcao: '', bio: '', ...p, naBancada: false, ordem: 1000 })),
];

const idPorNome = new Map<string, string>();

console.log('Perfis:');
for (const pessoa of pessoas) {
  const conta = contas[pessoa.nome];
  if (!conta?.usuario) throw new Error(`"${pessoa.nome}" não está em scripts/contas.json.`);
  const login = normalizarUsuario(conta.usuario);
  if (!usuarioValido(login)) {
    throw new Error(`usuário "${conta.usuario}" de ${pessoa.nome}: use de 2 a 30 letras minúsculas, números, ponto, hífen ou sublinhado.`);
  }
  // E-mail interno, que ninguém digita: o login é pelo usuário (ver src/lib/usuario.ts).
  const email = emailDoUsuario(login);

  let usuario = await usuarioPorEmail(email);
  if (!usuario) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: conta.senha,
      email_confirm: true,
    });
    if (error) throw new Error(`criar ${login}: ${error.message}`);
    usuario = data.user;
    console.log(`  + conta criada: ${pessoa.nome} (usuário: ${login})`);
  }

  const id = usuario.id;
  const foto = await subir(pessoa.foto, `${id}/perfil/${path.basename(pessoa.foto ?? 'card.jpg')}`);
  const fotoBlog = await subir(pessoa.fotoBlog, `${id}/perfil/avatar-${path.basename(pessoa.fotoBlog ?? 'avatar.jpg')}`);

  const { error } = await supabase.from('perfis').upsert({
    id,
    nome: pessoa.nome,
    iniciais: pessoa.iniciais,
    clube: pessoa.clube,
    papel: pessoa.papel,
    funcao: pessoa.funcao,
    bio: pessoa.bio,
    foto_url: foto,
    foto_blog_url: fotoBlog,
    na_bancada: pessoa.naBancada,
    ordem: pessoa.ordem,
    is_admin: Boolean(conta.admin),
  });
  if (error) throw new Error(`perfil de ${pessoa.nome}: ${error.message}`);

  idPorNome.set(pessoa.nome, id);
  console.log(`  ✓ ${pessoa.nome}`);
}

/* ----------------------------------------------------------------- Artigos */

/** Mesma regra de `normalizarData` e `dataIso` do posts.ts: sem hora vale meio-dia de Brasília. */
function publicadoEm(bruto: unknown): string {
  const texto =
    bruto instanceof Date ? bruto.toISOString().slice(0, 16).replace('T', ' ') : String(bruto ?? '').trim();
  const [dia, hora = '12:00'] = texto.split(' ');
  return new Date(`${dia}T${hora}:00-03:00`).toISOString();
}

const pastaPosts = path.join(RAIZ, 'content', 'posts');
const arquivos = fs.readdirSync(pastaPosts).filter((f) => /\.mdx?$/.test(f));

console.log('\nArtigos:');
for (const arquivo of arquivos) {
  const slug = arquivo.replace(/\.mdx?$/, '');
  const { data, content } = matter(fs.readFileSync(path.join(pastaPosts, arquivo), 'utf8'));

  const autorId = idPorNome.get(String(data.author ?? ''));
  if (!autorId) throw new Error(`${arquivo}: autor "${data.author}" não tem perfil.`);

  const capa = await subir(data.cover ? String(data.cover) : undefined, `${autorId}/artigos/${slug}${path.extname(String(data.cover ?? '.jpg'))}`);

  // Imagens do corpo que apontam para /public também vão para o Storage, senão
  // o artigo dependeria para sempre de arquivos do repositório.
  let conteudo = content;
  for (const [, caminho] of content.matchAll(/!\[[^\]]*\]\((\/[^)\s]+)/g)) {
    const novo = await subir(caminho, `${autorId}/artigos/${path.basename(caminho)}`);
    if (novo) conteudo = conteudo.split(`(${caminho}`).join(`(${novo}`);
  }

  const clube = String(data.clube ?? '').trim().toUpperCase();

  const { error } = await supabase.from('artigos').upsert(
    {
      slug,
      autor_id: autorId,
      titulo: String(data.title ?? slug),
      resumo: String(data.excerpt ?? ''),
      conteudo: conteudo.trim(),
      clube: ['SPFC', 'SCCP', 'SEP', 'SFC'].includes(clube) ? clube : null,
      capa_url: capa,
      capa_alt: data.coverAlt ? String(data.coverAlt) : null,
      capa_credito: data.coverCredito ? String(data.coverCredito) : null,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      status: 'publicado',
      publicado_em: publicadoEm(data.date),
    },
    { onConflict: 'slug' },
  );
  if (error) throw new Error(`${arquivo}: ${error.message}`);
  console.log(`  ✓ ${slug}`);
}

console.log(`\nPronto: ${pessoas.length} perfis e ${arquivos.length} artigos.`);
