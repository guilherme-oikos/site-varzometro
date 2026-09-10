import { iconMap, MicIcon } from '@/components/Icons';
import { manifestoDestaques } from '@/lib/site';

export default function Manifesto() {
  return (
    <section
      id="manifesto"
      className="relative scroll-mt-24 border-y border-ink-line bg-ink-surface/40 py-20 sm:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 divider-glow"
      />

      <div className="container-page">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2 className="t-headline text-balance text-white">
              O futebol como ele é falado{' '}
              <span className="text-primary">na vida real</span>.
            </h2>

            <p className="t-lead medida-prosa mt-6 text-zinc-300">
              Cansamos das análises engessadas de quem usa terno para falar do
              jogo. O <strong className="text-primary">VARzômetro</strong> nasceu
              do desejo de trazer para a câmera a discussão real, com paixão,
              argumentos fortes e aquela zoeira saudável que só quem vive o
              futebol entende.
            </p>

            <div className="revelar mt-9 grid gap-3 sm:grid-cols-3">
              {manifestoDestaques.map((item) => {
                const Icon = iconMap[item.icone];

                return (
                  <div
                    key={item.titulo}
                    className="card card-hover flex flex-col gap-3 p-5"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-lg border border-primary/25 bg-primary/[0.08] text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="t-title text-white">
                      {item.titulo}
                    </h3>
                    <p className="t-body-sm text-muted">
                      {item.texto}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/*
            Sem cartão e sem atribuição em formato de depoimento: é o que o site
            diz de si mesmo, não uma citação de terceiro.
          */}
          <div className="lg:col-span-5">
            <div className="border-y border-ink-line py-8">
              <MicIcon className="h-6 w-6 text-primary" />
              <p className="mt-5 text-xl font-bold leading-snug text-white sm:text-2xl">
                Aqui ninguém precisa de gravata para dizer que o time jogou mal.
                A gente fala como fala no grupo do WhatsApp — só que com
                microfone ligado.
              </p>
              <p className="mt-5 text-xs text-muted">
                São Paulo · Corinthians · Palmeiras · Santos
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
