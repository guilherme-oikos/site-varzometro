'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * Toasts no padrão do shadcn/ui (`components/ui/sonner.tsx` de lá), sobre o
 * Sonner, com os tokens deste site no lugar das variáveis do shadcn. Só modo
 * escuro, como o site.
 *
 * No alto da tela e não embaixo: no bolão o pé da tela é do botão "Salvar
 * palpites", e no celular o toast cobriria o botão. O `offset` pula o header
 * fixo.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      offset={88}
      mobileOffset={{ top: 80 }}
      toastOptions={{
        classNames: {
          toast:
            '!rounded-xl !border !border-ink-line !bg-ink-elevated !text-white !shadow-xl font-sans',
          description: '!text-muted',
          success: '[&_[data-icon]]:!text-emerald-400',
          error: '!border-red-500/40 [&_[data-icon]]:!text-red-400',
        },
      }}
      {...props}
    />
  );
}

export { toast } from 'sonner';
