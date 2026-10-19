'use client';

import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import CorpoDoArtigo from '@/components/CorpoDoArtigo';
import ModalConfirmacao from '@/components/painel/ModalConfirmacao';
import {
  excluirArtigo,
  salvarArtigo,
  type AcaoArtigo,
  type DadosArtigo,
  type Resultado,
} from '@/app/painel/actions';
import type { ArtigoDoPainel } from '@/lib/painel';
import { clubes, type ClubeSigla } from '@/lib/site';
import { enviarImagem } from '@/lib/supabase/enviar-imagem';

/** Botões da barra: o que entra antes e depois do trecho selecionado. */
const formatos = [
  { rotulo: 'Negrito', curto: 'B', antes: '**', depois: '**', exemplo: 'texto em negrito' },
  { rotulo: 'Itálico', curto: 'I', antes: '_', depois: '_', exemplo: 'texto em itálico' },
  { rotulo: 'Subtítulo', curto: 'H2', antes: '\n## ', depois: '\n', exemplo: 'Subtítulo' },
  { rotulo: 'Citação', curto: '❝', antes: '\n> ', depois: '\n', exemplo: 'frase citada' },
  { rotulo: 'Lista', curto: '•', antes: '\n- ', depois: '\n', exemplo: 'item' },
  { rotulo: 'Link', curto: 'Link', antes: '[', depois: '](https://)', exemplo: 'texto do link' },
] as const;

const siglas = Object.keys(clubes) as ClubeSigla[];

export default function EditorArtigo({
  artigo,
  usuarioId,
}: {
  artigo: ArtigoDoPainel;
  usuarioId: string;
}) {
  const [dados, setDados] = useState<DadosArtigo>({
    titulo: artigo.titulo,
    resumo: artigo.resumo,
    conteudo: artigo.conteudo,
    clube: artigo.clube ?? '',
    capa_url: artigo.capa_url,
    capa_alt: artigo.capa_alt ?? '',
    capa_credito: artigo.capa_credito ?? '',
    tags: artigo.tags.join(', '),
  });
  const [status, setStatus] = useState(artigo.status);
  const [slug, setSlug] = useState(artigo.slug);
  const [aba, setAba] = useState<'escrever' | 'previa'>('escrever');
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [enviando, setEnviando] = useState<'capa' | 'corpo' | null>(null);
  const [salvando, iniciar] = useTransition();
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [excluindo, iniciarExclusao] = useTransition();
  const texto = useRef<HTMLTextAreaElement>(null);

  const mudar = <K extends keyof DadosArtigo>(campo: K, valor: DadosArtigo[K]) =>
    setDados((atual) => ({ ...atual, [campo]: valor }));

  /** Aplica o formato no trecho selecionado, ou insere o exemplo se não houver. */
  function formatar(antes: string, depois: string, exemplo: string) {
    const campo = texto.current;
    if (!campo) return;
    const { selectionStart: ini, selectionEnd: fim, value } = campo;
    const miolo = value.slice(ini, fim) || exemplo;
    const novo = value.slice(0, ini) + antes + miolo + depois + value.slice(fim);
    mudar('conteudo', novo);
    requestAnimationFrame(() => {
      campo.focus();
      campo.setSelectionRange(ini + antes.length, ini + antes.length + miolo.length);
    });
  }

  async function enviar(arquivo: File | undefined, destino: 'capa' | 'corpo') {
    if (!arquivo) return;
    setEnviando(destino);
    setResultado(null);
    try {
      const url = await enviarImagem(arquivo, usuarioId, 'artigos');
      if (destino === 'capa') mudar('capa_url', url);
      else formatar('\n![', `](${url})\n`, 'Descreva a imagem para quem não enxerga');
    } catch (erro) {
      setResultado({ ok: false, erro: erro instanceof Error ? erro.message : 'Falha no envio.' });
    } finally {
      setEnviando(null);
    }
  }

  function executar(acao: AcaoArtigo) {
    setResultado(null);
    iniciar(async () => {
      const res = await salvarArtigo(artigo.id, dados, acao);
      setResultado(res);
      if (res.ok) {
        if (acao === 'publicar') setStatus('publicado');
        if (acao === 'despublicar') setStatus('rascunho');
        if (res.slug) setSlug(res.slug);
      }
    });
  }

  function excluir() {
    setErroExclusao(null);
    iniciarExclusao(async () => {
      // Deu certo, a action redireciona para a lista e nada abaixo roda.
      const res = await excluirArtigo(artigo.id);
      if (!res.ok) setErroExclusao(res.erro);
    });
  }

  const publicado = status === 'publicado';

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        <label className="block">
          <span className="rotulo">Título</span>
          <input
            className="campo text-lg font-bold"
            value={dados.titulo}
            onChange={(e) => mudar('titulo', e.target.value)}
            maxLength={140}
            placeholder="Ex.: Santos em reconstrução: o que ainda falta"
          />
          {slug ? (
            <span className="dica">
              Endereço: <span className="text-zinc-300">/blog/{slug}</span> (fica fixo depois de publicado)
            </span>
          ) : (
            <span className="dica">O endereço da página é criado a partir do título na hora de publicar.</span>
          )}
        </label>

        <label className="block">
          <span className="rotulo">Resumo</span>
          <textarea
            className="campo min-h-[84px]"
            value={dados.resumo}
            onChange={(e) => mudar('resumo', e.target.value)}
            maxLength={300}
            placeholder="Uma ou duas frases. Aparece no card do blog e na prévia do WhatsApp."
          />
        </label>

        <div>
          <div className="flex flex-wrap items-center gap-2 border-b border-ink-line pb-3">
            <div role="tablist" className="mr-auto flex gap-1">
              {(['escrever', 'previa'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={aba === item}
                  onClick={() => setAba(item)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
                    aba === item ? 'bg-primary/15 text-primary' : 'text-muted hover:text-white'
                  }`}
                >
                  {item === 'escrever' ? 'Escrever' : 'Prévia'}
                </button>
              ))}
            </div>

            {aba === 'escrever' ? (
              <div className="flex flex-wrap gap-1">
                {formatos.map((f) => (
                  <button
                    key={f.rotulo}
                    type="button"
                    title={f.rotulo}
                    aria-label={f.rotulo}
                    onClick={() => formatar(f.antes, f.depois, f.exemplo)}
                    className="min-w-[36px] rounded-lg border border-ink-line px-2 py-1.5 text-xs font-bold text-zinc-300 hover:border-primary/50 hover:text-white"
                  >
                    {f.curto}
                  </button>
                ))}
                <label className="cursor-pointer rounded-lg border border-ink-line px-2 py-1.5 text-xs font-bold text-zinc-300 hover:border-primary/50 hover:text-white">
                  {enviando === 'corpo' ? 'Enviando...' : 'Imagem'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={enviando !== null}
                    onChange={(e) => {
                      enviar(e.target.files?.[0], 'corpo');
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            ) : null}
          </div>

          {aba === 'escrever' ? (
            <textarea
              ref={texto}
              aria-label="Texto do artigo"
              className="campo mt-3 min-h-[480px] font-mono text-[15px] leading-relaxed"
              value={dados.conteudo}
              onChange={(e) => mudar('conteudo', e.target.value)}
              placeholder={'Escreve aqui. Linha em branco separa parágrafo.\n\n## Subtítulo\n\nTexto com **negrito** e _itálico_.'}
            />
          ) : (
            <div className="article-body mt-6 min-h-[480px]">
              {dados.conteudo.trim() ? (
                <CorpoDoArtigo conteudo={dados.conteudo} />
              ) : (
                <p className="text-muted">Nada escrito ainda.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <aside className="space-y-6">
        <div className="card space-y-3 p-5">
          <p className="text-sm">
            <span className="text-muted">Situação: </span>
            <span className={`font-bold ${publicado ? 'text-emerald-400' : 'text-white'}`}>
              {publicado ? 'Publicado' : 'Rascunho'}
            </span>
          </p>

          <button
            type="button"
            className="btn-primary w-full"
            disabled={salvando || enviando !== null}
            onClick={() => executar(publicado ? 'salvar' : 'publicar')}
          >
            {salvando ? 'Salvando...' : publicado ? 'Atualizar artigo' : 'Publicar'}
          </button>

          {publicado ? (
            <>
              <button
                type="button"
                className="btn-ghost w-full"
                disabled={salvando}
                onClick={() => executar('despublicar')}
              >
                Tirar do ar
              </button>
              {slug ? (
                <Link href={`/blog/${slug}`} target="_blank" className="block text-center text-sm font-bold text-primary hover:underline">
                  Ver no blog ↗
                </Link>
              ) : null}
            </>
          ) : (
            <button
              type="button"
              className="btn-ghost w-full"
              disabled={salvando || enviando !== null}
              onClick={() => executar('salvar')}
            >
              Salvar rascunho
            </button>
          )}

          {resultado ? (
            <p
              role={resultado.ok ? 'status' : 'alert'}
              className={`text-sm font-medium ${resultado.ok ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {resultado.ok ? resultado.mensagem : resultado.erro}
            </p>
          ) : null}
        </div>

        <div className="card space-y-5 p-5">
          <label className="block">
            <span className="rotulo">Clube</span>
            <select className="campo" value={dados.clube} onChange={(e) => mudar('clube', e.target.value)}>
              <option value="">Geral (futebol como um todo)</option>
              {siglas.map((sigla) => (
                <option key={sigla} value={sigla}>
                  {clubes[sigla].nome}
                </option>
              ))}
            </select>
            <span className="dica">Arbitragem, CBF, calendário: use “Geral”.</span>
          </label>

          <label className="block">
            <span className="rotulo">Tags</span>
            <input
              className="campo"
              value={dados.tags}
              onChange={(e) => mudar('tags', e.target.value)}
              placeholder="análise, clássico"
            />
            <span className="dica">Separadas por vírgula.</span>
          </label>
        </div>

        <div className="card space-y-4 p-5">
          <span className="rotulo !mb-0">Capa</span>
          {dados.capa_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dados.capa_url}
              alt=""
              className="aspect-[16/9] w-full rounded-xl border border-ink-line object-cover"
            />
          ) : (
            <p className="text-xs text-muted">Sem capa, o artigo usa a arte padrão do site.</p>
          )}

          <div className="flex flex-wrap gap-2">
            <label className="btn-ghost cursor-pointer !px-4 !py-2 text-xs">
              {enviando === 'capa' ? 'Enviando...' : dados.capa_url ? 'Trocar capa' : 'Enviar capa'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={enviando !== null}
                onChange={(e) => {
                  enviar(e.target.files?.[0], 'capa');
                  e.target.value = '';
                }}
              />
            </label>
            {dados.capa_url ? (
              <button type="button" className="text-xs font-bold text-muted hover:text-white" onClick={() => mudar('capa_url', null)}>
                Remover
              </button>
            ) : null}
          </div>
          <span className="dica !mt-0">Horizontal (16:9). É cortada nas bordas para caber no card.</span>

          <label className="block">
            <span className="rotulo">Descrição da capa</span>
            <input
              className="campo"
              value={dados.capa_alt}
              onChange={(e) => mudar('capa_alt', e.target.value)}
              placeholder="O que aparece na foto"
            />
            <span className="dica">Para quem usa leitor de tela. Também vira a legenda.</span>
          </label>

          <label className="block">
            <span className="rotulo">Crédito da foto</span>
            <input
              className="campo"
              value={dados.capa_credito}
              onChange={(e) => mudar('capa_credito', e.target.value)}
              placeholder="Ex.: Fulano / Agência"
            />
            <span className="dica">Crédito não é licença: foto de agência precisa de contrato.</span>
          </label>
        </div>

        <button
          type="button"
          onClick={() => {
            setErroExclusao(null);
            setConfirmandoExclusao(true);
          }}
          disabled={salvando}
          className="w-full text-center text-xs font-bold text-red-400/80 hover:text-red-400"
        >
          Excluir artigo
        </button>

        <ModalConfirmacao
          aberto={confirmandoExclusao}
          titulo="Excluir este artigo?"
          rotuloConfirmar="Excluir de vez"
          rotuloOcupado="Excluindo..."
          ocupado={excluindo}
          erro={erroExclusao}
          onConfirmar={excluir}
          onFechar={() => setConfirmandoExclusao(false)}
        >
          <p>
            <strong className="text-white">{dados.titulo.trim() || 'Sem título'}</strong> vai ser
            apagado e não tem como desfazer.
          </p>
          {publicado ? (
            <p>Ele sai do blog na hora, e quem tiver o link vai cair numa página que não existe.</p>
          ) : null}
        </ModalConfirmacao>
      </aside>
    </div>
  );
}
