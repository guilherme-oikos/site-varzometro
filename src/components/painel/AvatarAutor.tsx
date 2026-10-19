/** Foto redonda do autor, ou as iniciais quando não tem foto. Usada nos filtros e nos badges do painel. */
export default function AvatarAutor({
  autor,
  tamanho,
}: {
  autor: { iniciais: string; foto: string | null };
  tamanho: string;
}) {
  return autor.foto ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={autor.foto} alt="" className={`${tamanho} shrink-0 rounded-full object-cover`} />
  ) : (
    <span
      aria-hidden
      className={`${tamanho} grid shrink-0 place-items-center rounded-full bg-primary/15 text-[0.625rem] font-extrabold text-primary`}
    >
      {autor.iniciais}
    </span>
  );
}
