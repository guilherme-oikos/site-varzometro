'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { RESENHA_MAX, type StatusJogo } from '@/lib/bolao';
import { sincronizarBolao } from '@/lib/bolao-sync';
import { exigirSessao } from '@/lib/painel';
import { supabaseServidor } from '@/lib/supabase/server';
import { TAG_BOLAO, TAG_CONTEUDO } from '@/lib/supabase/config';
import { siglaDeClube } from '@/lib/site';
import { emailDoUsuario, normalizarUsuario, usuarioValido } from '@/lib/usuario';

export type Resultado = { ok: true; mensagem: string; slug?: string | null } | { ok: false; erro: string };

/** Página pública e painel se refazem na hora depois de salvar. */
function atualizarSite() {
  revalidateTag(TAG_CONTEUDO);
  revalidatePath('/painel', 'layout');
}

function texto(valor: unknown, limite: number): string {
  return String(valor ?? '').trim().slice(0, limite);
}

/** Só aceita imagem do nosso Storage ou de /public; qualquer outra coisa vira vazio. */
function urlDeImagem(valor: unknown): string | null {
  const url = texto(valor, 500);
  if (!url) return null;
  if (url.startsWith('/')) return url;
  if (/^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//.test(url)) return url;
  return null;
}

/**
 * Título vira endereço: "Palmeiras x São Paulo: vitória no clássico" →
 * "palmeiras-x-sao-paulo-vitoria-no-classico". Mesmas regras que o PUBLICAR.md
 * pedia para o nome do arquivo.
 */
function slugDoTitulo(titulo: string): string {
  return (
    titulo
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
      .replace(/-+$/g, '') || 'artigo'
  );
}

/* ------------------------------------------------------------------ Login -- */

export async function entrar(_anterior: Resultado | null, dados: FormData): Promise<Resultado> {
  const usuario = normalizarUsuario(texto(dados.get('usuario'), 60));
  const senha = String(dados.get('senha') ?? '');

  if (!usuario || !senha) return { ok: false, erro: 'Preencha usuário e senha.' };

  // Usuário fora do formato nem chega ao Supabase, mas leva a mesma mensagem
  // de senha errada — ver abaixo.
  const { error } = usuarioValido(usuario)
    ? await supabaseServidor().auth.signInWithPassword({ email: emailDoUsuario(usuario), password: senha })
    : { error: true };

  // Mensagem única para usuário inexistente e senha errada: dizer qual dos dois
  // falhou ajudaria quem está tentando adivinhar conta alheia.
  if (error) return { ok: false, erro: 'Usuário ou senha não conferem.' };

  redirect('/painel');
}

export async function sair() {
  await supabaseServidor().auth.signOut();
  redirect('/login');
}

export async function trocarSenha(_anterior: Resultado | null, dados: FormData): Promise<Resultado> {
  const senha = String(dados.get('senha') ?? '');
  const confirmacao = String(dados.get('confirmacao') ?? '');

  if (senha.length < 8) return { ok: false, erro: 'A senha precisa de pelo menos 8 caracteres.' };
  if (senha !== confirmacao) return { ok: false, erro: 'As duas senhas não são iguais.' };

  const { supabase } = await exigirSessao();
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) return { ok: false, erro: `Não deu para trocar a senha: ${error.message}` };

  return { ok: true, mensagem: 'Senha trocada.' };
}

/* ----------------------------------------------------------------- Perfil -- */

export type DadosPerfil = {
  nome: string;
  iniciais: string;
  clube: string;
  papel: string;
  funcao: string;
  bio: string;
  foto_url: string | null;
  foto_blog_url: string | null;
};

export async function salvarPerfil(dados: DadosPerfil): Promise<Resultado> {
  const { supabase, user } = await exigirSessao();

  const nome = texto(dados.nome, 40);
  const clube = siglaDeClube(dados.clube);
  if (!nome) return { ok: false, erro: 'O nome não pode ficar vazio.' };
  if (!clube) return { ok: false, erro: 'Escolha um dos quatro clubes.' };

  const { error } = await supabase
    .from('perfis')
    .update({
      nome,
      iniciais: texto(dados.iniciais, 3).toUpperCase() || nome.slice(0, 2).toUpperCase(),
      clube,
      papel: texto(dados.papel, 60),
      funcao: texto(dados.funcao, 60),
      bio: texto(dados.bio, 400),
      foto_url: urlDeImagem(dados.foto_url),
      foto_blog_url: urlDeImagem(dados.foto_blog_url),
    })
    .eq('id', user.id);

  if (error) return { ok: false, erro: `Não deu para salvar: ${error.message}` };

  atualizarSite();
  return { ok: true, mensagem: 'Perfil salvo. Já está no ar.' };
}

/* ---------------------------------------------------------------- Artigos -- */

export async function criarArtigo() {
  const { supabase, user, perfil } = await exigirSessao();
  if (!perfil) redirect('/painel');

  const { data, error } = await supabase
    .from('artigos')
    .insert({ autor_id: user.id, clube: perfil.clube })
    .select('id')
    .single();

  if (error || !data) throw new Error(`Não deu para criar o rascunho: ${error?.message}`);

  redirect(`/painel/artigos/${data.id}`);
}

export type DadosArtigo = {
  titulo: string;
  resumo: string;
  conteudo: string;
  clube: string;
  capa_url: string | null;
  capa_alt: string;
  capa_credito: string;
  tags: string;
};

export type AcaoArtigo = 'salvar' | 'publicar' | 'despublicar';

export async function salvarArtigo(id: string, dados: DadosArtigo, acao: AcaoArtigo): Promise<Resultado> {
  const { supabase } = await exigirSessao();

  // A RLS já esconde artigo dos outros; o `select` aqui serve para saber o
  // estado atual (tem slug? já foi publicado?).
  const { data: atual, error: erroLeitura } = await supabase
    .from('artigos')
    .select('slug, status, publicado_em')
    .eq('id', id)
    .maybeSingle<{ slug: string | null; status: string; publicado_em: string | null }>();

  if (erroLeitura || !atual) return { ok: false, erro: 'Artigo não encontrado.' };

  const titulo = texto(dados.titulo, 140);
  const conteudo = String(dados.conteudo ?? '').slice(0, 100_000);
  const tags = Array.from(
    new Set(
      String(dados.tags ?? '')
        .split(',')
        .map((tag) => tag.trim().slice(0, 30))
        .filter(Boolean),
    ),
  ).slice(0, 8);

  const status =
    acao === 'publicar' ? 'publicado' : acao === 'despublicar' ? 'rascunho' : atual.status;

  if (status === 'publicado') {
    if (!titulo) return { ok: false, erro: 'Para publicar, o artigo precisa de título.' };
    if (!conteudo.trim()) return { ok: false, erro: 'Para publicar, o artigo precisa de texto.' };
  }

  const campos = {
    titulo,
    resumo: texto(dados.resumo, 300),
    conteudo,
    clube: siglaDeClube(dados.clube) ?? null,
    capa_url: urlDeImagem(dados.capa_url),
    capa_alt: texto(dados.capa_alt, 300) || null,
    capa_credito: texto(dados.capa_credito, 120) || null,
    tags,
    status,
    // A data é a da primeira publicação. Tirar do ar e republicar não muda a
    // data, senão um artigo antigo pularia para o topo do blog.
    publicado_em: status === 'publicado' ? (atual.publicado_em ?? new Date().toISOString()) : atual.publicado_em,
  };

  // Slug só nasce na primeira publicação. Se já existir outro igual (inclusive
  // rascunho de outra pessoa, que a RLS esconde daqui), tenta com -2, -3...
  let slug = atual.slug;
  if (status === 'publicado' && !slug) {
    const base = slugDoTitulo(titulo);
    for (let tentativa = 1; tentativa <= 20; tentativa++) {
      const candidato = tentativa === 1 ? base : `${base}-${tentativa}`;
      const { error } = await supabase.from('artigos').update({ ...campos, slug: candidato }).eq('id', id);
      if (!error) {
        slug = candidato;
        break;
      }
      if (error.code !== '23505') return { ok: false, erro: `Não deu para publicar: ${error.message}` };
    }
    if (!slug) return { ok: false, erro: 'Não achei um endereço livre para este título. Mude o título um pouco.' };
  } else {
    const { error } = await supabase.from('artigos').update(campos).eq('id', id);
    if (error) return { ok: false, erro: `Não deu para salvar: ${error.message}` };
  }

  // Rascunho que nunca foi ao ar não muda nada no site. Todo o resto muda.
  if (status === 'publicado' || atual.status === 'publicado') atualizarSite();
  else revalidatePath('/painel', 'layout');

  const mensagem = {
    salvar: status === 'publicado' ? 'Alterações publicadas.' : 'Rascunho salvo.',
    publicar: 'Publicado. Já está no blog.',
    despublicar: 'Artigo tirado do ar. Voltou a ser rascunho.',
  }[acao];

  return { ok: true, mensagem, slug };
}

// Erro volta como resultado, não como exceção: o modal de confirmação mostra a
// mensagem e continua aberto. Deu certo, o `redirect` leva para a lista.
export async function excluirArtigo(id: string): Promise<Resultado> {
  const { supabase } = await exigirSessao();

  const { error } = await supabase.from('artigos').delete().eq('id', id);
  if (error) return { ok: false, erro: `Não deu para excluir: ${error.message}` };

  atualizarSite();
  redirect('/painel');
}

/* ------------------------------------------------------------------ Bolão -- */

/** A página do bolão se refaz depois de salvar. */
function atualizarBolao() {
  revalidateTag(TAG_BOLAO);
}

/** Gols de 0 a 20; vazio é "sem palpite". Qualquer outra coisa é inválida. */
function gols(valor: unknown): number | null | undefined {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 0 && numero <= 20 ? numero : undefined;
}

export type PalpiteEnviado = {
  jogo_id: number;
  gols_mandante: number | string | null;
  gols_visitante: number | string | null;
  resenha?: string | null;
  /** Zebra da rodada. Uma por rodada: o trigger do banco tira a anterior. */
  dobrado?: boolean;
};

/**
 * Salva os palpites da rodada de uma vez. Os dois campos vazios apagam o
 * palpite daquele jogo; um só preenchido é erro.
 *
 * Quem barra jogo já começado é a RLS. Aqui só se traduz a recusa — e cada
 * jogo vai separado, para um jogo fechado não derrubar os outros.
 *
 * A zebra que sai vai antes da que entra: o banco aceita só uma por rodada e
 * tira a anterior sozinho, mas assim a ordem nunca depende disso.
 */
export async function salvarPalpites(lista: PalpiteEnviado[]): Promise<Resultado> {
  const { supabase, user, perfil } = await exigirSessao();
  if (!perfil) return { ok: false, erro: 'Seu login ainda não tem perfil.' };

  const fechados: number[] = [];
  let salvos = 0;

  const ordenada = [...lista.slice(0, 40)].sort((a, b) => Number(Boolean(a.dobrado)) - Number(Boolean(b.dobrado)));

  for (const item of ordenada) {
    const jogo = Number(item.jogo_id);
    const mandante = gols(item.gols_mandante);
    const visitante = gols(item.gols_visitante);
    // Espaço repetido e quebra de linha viram um espaço só; vazio é sem resenha.
    const resenha = String(item.resenha ?? '').replace(/\s+/g, ' ').trim() || null;
    const dobrado = Boolean(item.dobrado);

    if (!Number.isInteger(jogo)) continue;
    if (mandante === undefined || visitante === undefined) {
      return { ok: false, erro: 'Placar só aceita número de 0 a 20.' };
    }
    if ((mandante === null) !== (visitante === null)) {
      return { ok: false, erro: 'Preencha os dois lados do placar (ou deixe os dois vazios).' };
    }

    if (resenha && resenha.length > RESENHA_MAX) {
      return { ok: false, erro: `A resenha cabe em até ${RESENHA_MAX} caracteres.` };
    }
    if ((resenha || dobrado) && mandante === null) {
      return { ok: false, erro: 'Resenha e zebra precisam de um placar no mesmo jogo.' };
    }

    if (mandante === null || visitante === null) {
      const { error } = await supabase.from('bolao_palpites').delete().eq('jogo_id', jogo).eq('autor_id', user.id);
      if (error) fechados.push(jogo);
      continue;
    }

    const { error } = await supabase
      .from('bolao_palpites')
      .upsert(
        { jogo_id: jogo, autor_id: user.id, gols_mandante: mandante, gols_visitante: visitante, resenha, dobrado },
        { onConflict: 'jogo_id,autor_id' },
      );

    // 42501 é a RLS recusando: o jogo começou entre abrir a tela e salvar.
    if (error) {
      // P0001: o trigger da zebra — a desta rodada já está num jogo que começou.
      if (error.code === 'P0001') {
        return { ok: false, erro: 'A zebra desta rodada já foi usada num jogo que começou. Os palpites anteriores foram salvos.' };
      }
      // PGRST204: coluna que não existe — o 0004_resenha_e_zebra.sql não rodou.
      if (error.code === 'PGRST204') {
        return { ok: false, erro: 'Falta rodar a migração 0004_resenha_e_zebra.sql no Supabase.' };
      }
      if (error.code !== '42501') return { ok: false, erro: `Não deu para salvar: ${error.message}` };
      fechados.push(jogo);
      continue;
    }
    salvos++;
  }

  atualizarBolao();

  if (fechados.length > 0) {
    return {
      ok: false,
      erro:
        fechados.length === 1
          ? 'Um jogo já tinha começado e o palpite dele não entrou. Os outros foram salvos.'
          : `${fechados.length} jogos já tinham começado e ficaram de fora. Os outros foram salvos.`,
    };
  }

  return { ok: true, mensagem: salvos === 1 ? 'Palpite salvo.' : 'Palpites salvos.' };
}

/** Botão do admin: busca no football-data agora, sem esperar o cron. */
export async function atualizarJogos(): Promise<Resultado> {
  const { supabase, perfil } = await exigirSessao();
  if (!perfil?.is_admin) return { ok: false, erro: 'Só o admin atualiza os jogos.' };

  const resultado = await sincronizarBolao(supabase);
  if (!resultado.ok) return { ok: false, erro: `Não deu para atualizar: ${resultado.erro}` };

  atualizarBolao();
  return {
    ok: true,
    mensagem: `Jogos atualizados: ${resultado.recebidos} na temporada, ${resultado.gravados} gravados no bolão.`,
  };
}

const STATUS_VALIDOS: StatusJogo[] = ['agendado', 'ao_vivo', 'encerrado', 'adiado', 'cancelado'];

export type CorrecaoJogo = {
  status: string;
  gols_mandante: number | string | null;
  gols_visitante: number | string | null;
  /** true devolve o jogo para a sincronização, que volta a mandar nele. */
  seguirApi: boolean;
};

/** Correção manual do admin para quando a API erra ou demora. */
export async function corrigirJogo(id: number, dados: CorrecaoJogo): Promise<Resultado> {
  const { supabase, perfil } = await exigirSessao();
  if (!perfil?.is_admin) return { ok: false, erro: 'Só o admin corrige jogo.' };

  if (dados.seguirApi) {
    const { error } = await supabase.from('bolao_jogos').update({ editado_a_mao: false }).eq('id', id);
    if (error) return { ok: false, erro: `Não deu para salvar: ${error.message}` };
    atualizarBolao();
    return { ok: true, mensagem: 'Jogo devolvido para a API. A próxima atualização manda nele.' };
  }

  const status = STATUS_VALIDOS.find((valor) => valor === dados.status);
  const mandante = gols(dados.gols_mandante);
  const visitante = gols(dados.gols_visitante);

  if (!status) return { ok: false, erro: 'Situação do jogo inválida.' };
  if (mandante === undefined || visitante === undefined) return { ok: false, erro: 'Placar só aceita número de 0 a 20.' };
  if (status === 'encerrado' && (mandante === null || visitante === null)) {
    return { ok: false, erro: 'Jogo encerrado precisa do placar.' };
  }

  const { error } = await supabase
    .from('bolao_jogos')
    .update({
      status,
      gols_mandante: status === 'encerrado' ? mandante : null,
      gols_visitante: status === 'encerrado' ? visitante : null,
      editado_a_mao: true,
    })
    .eq('id', id);

  if (error) return { ok: false, erro: `Não deu para salvar: ${error.message}` };

  atualizarBolao();
  return { ok: true, mensagem: 'Jogo corrigido. A sincronização não mexe mais nele.' };
}
