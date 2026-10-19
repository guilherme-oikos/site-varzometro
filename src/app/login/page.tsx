import type { Metadata } from 'next';
import FormEntrar from '@/components/painel/FormEntrar';
import { site } from '@/lib/site';
import { supabaseConfigurado } from '@/lib/supabase/config';

export const metadata: Metadata = {
  title: 'Entrar',
  robots: { index: false, follow: false },
};

export default function EntrarPage() {
  return (
    <section className="relative pb-24 pt-28 sm:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-fade-primary" />

      <div className="container-page relative max-w-md">
        <h1 className="t-page text-white">
          Área da <span className="text-primary">bancada</span>
        </h1>
        <p className="t-lead mt-4 text-muted">
          Entra aí para editar seu perfil, publicar seus artigos e cravar seus palpites no bolão.
        </p>

        {supabaseConfigurado ? (
          <FormEntrar />
        ) : (
          <p className="card mt-8 p-6 text-sm text-muted">
            O login ainda não está ligado: faltam as variáveis do Supabase no servidor.
          </p>
        )}

        <p className="mt-6 text-sm text-muted">
          Esqueceu a senha ou ainda não tem conta? Fala com quem administra o site
          ou manda um e-mail para{' '}
          <a href={`mailto:${site.email}`} className="text-primary hover:underline">
            {site.email}
          </a>
          .
        </p>
      </div>
    </section>
  );
}
