'use client';

import { useMemo, useState, useTransition } from 'react';
import { salvarPalpites, type Resultado } from '@/app/painel/actions';
import CardJogo from '@/components/bolao/CardJogo';
import CorrecaoJogo from '@/components/painel/CorrecaoJogo';
import { jogoAberto, quandoE, type AutorDoBolao, type Jogo, type Palpite } from '@/lib/bolao';

type Rascunho = Record<number, { mandante: string; visitante: string }>;

/**
 * Os jogos da rodada com os campos do palpite. Jogo aberto mostra os campos;
 * jogo que já começou mostra o palpite de todo mundo e os pontos.
 *
 * Não é `<form>`: a correção do admin fica dentro de cada card e tem o próprio
 * formulário, e formulário dentro de formulário é HTML inválido. O botão chama
 * a Server Action direto, como o editor de perfil.
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
      };
    }
    return valores;
  }, [jogos, palpites, meuId]);

  const [rascunho, setRascunho] = useState<Rascunho>(inicial);
  const [salvo, setSalvo] = useState<Rascunho>(inicial);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [salvando, iniciar] = useTransition();

  const abertos = jogos.filter((jogo) => jogoAberto(jogo, agora));
  const mudou = abertos.some(
    (jogo) =>
      rascunho[jogo.id]?.mandante !== salvo[jogo.id]?.mandante ||
      rascunho[jogo.id]?.visitante !== salvo[jogo.id]?.visitante,
  );

  const mudar = (id: number, lado: 'mandante' | 'visitante', valor: string) => {
    // Só dígito, no máximo dois. O teclado numérico do celular ainda deixa
    // passar vírgula e sinal.
    const limpo = valor.replace(/\D/g, '').slice(0, 2);
    setRascunho((atual) => ({ ...atual, [id]: { ...atual[id], [lado]: limpo } }));
    setResultado(null);
  };

  const salvar = () =>
    iniciar(async () => {
      const lista = abertos.map((jogo) => ({
        jogo_id: jogo.id,
        gols_mandante: rascunho[jogo.id]?.mandante ?? '',
        gols_visitante: rascunho[jogo.id]?.visitante ?? '',
      }));
      const resposta = await salvarPalpites(lista);
      setResultado(resposta);
      if (resposta.ok) setSalvo(rascunho);
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
            <button type="button" onClick={salvar} disabled={salvando || !mudou} className="btn-primary disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar palpites'}
            </button>
            {resultado ? (
              <p
                role={resultado.ok ? 'status' : 'alert'}
                className={`text-sm font-medium ${resultado.ok ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {resultado.ok ? resultado.mensagem : resultado.erro}
              </p>
            ) : (
              <p className="text-sm text-muted">{mudou ? 'Tem palpite sem salvar.' : 'Tudo salvo.'}</p>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
