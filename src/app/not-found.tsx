import Link from 'next/link';
import { BallIcon } from '@/components/Icons';

export default function NotFound() {
  return (
    <section className="container-page grid min-h-[70vh] place-items-center py-24 text-center">
      <div className="max-w-md">
        <BallIcon className="mx-auto h-12 w-12 text-primary" />

        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white">
          Impedimento.
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-muted">
          O VAR conferiu e essa página não existe. Volte para o começo e siga a
          resenha por lá.
        </p>

        <Link href="/" className="btn-primary mt-8">
          Voltar para o início
        </Link>
      </div>
    </section>
  );
}
