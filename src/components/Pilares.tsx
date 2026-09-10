import SectionHeading from '@/components/SectionHeading';
import { iconMap } from '@/components/Icons';
import { pilares } from '@/lib/site';

export default function Pilares() {
  return (
    <section id="projeto" className="relative scroll-mt-24 py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading
          title={
            <>
              Os 4 pilares da <span className="text-primary">bancada</span>
            </>
          }
          description="Quatro princípios com o mesmo peso — do mesmo jeito que as quatro torcidas têm o mesmo espaço na mesa."
        />

        <div className="revelar mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pilares.map((pilar) => {
            const Icon = iconMap[pilar.icone];

            return (
              <article
                key={pilar.titulo}
                className="card card-hover group relative flex flex-col overflow-hidden p-6 sm:p-7"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px w-full divider-glow opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />

                <span className="grid h-12 w-12 place-items-center rounded-xl border border-primary/25 bg-primary/[0.08] text-primary transition-colors duration-300 group-hover:bg-primary/15">
                  <Icon className="h-6 w-6" />
                </span>

                <h3 className="t-title mt-6 text-white">
                  {pilar.titulo}
                </h3>
                <p className="t-body-sm mt-2.5 text-muted">
                  {pilar.texto}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
