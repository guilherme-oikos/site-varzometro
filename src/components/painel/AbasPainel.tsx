'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Abas do painel. Quem é a pessoa logada já aparece no botão de perfil do
 * header (`MenuPerfil`), junto com o "Sair" — aqui fica só a navegação entre
 * as áreas, com a mesma marca laranja do menu principal do site.
 */
export default function AbasPainel({ admin }: { admin: boolean }) {
  const rota = usePathname();

  const abas = [
    {
      href: '/painel',
      label: admin ? 'Artigos' : 'Meus artigos',
      // O editor de um artigo continua dentro da aba de artigos.
      ativa: rota === '/painel' || rota.startsWith('/painel/artigos'),
    },
    // O palpite é na própria página pública do bolão.
    { href: '/bolao', label: 'Bolão', ativa: false },
    { href: '/painel/perfil', label: 'Meu perfil', ativa: rota.startsWith('/painel/perfil') },
  ];

  return (
    <nav aria-label="Painel" className="flex gap-6 border-b border-ink-line">
      {abas.map((aba) => (
        <Link
          key={aba.href}
          href={aba.href}
          aria-current={aba.ativa ? 'page' : undefined}
          className={`toque relative inline-flex items-center pb-3.5 text-sm font-bold transition-colors ${
            aba.ativa ? 'text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          {aba.label}
          <span
            aria-hidden
            className={`absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-primary transition-transform duration-300 ease-smooth ${
              aba.ativa ? 'scale-x-100' : 'scale-x-0'
            }`}
          />
        </Link>
      ))}
    </nav>
  );
}
