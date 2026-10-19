import type { Metadata } from 'next';
import AbasPainel from '@/components/painel/AbasPainel';
import { exigirSessao } from '@/lib/painel';
import { supabaseConfigurado } from '@/lib/supabase/config';

export const metadata: Metadata = {
  title: 'Painel da bancada',
  robots: { index: false, follow: false },
};

// Cada pessoa vê o próprio painel: nada aqui pode ir para o cache estático.
export const dynamic = 'force-dynamic';

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  if (!supabaseConfigurado) {
    return (
      <section className="container-page pb-24 pt-28 sm:pt-36">
        <p className="card p-6 text-sm text-muted">
          O painel precisa das variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      </section>
    );
  }

  const { perfil } = await exigirSessao();

  return (
    <section className="relative pb-24 pt-28 sm:pt-32">
      <div className="container-page">
        <p className="t-label mb-5 text-primary">Área da bancada</p>
        <AbasPainel admin={Boolean(perfil?.is_admin)} />

        {perfil ? (
          <div className="mt-8">{children}</div>
        ) : (
          <p className="card mt-8 p-6 text-sm text-muted">
            Seu login existe, mas ainda não tem perfil ligado a ele. Peça para quem administra o
            site criar o seu perfil.
          </p>
        )}
      </div>
    </section>
  );
}
