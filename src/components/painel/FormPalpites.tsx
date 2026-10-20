'use client';

import { useMemo, useState, useTransition } from 'react';
import { salvarPalpites } from '@/app/painel/actions';
import CardJogo from '@/components/bolao/CardJogo';
import { EVENTO_PALPITES_SALVOS } from '@/components/bolao/LembretePalpite';
import { SpinnerIcon } from '@/components/Icons';
import CorrecaoJogo from '@/components/painel/CorrecaoJogo';
import { toast } from '@/components/ui/sonner';
import { jogoAberto, quandoE, RESENHA_MAX, type AutorDoBolao, type Jogo, type Palpite } from '@/lib/bolao';

type Rascunho = Record<number, { mandante: string; visitante: string; resenha: string; dobrado: boolean }>;

/**
 * Os jogos da rodada com os campos do palpite. Jogo aberto mostra os campos;
 * jogo que já começou mostra o palpite de todo mundo e os pontos.
 *
 * Não é `<form>`: a correção do admin fica dentro de cada card e tem o próprio
 * formulário, e formulário dentro de formulário é HTML inválido. O botão chama
 * a Server Action direto, como o editor de perfil.
 *
 * Cada jogo aberto tem também a resenha (frase curta) e a zebra (vale o
 * dobro). Zebra é uma por rodada: marcar uma desmarca a outra da mesma
 * rodada, como o trigger do banco faz.
 */
export default function FormPalpites({
  jogos,
  palpites,
  quemPalpitou,
  autores,
  meuId,
  admin,
  agora,
  mostrarRodada = false,
}: {
  jogos: Jogo[];
  palpites: Palpite[];
  quemPalpitou: { jogo_id: number; autor_id: string }[];
  autores: AutorDoBolao[];
  meuId: string;
  admin: boolean;
  agora: number;
  mostrarRodada?: boolean;
}) {
  const inicial = useMemo(() => {
    const valores: Rascunho = {};
    for (const jogo of jogos) {
      const meu = palpites.find((p) => p.jogo_id === jogo.id && p.autor_id === meuId);
      valores[jogo.id] = {
        mandante: meu ? String(meu.gols_mandante) : '',
        visitante: meu ? String(meu.gols_visitante) : '',
        resenha: meu?.resenha ?? '',
        dobrado: meu?.dobrado ?? false,
      };
    }
    return valores;
  }, [jogos, palpites, meuId]);

  const [rascunho, setRascunho] = useState<Rascunho>(inicial);
  const [salvo, setSalvo] = useState<Rascunho>(inicial);
  const [salvando, iniciar] = useTransition();

  const abertos = jogos.filter((jogo) => jogoAberto(jogo, agora));
  const mudou = abertos.some((jogo) => {
    const atual = rascunho[jogo.id];
    const antes = salvo[jogo.id];
    return (
      atual?.mandante !== antes?.mandante ||
      atual?.visitante !== antes?.visitante ||
      atual?.resenha.trim() !== antes?.resenha.trim() ||
      atual?.dobrado !== antes?.dobrado
    );
  });

  // Zebra de jogo que já começou fica presa: a rodada dela não aceita outra.
  const zebraTravada = (rodada: number) =>
    jogos.find(
      (jogo) =>
        jogo.rodada === rodada &&
        !jogoAberto(jogo, agora) &&
        palpites.some((p) => p.jogo_id === jogo.id && p.autor_id === meuId && p.dobrado),
    );

  const mudar = (id: number, lado: 'mandante' | 'visitante', valor: string) => {
    // Só dígito, no máximo dois. O teclado numérico do celular ainda deixa
    // passar vírgula e sinal.
    const limpo = valor.replace(/\D/g, '').slice(0, 2);
    setRascunho((atual) => ({ ...atual, [id]: { ...atual[id], [lado]: limpo } }));
  };

  const mudarResenha = (id: number, valor: string) => {
    setRascunho((atual) => ({ ...atual, [id]: { ...atual[id], resenha: valor.slice(0, RESENHA_MAX) } }));
  };

  const alternarZebra = (jogo: Jogo) => {
    setRascunho((atual) => {
      const ligar = !atual[jogo.id]?.dobrado;
      const proximo = { ...atual };
      for (const outro of jogos) {
        if (outro.rodada !== jogo.rodada || !proximo[outro.id]) continue;
        proximo[outro.id] = { ...proximo[outro.id], dobrado: outro.id === jogo.id ? ligar : false };
      }
      return proximo;
    });
  };

  const salvar = () =>
    iniciar(async () => {
      const lista = abertos.map((jogo) => ({
        jogo_id: jogo.id,
        gols_mandante: rascunho[jogo.id]?.mandante ?? '',
        gols_visitante: rascunho[jogo.id]?.visitante ?? '',
        resenha: rascunho[jogo.id]?.resenha ?? '',
        dobrado: rascunho[jogo.id]?.dobrado ?? false,
      }));
      try {
        const resposta = await salvarPalpites(lista);
        if (resposta.ok) {
          setSalvo(rascunho);
          toast.success(resposta.mensagem, { description: 'Dá para mudar até o apito de cada jogo.' });
        } else {
          toast.error('Não deu para salvar', { description: resposta.erro });
        }
        // Mesmo com erro parcial, parte entrou: o lembrete do topo se refaz.
        window.dispatchEvent(new Event(EVENTO_PALPITES_SALVOS));
      } catch {
        // A action nem respondeu: sem rede, ou o servidor caiu no meio.
        toast.error('Não deu para salvar', { description: 'Sem conexão com o servidor. Confira a internet e tente de novo.' });
      }
    });

  const campo = (jogo: Jogo, lado: 'mandante' | 'visitante') => (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      aria-label={`Gols do ${lado === 'mandante' ? jogo.mandante : jogo.visitante}`}
      value={rascunho[jogo.id]?.[lado] ?? ''}
      onChange={(evento) => mudar(jogo.id, lado, evento.target.value)}
      className="campo numerico !w-14 !px-0 text-center text-lg font-extrabold"
    />
  );

  return (
    <>
      {/* O resultado de salvar sai em toast (Sonner, como no shadcn). O <Toaster> fica em `PalpitesDoLogado`. */}
      <ul className="space-y-3">
        {jogos.map((jogo) => {
          const aberto = jogoAberto(jogo, agora);
          const meu = palpites.find((p) => p.jogo_id === jogo.id && p.autor_id === meuId);

          return (
            <li key={jogo.id}>
              <CardJogo
                jogo={jogo}
                autores={autores}
                palpites={palpites.filter((p) => p.jogo_id === jogo.id)}
                quemPalpitou={quemPalpitou.filter((q) => q.jogo_id === jogo.id).map((q) => q.autor_id)}
                meuId={meuId}
                agora={agora}
                mostrarRodada={mostrarRodada}
                centro={
                  aberto ? (
                    <div className="flex items-center gap-2">
                      {campo(jogo, 'mandante')}
                      <span className="text-zinc-600">x</span>
                      {campo(jogo, 'visitante')}
                    </div>
                  ) : undefined
                }
                rodape={
                  <>
                    {aberto ? (
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          type="text"
                          maxLength={RESENHA_MAX}
                          autoComplete="off"
                          aria-label={`Resenha do palpite em ${jogo.mandante} x ${jogo.visitante}`}
                          placeholder="Resenha (opcional): só aparece no apito"
                          value={rascunho[jogo.id]?.resenha ?? ''}
                          onChange={(evento) => mudarResenha(jogo.id, evento.target.value)}
                          // 16px no celular: abaixo disso o iPhone dá zoom ao focar o campo.
                          className="campo min-w-0 flex-1 !py-2 sm:text-sm"
                        />
                        {zebraTravada(jogo.rodada) ? null : (
                          <button
                            type="button"
                            onClick={() => alternarZebra(jogo)}
                            aria-pressed={rascunho[jogo.id]?.dobrado ?? false}
                            title="Zebra da rodada: este jogo vale o dobro. Uma por rodada."
                            className={`toque inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                              rascunho[jogo.id]?.dobrado
                                ? 'border-primary bg-primary text-ink'
                                : 'border-ink-line text-zinc-300 hover:border-primary/60 hover:text-white'
                            }`}
                          >
                            <span className="numerico">2x</span> Zebra
                          </button>
                        )}
                      </div>
                    ) : null}
                    {aberto && zebraTravada(jogo.rodada) ? (
                      // Sem botão desabilitado mudo: o motivo só aparecia no `title`, que no celular nem existe.
                      <p className="mt-2 text-xs text-muted">
                        <span className="numerico font-bold text-primary">2x</span> Sua zebra da rodada {jogo.rodada} já foi em{' '}
                        {zebraTravada(jogo.rodada)!.mandante} x {zebraTravada(jogo.rodada)!.visitante}, que já começou.
                      </p>
                    ) : null}
                    {aberto ? (
                      <p className="mt-3 text-center text-xs text-muted">
                        Palpite vale até o apito: {quandoE(jogo.inicio)}
                        {meu ? null : <span className="text-primary"> · você ainda não palpitou</span>}
                      </p>
                    ) : null}
                    {admin ? <CorrecaoJogo jogo={jogo} /> : null}
                  </>
                }
              />
            </li>
          );
        })}
      </ul>

      {abertos.length > 0 ? (
        // Grudado no pé da tela: com dez jogos, o botão no fim da lista some.
        <div className="sticky bottom-4 z-10 mt-6">
          <div className="card flex flex-wrap items-center gap-x-4 gap-y-2 border-primary/30 bg-ink-surface/95 p-3 backdrop-blur sm:p-4">
            <button
              type="button"
              onClick={salvar}
              disabled={salvando || !mudou}
              aria-busy={salvando}
              className="btn-primary disabled:opacity-50"
            >
              {salvando ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : null}
              {salvando ? 'Salvando...' : 'Salvar palpites'}
            </button>
            <p className="text-sm text-muted">{mudou ? 'Tem palpite sem salvar.' : 'Tudo salvo.'}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
