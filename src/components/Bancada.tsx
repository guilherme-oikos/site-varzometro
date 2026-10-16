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
          description="Cinco amigos, quatro clubes e zero concordância pacífica quando o assunto é o futebol de São Paulo. Passe o mouse ou toque no card para ver a ficha."
        />

        {/*
          Flex com quebra centralizada em vez de grid: com cinco cards, um grid
          deixaria o último sozinho encostado à esquerda. Assim fica 1 por linha
          no celular, 2+2+1 no tablet, 3+2 no notebook e os cinco lado a lado na
          tela grande — a linha incompleta sempre centralizada.
        */}
        <div className="revelar mt-14 flex flex-wrap justify-center gap-5">
          {bancada.map((membro) => (
            <div
              key={membro.nome}
              className="w-full max-w-sm sm:w-[calc((100%-1.25rem)/2)] sm:max-w-none lg:w-[calc((100%-2.5rem)/3)] xl:w-[calc((100%-5rem)/5)]"
            >
              <CardIntegrante
                membro={membro}
                temFoto={publicFileExists(membro.foto)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
