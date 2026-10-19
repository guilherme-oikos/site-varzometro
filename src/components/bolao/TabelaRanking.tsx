import AvatarAutor from '@/components/painel/AvatarAutor';
import SeloPontos from '@/components/bolao/SeloPontos';
import { posicoes, REGRAS, vezesPorFaixa, type LinhaRanking } from '@/lib/bolao';
import { seloDoArtigo, siglaDeClube } from '@/lib/site';

/**
 * Classificação do bolão. Empate em pontos é desfeito por placares exatos e
 * depois por resultados certos; empatou em tudo, divide a posição.
 *
 * Uma coluna por faixa de `REGRAS` (+5, +3, +2, +1), com o mesmo selo do
 * "Como pontua" no cabeçalho, para dar para ler de onde saiu cada ponto. Zero
 * fica apagado, para o que a pessoa acertou saltar aos olhos.
 */
export default function TabelaRanking({ ranking, meuId }: { ranking: LinhaRanking[]; meuId?: string }) {
  if (ranking.length === 0) {
    return <p className="card p-6 text-sm text-muted">Ninguém pontuou ainda. O ranking abre no primeiro jogo encerrado.</p>;
  }

  const lugares = posicoes(ranking);
  const lider = ranking[0].pontos > 0 ? ranking[0].pontos : null;

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink-line text-muted">
          <tr>
            <th scope="col" className="t-micro w-10 py-3 pl-3 uppercase sm:w-12 sm:pl-5">#</th>
            <th scope="col" className="t-micro w-full py-3 uppercase">Quem</th>
            {REGRAS.map((regra) => (
              <th key={regra.pontos} scope="col" className="w-9 px-0.5 py-3 text-center" title={regra.texto}>
                <SeloPontos pontos={regra.pontos} compacto />
                <span className="sr-only">{regra.texto}</span>
              </th>
            ))}
            <th scope="col" className="t-micro w-12 py-3 pl-2 pr-3 text-right uppercase sm:pr-5">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-line">
          {ranking.map((linha, indice) => {
            const meu = linha.autor_id === meuId;
            const selo = seloDoArtigo(siglaDeClube(linha.clube));
            const lidera = lider !== null && linha.pontos === lider;
            const vezes = vezesPorFaixa(linha);
            return (
              <tr key={linha.autor_id} className={meu ? 'bg-primary/[0.06]' : undefined}>
                <td className={`numerico py-3 pl-3 font-extrabold sm:pl-5 ${lidera ? 'text-primary' : 'text-zinc-400'}`}>
                  {lugares[indice]}º
                </td>
                <td className="max-w-0 py-3 pr-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <AvatarAutor
                      autor={{ iniciais: linha.iniciais, foto: linha.foto_blog_url ?? linha.foto_url }}
                      tamanho="h-8 w-8"
                    />
                    {/* Clube embaixo do nome: ao lado, disputaria espaço com as quatro colunas. */}
                    <div className="min-w-0">
                      <p className={`truncate font-bold leading-tight ${meu ? 'text-primary' : 'text-white'}`}>
                        {linha.nome}
                        {meu ? <span className="font-semibold text-muted"> (você)</span> : null}
                      </p>
                      <span className={`tag-clube ${selo.classe} mt-1 !px-1.5 !py-0 text-[0.5625rem]`}>{selo.sigla}</span>
                    </div>
                  </div>
                </td>
                {REGRAS.map((regra) => {
                  const n = vezes[regra.pontos];
                  return (
                    <td
                      key={regra.pontos}
                      className={`numerico px-0.5 py-3 text-center ${
                        n > 0 ? (regra.pontos === 5 ? 'font-bold text-primary' : 'font-semibold text-zinc-200') : 'text-zinc-600'
                      }`}
                    >
                      {n}
                    </td>
                  );
                })}
                <td className="numerico py-3 pl-2 pr-3 text-right text-lg font-extrabold text-white sm:pr-5">{linha.pontos}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
