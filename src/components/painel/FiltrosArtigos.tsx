'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import AvatarAutor from '@/components/painel/AvatarAutor';
import EsqueletoArtigos from '@/components/painel/EsqueletoArtigos';

export type AutorDoFiltro = {
  id: string;
  nome: string;
  iniciais: string;
  foto: string | null;
};

/**
 * Busca por título e, para o admin, filtro por integrante. Tudo mora na URL
 * (`?q=`, `?autor=`), então dá para voltar, recarregar ou mandar o link — e a
 * consulta em si roda no servidor, em `painel/page.tsx`.
 *
 * Mudar qualquer filtro volta para a página 1: ficar na página 3 de um
 * resultado que agora tem uma página só mostraria lista vazia.
 *
 * A lista vem como `children` para o esqueleto entrar no lugar dela no mesmo
 * instante do clique. O `Suspense` da página só mostraria o esqueleto depois
 * que o servidor começasse a responder — e até lá a lista velha ficava na
 * tela com o filtro novo já marcado, parecendo que o clique não pegou.
 */
export default function FiltrosArtigos({
  autores,
  children,
}: {
  autores: AutorDoFiltro[] | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const rota = usePathname();
  const params = useSearchParams();
  const [carregando, iniciar] = useTransition();

  const [autorAtual, setAutorAtual] = useState(params.get('autor') ?? '');
  const [busca, setBusca] = useState(params.get('q') ?? '');
  const ultimaBusca = useRef(busca);

  /*
   * Último estado pedido, e não o da URL: a URL só muda quando a navegação
   * termina. Clicar num integrante e logo digitar na busca montaria a segunda
   * URL a partir da antiga, e o filtro do integrante se perdia.
   */
  const pedido = useRef(params.toString());
  useEffect(() => {
    pedido.current = params.toString();
    setAutorAtual(params.get('autor') ?? '');
  }, [params]);

  const navegar = (mudancas: Record<string, string>) => {
    const novos = new URLSearchParams(pedido.current);
    for (const [chave, valor] of Object.entries(mudancas)) {
      if (valor) novos.set(chave, valor);
      else novos.delete(chave);
    }
    novos.delete('pagina');
    const texto = novos.toString();
    pedido.current = texto;
    iniciar(() => router.replace(texto ? `${rota}?${texto}` : rota, { scroll: false }));
  };

  // A URL mudou por fora (link "Limpar filtros", voltar do navegador): o campo
  // acompanha, senão mostraria um termo que não está mais filtrando nada.
  useEffect(() => {
    const daUrl = params.get('q') ?? '';
    if (daUrl !== ultimaBusca.current) {
      ultimaBusca.current = daUrl;
      setBusca(daUrl);
    }
  }, [params]);

  // Espera a pessoa parar de digitar antes de consultar o banco.
  useEffect(() => {
    const termo = busca.trim();
    if (termo === ultimaBusca.current) return;
    const espera = setTimeout(() => {
      ultimaBusca.current = termo;
      navegar({ q: termo });
    }, 350);
    return () => clearTimeout(espera);
    // `navegar` muda a cada render; só a busca deve disparar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  const chip = (ativo: boolean) =>
    `toque inline-flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-sm font-semibold transition-colors ${
      ativo
        ? 'border-primary/60 bg-primary/10 text-white'
        : 'border-ink-line bg-ink-surface text-zinc-400 hover:border-zinc-600 hover:text-white'
    }`;

  return (
    <>
      <div className="mt-8 space-y-4">
        <label className="relative block">
          <span className="sr-only">Buscar pelo título</span>
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar pelo título"
            className="campo !pl-11"
          />
        </label>

        {autores ? (
          // Rola de lado no celular em vez de quebrar em várias linhas.
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <button
              type="button"
              onClick={() => {
                setAutorAtual('');
                navegar({ autor: '' });
              }}
              aria-pressed={!autorAtual}
              className={`${chip(!autorAtual)} !pl-3.5`}
            >
              Todos
            </button>
            {autores.map((autor) => {
              const ativo = autorAtual === autor.id;
              return (
                <button
                  key={autor.id}
                  type="button"
                  onClick={() => {
                    setAutorAtual(ativo ? '' : autor.id);
                    navegar({ autor: ativo ? '' : autor.id });
                  }}
                  aria-pressed={ativo}
                  className={chip(ativo)}
                >
                  <AvatarAutor autor={autor} tamanho="h-6 w-6" />
                  {autor.nome}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div aria-busy={carregando}>
        {carregando ? <EsqueletoArtigos admin={Boolean(autores)} /> : children}
      </div>
    </>
  );
}
