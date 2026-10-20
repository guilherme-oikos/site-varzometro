'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { temCookieDeSessao } from '@/lib/usuario';

/** Evento que `PalpitesDoLogado` escuta para reler os próprios dados. */
export const EVENTO_ATUALIZAR = 'bolao:atualizar';

const INTERVALO_MS = 60 * 1000;

/**
 * Com jogo rolando, a página se refaz sozinha a cada minuto: placar parcial,
 * selos "se acabasse agora" e ranking ao vivo, sem ninguém apertar F5.
 *
 * Quem está logado também pede `/api/bolao/atualizar`, que busca o placar no
 * football-data se a última busca passou de 1 minuto (o servidor segura o
 * ritmo, então várias abas abertas não estouram a cota de lá). O visitante só
 * relê a página, que vem do cache do Next: não dispara consulta nenhuma no
 * football-data, como no resto do bolão. Placar novo para ele chega quando
 * alguém logado estiver com o bolão aberto, ou pelo cron.
 *
 * Quem decide se tem jogo rolando é o relógio do navegador, e não o servidor:
 * a página é estática e pode ter sido montada antes do apito. Por isso chegam
 * os horários dos próximos jogos, e não um "tem jogo agora".
 */
export default function AtualizarAoVivo({ inicios, janela }: { inicios: string[]; janela: number }) {
  const router = useRouter();

  useEffect(() => {
    if (inicios.length === 0) return;
    const comecos = inicios.map((inicio) => new Date(inicio).getTime());
    const rolando = () => {
      const agora = Date.now();
      return comecos.some((comeco) => comeco <= agora && agora < comeco + janela);
    };

    let ocupado = false;
    const tique = async () => {
      // Aba escondida não gasta nada; volta a atualizar quando reaparecer.
      if (ocupado || document.visibilityState !== 'visible' || !rolando()) return;
      ocupado = true;
      try {
        if (temCookieDeSessao()) {
          await fetch('/api/bolao/atualizar', { method: 'POST' }).catch(() => {});
        }
        router.refresh();
        window.dispatchEvent(new Event(EVENTO_ATUALIZAR));
      } finally {
        ocupado = false;
      }
    };

    const relogio = window.setInterval(tique, INTERVALO_MS);
    const aoVoltar = () => void tique();
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      window.clearInterval(relogio);
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, [inicios, janela, router]);

  return null;
}
