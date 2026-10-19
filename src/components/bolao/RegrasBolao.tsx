import SeloPontos from '@/components/bolao/SeloPontos';
import { REGRAS } from '@/lib/bolao';

/** Como se pontua. O texto vem de `REGRAS`; a conta de verdade é do banco. */
export default function RegrasBolao({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <h3 className="t-label text-zinc-400">Como pontua</h3>
      <ul className="mt-3 space-y-2 text-sm text-zinc-300">
        {REGRAS.map((regra) => (
          <li key={regra.pontos} className="flex items-start gap-3">
            <SeloPontos pontos={regra.pontos} />
            <span>{regra.texto}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">
        Palpite vale até o apito inicial. Empate no ranking: desempata quem tem mais placares exatos,
        depois mais resultados certos.
      </p>
    </div>
  );
}
