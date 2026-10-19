'use client';

import { useState, useTransition } from 'react';
import CardIntegrante from '@/components/CardIntegrante';
import { salvarPerfil, type DadosPerfil, type Resultado } from '@/app/painel/actions';
import { clubes, type ClubeSigla } from '@/lib/site';
import { enviarImagem } from '@/lib/supabase/enviar-imagem';

const siglas = Object.keys(clubes) as ClubeSigla[];

type CampoFoto = 'foto_url' | 'foto_blog_url';

export default function EditorPerfil({ inicial, usuarioId }: { inicial: DadosPerfil; usuarioId: string }) {
  const [dados, setDados] = useState(inicial);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [enviando, setEnviando] = useState<CampoFoto | null>(null);
  const [salvando, iniciar] = useTransition();

  const mudar = <K extends keyof DadosPerfil>(campo: K, valor: DadosPerfil[K]) =>
    setDados((atual) => ({ ...atual, [campo]: valor }));

  async function enviar(arquivo: File | undefined, campo: CampoFoto) {
    if (!arquivo) return;
    setEnviando(campo);
    setResultado(null);
    try {
      mudar(campo, await enviarImagem(arquivo, usuarioId, 'perfil'));
    } catch (erro) {
      setResultado({ ok: false, erro: erro instanceof Error ? erro.message : 'Falha no envio.' });
    } finally {
      setEnviando(null);
    }
  }

  function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setResultado(null);
    iniciar(async () => setResultado(await salvarPerfil(dados)));
  }

  const clube = (siglas.includes(dados.clube as ClubeSigla) ? dados.clube : 'SPFC') as ClubeSigla;

  const fotos: { campo: CampoFoto; rotulo: string; dica: string }[] = [
    { campo: 'foto_url', rotulo: 'Foto do card da bancada', dica: 'Vertical (3:4), rosto no terço de cima.' },
    { campo: 'foto_blog_url', rotulo: 'Foto do avatar no blog', dica: 'Quadrada, rosto centralizado. Sem ela, o blog usa a do card.' },
  ];

  return (
    <form onSubmit={salvar} className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <div className="min-w-0 space-y-5">
        <div className="grid gap-5 sm:grid-cols-[1fr_120px]">
          <label className="block">
            <span className="rotulo">Nome</span>
            <input className="campo" value={dados.nome} onChange={(e) => mudar('nome', e.target.value)} maxLength={40} required />
            <span className="dica">Aparece no card e como autor dos seus artigos, inclusive os antigos.</span>
          </label>
          <label className="block">
            <span className="rotulo">Iniciais</span>
            <input
              className="campo uppercase"
              value={dados.iniciais}
              onChange={(e) => mudar('iniciais', e.target.value)}
              maxLength={3}
            />
            <span className="dica">Quando não há foto.</span>
          </label>
        </div>

        <label className="block">
          <span className="rotulo">Clube</span>
          <select className="campo" value={dados.clube} onChange={(e) => mudar('clube', e.target.value)}>
            {siglas.map((sigla) => (
              <option key={sigla} value={sigla}>
                {clubes[sigla].nome}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="rotulo">Papel</span>
            <input className="campo" value={dados.papel} onChange={(e) => mudar('papel', e.target.value)} maxLength={60} placeholder="Comentarista" />
          </label>
          <label className="block">
            <span className="rotulo">Função na mesa</span>
            <input className="campo" value={dados.funcao} onChange={(e) => mudar('funcao', e.target.value)} maxLength={60} placeholder="Opiniões impopulares" />
          </label>
        </div>

        <label className="block">
          <span className="rotulo">Bio</span>
          <textarea className="campo min-h-[110px]" value={dados.bio} onChange={(e) => mudar('bio', e.target.value)} maxLength={400} />
          <span className="dica">{dados.bio.length}/400 — curta, para caber no verso do card no celular.</span>
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          {fotos.map(({ campo, rotulo, dica }) => (
            <div key={campo}>
              <span className="rotulo">{rotulo}</span>
              <div className="flex items-center gap-3">
                {dados[campo] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dados[campo] ?? ''} alt="" className="h-16 w-16 rounded-xl border border-ink-line object-cover" />
                ) : (
                  <span className="grid h-16 w-16 place-items-center rounded-xl border border-ink-line text-sm font-extrabold text-primary/70">
                    {dados.iniciais}
                  </span>
                )}
                <label className="btn-ghost cursor-pointer !px-4 !py-2 text-xs">
                  {enviando === campo ? 'Enviando...' : 'Trocar'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={enviando !== null}
                    onChange={(e) => {
                      enviar(e.target.files?.[0], campo);
                      e.target.value = '';
                    }}
                  />
                </label>
                {dados[campo] ? (
                  <button type="button" className="text-xs font-bold text-muted hover:text-white" onClick={() => mudar(campo, null)}>
                    Remover
                  </button>
                ) : null}
              </div>
              <span className="dica">{dica}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button type="submit" className="btn-primary" disabled={salvando || enviando !== null}>
            {salvando ? 'Salvando...' : 'Salvar perfil'}
          </button>
          {resultado ? (
            <p role={resultado.ok ? 'status' : 'alert'} className={`text-sm font-medium ${resultado.ok ? 'text-emerald-400' : 'text-red-400'}`}>
              {resultado.ok ? resultado.mensagem : resultado.erro}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <span className="rotulo">Como fica o card</span>
        <div className="mx-auto max-w-[240px]">
          <CardIntegrante
            membro={{ ...dados, clube, foto: dados.foto_url ?? undefined, fotoBlog: dados.foto_blog_url ?? undefined }}
            temFoto={Boolean(dados.foto_url)}
          />
        </div>
      </div>
    </form>
  );
}
