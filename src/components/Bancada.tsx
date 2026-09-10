import SectionHeading from '@/components/SectionHeading';
import CardIntegrante from '@/components/CardIntegrante';
import { bancada } from '@/lib/site';
import { publicFileExists } from '@/lib/media';

export default function Bancada() {
  return (
    <section id="bancada" className="relative scroll-mt-24 py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading
          title={
            <>
              Quem senta na <span className="text-primary">mesa</span>
            </>
          }
          description="Quatro amigos, quatro clubes e zero concordância pacífica quando o assunto é o futebol de São Paulo. Passe o mouse ou toque no card para ver a ficha."
        />

        <div className="revelar mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {bancada.map((membro) => (
            <CardIntegrante
              key={membro.nome}
              membro={membro}
              temFoto={publicFileExists(membro.foto)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
