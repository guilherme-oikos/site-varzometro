'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { sair } from '@/app/painel/actions';
import { clubes, siglaDeClube } from '@/lib/site';
import { temCookieDeSessao, usuarioDoEmail } from '@/lib/usuario';

type PerfilLogado = {
  nome: string;
  iniciais: string;
  clube: string;
  papel: string;
  foto: string | null;
  usuario: string | undefined;
  admin: boolean;
};

/**
 * Botão com a foto (ou as iniciais) de quem está logado, no header do site
 * inteiro. Abre um cartão com nome, clube e usuário, e os atalhos do painel.
 *
 * Roda só no navegador e só para quem tem o cookie de sessão. A página pública
 * continua estática e sem cookie para visitante (ver CLAUDE.md): sem o cookie,
 * o componente não renderiza nada e nem baixa o cliente do Supabase — o import
 * é dinâmico justamente para não pesar no carregamento de quem só está lendo.
 *
 * `getSession` lê o cookie sem validar no servidor do Supabase. Aqui basta: é
 * só exibição, e o perfil é de leitura pública. Quem protege o painel é o
 * middleware e o `exigirSessao`, que usam `getUser`.
 */
export default function MenuPerfil() {
  const [perfil, setPerfil] = useState<PerfilLogado | null>(null);
  const [aberto, setAberto] = useState(false);
  const rota = usePathname();
  const caixa = useRef<HTMLDivElement>(null);

  // Confere de novo a cada troca de página: entrar e sair redirecionam, e o
  // header não é montado de novo entre uma rota e outra.
  useEffect(() => {
    setAberto(false);

    if (!temCookieDeSessao()) {
      setPerfil(null);
      return;
    }

    let cancelado = false;

    (async () => {
      try {
        const { supabaseNavegador } = await import('@/lib/supabase/navegador');
        const supabase = supabaseNavegador();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          if (!cancelado) setPerfil(null);
          return;
        }

        const { data } = await supabase
          .from('perfis')
          .select('nome, iniciais, clube, papel, foto_url, foto_blog_url, is_admin')
          .eq('id', session.user.id)
          .maybeSingle();

        if (cancelado) return;

        setPerfil({
          nome: data?.nome ?? usuarioDoEmail(session.user.email) ?? 'Bancada',
          iniciais: data?.iniciais ?? '?',
          clube: data?.clube ?? '',
          papel: data?.papel ?? '',
          // A quadrada do blog cabe melhor no círculo do que a vertical do card.
          foto: data?.foto_blog_url ?? data?.foto_url ?? null,
          usuario: usuarioDoEmail(session.user.email),
          admin: Boolean(data?.is_admin),
        });
      } catch {
        // Sem Supabase configurado ou sem rede: o header segue sem o botão.
        if (!cancelado) setPerfil(null);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [rota]);

  // Fecha ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!aberto) return;

    const clique = (evento: MouseEvent) => {
      if (!caixa.current?.contains(evento.target as Node)) setAberto(false);
    };
    const tecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAberto(false);
    };

    document.addEventListener('mousedown', clique);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', clique);
      document.removeEventListener('keydown', tecla);
    };
  }, [aberto]);

  if (!perfil) return null;

  const clube = clubes[siglaDeClube(perfil.clube) ?? 'SPFC'];
  const temClube = Boolean(siglaDeClube(perfil.clube));

  const avatar = (tamanho: string) =>
    perfil.foto ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={perfil.foto} alt="" className={`${tamanho} rounded-full object-cover`} />
    ) : (
      <span
        className={`${tamanho} grid place-items-center rounded-full bg-primary/15 text-xs font-extrabold text-primary`}
      >
        {perfil.iniciais}
      </span>
    );

  const linkMenu =
    'flex items-center rounded-lg px-3 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white';

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        aria-label={`Seu perfil: ${perfil.nome}`}
        aria-expanded={aberto}
        aria-haspopup="true"
        className={`grid h-11 w-11 place-items-center rounded-xl border bg-ink-surface transition-colors ${
          aberto ? 'border-primary/60' : 'border-ink-line hover:border-primary/40'
        }`}
      >
        {avatar('h-8 w-8')}
      </button>

      {aberto ? (
        <div className="card absolute right-0 top-[calc(100%+10px)] w-72 p-2">
          <div className="flex items-center gap-3 border-b border-ink-line px-3 pb-4 pt-3">
            {avatar('h-12 w-12 shrink-0')}
            <div className="min-w-0">
              <p className="truncate font-bold text-white">{perfil.nome}</p>
              {perfil.usuario ? (
                <p className="truncate text-xs text-muted">@{perfil.usuario}</p>
              ) : null}
              <p className="mt-1 truncate text-xs text-zinc-400">
                {[perfil.papel, temClube ? clube.torcedor : null, perfil.admin ? 'Admin' : null]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>

          <nav aria-label="Seu perfil" className="flex flex-col py-2">
            <Link href="/painel/perfil" className={linkMenu}>
              Meu perfil
            </Link>
            <Link href="/painel" className={linkMenu}>
              Meus artigos
            </Link>
            <Link href="/bolao" className={linkMenu}>
              Bolão
            </Link>
          </nav>

          <form action={sair} className="border-t border-ink-line pt-2">
            <button type="submit" className={`${linkMenu} w-full text-zinc-400`}>
              Sair
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
