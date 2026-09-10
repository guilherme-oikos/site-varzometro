'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckIcon, CopyIcon } from '@/components/Icons';

/*
 * O e-mail continua sendo um `mailto` — quem tem cliente de e-mail configurado
 * clica e escreve. O botão de copiar existe para quem não tem: no desktop um
 * `mailto` sem cliente padrão simplesmente não faz nada, e a pessoa fica sem
 * saber se o clique funcionou.
 *
 * O retorno é a própria palavra mudando no lugar do ícone, não um balão que
 * aparece por cima. E volta sozinho: confirmação que exige ser fechada é mais
 * trabalho do que a ação que ela confirma.
 */
export default function CopiarEmail({ email }: { email: string }) {
  const [copiado, setCopiado] = useState(false);
  const relogioRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (relogioRef.current) clearTimeout(relogioRef.current);
    },
    [],
  );

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // Sem permissão de área de transferência (contexto inseguro, navegador
      // antigo) não há o que fazer aqui: o `mailto` ao lado continua de pé e
      // o e-mail está escrito na tela para selecionar à mão.
      return;
    }

    setCopiado(true);
    if (relogioRef.current) clearTimeout(relogioRef.current);
    relogioRef.current = setTimeout(() => setCopiado(false), 2200);
  };

  return (
    <button
      type="button"
      onClick={copiar}
      className="toque inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-semibold text-muted transition-colors duration-200 hover:text-primary"
    >
      {copiado ? (
        <CheckIcon className="h-3.5 w-3.5 text-primary" />
      ) : (
        <CopyIcon className="h-3.5 w-3.5" />
      )}
      {copiado ? 'Copiado' : 'Copiar'}

      {/*
        A mudança visual é rápida demais para um leitor de tela acompanhar pelo
        rótulo. Esta região anuncia o resultado uma vez, e só ela.
      */}
      <span role="status" aria-live="polite" className="sr-only">
        {copiado ? `${email} copiado para a área de transferência` : ''}
      </span>
    </button>
  );
}
