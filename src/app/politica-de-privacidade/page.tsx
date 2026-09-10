import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeftIcon, MailIcon } from '@/components/Icons';
import { site } from '@/lib/site';

/**
 * IMPORTANTE — este texto descreve o site como ele é hoje:
 * estático, sem formulário, sem login, sem analytics e sem cookies próprios.
 *
 * Se um dia forem adicionados Google Analytics, Meta Pixel, newsletter,
 * formulário de contato ou players incorporados (YouTube/Spotify dentro da
 * página), esta política precisa ser atualizada — e aí passa a ser necessário
 * um aviso de cookies. Atualize também a data em `ultimaAtualizacao`.
 */
const ultimaAtualizacao = '9 de setembro de 2026';

export const metadata: Metadata = {
  title: 'Política de Privacidade e Cookies',
  description:
    'Como o VARzômetro trata dados pessoais e cookies no site, em conformidade com a LGPD.',
  alternates: { canonical: '/politica-de-privacidade' },
  robots: { index: true, follow: true },
};

export default function PoliticaDePrivacidadePage() {
  return (
    <section className="relative pb-24 pt-28 sm:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-fade-primary"
      />

      <div className="container-page relative">
        <Link
          href="/"
          className="toque-linha inline-flex items-center gap-2 text-xs font-bold text-zinc-400 transition-colors hover:text-primary"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Voltar para a home
        </Link>

        <header className="medida-prosa mx-auto mt-8">
          <h1 className="t-page mt-4 text-balance text-white">
            Política de Privacidade e Cookies
          </h1>

          <p className="t-lead mt-5 text-muted">
            Em resumo: este site não pede cadastro, não tem formulário, não usa
            cookies próprios e não rastreia quem passa por aqui. O texto abaixo
            detalha isso.
          </p>

          <p className="mt-6 border-t border-ink-line pt-5 text-xs text-muted">
            Última atualização: {ultimaAtualizacao}
          </p>
        </header>

        <div className="article-body medida-prosa mx-auto mt-10">
          <h2>1. Quem somos</h2>
          <p>
            O <strong>{site.name}</strong> é um podcast independente sobre
            futebol, produzido por quatro amigos, sem fins comerciais no momento.
            Este site é o canal oficial do projeto na internet e reúne os
            episódios, os cortes e os artigos do blog.
          </p>
          <p>
            Para qualquer assunto relacionado a privacidade e dados pessoais, o
            contato é o e-mail{' '}
            <a href={`mailto:${site.email}`}>{site.email}</a>.
          </p>

          <h2>2. Que dados este site coleta</h2>
          <p>
            <strong>Nenhum dado pessoal é coletado diretamente por nós.</strong>{' '}
            O site é estático: não existe cadastro, login, formulário, carrinho,
            newsletter ou área restrita. Você navega, lê, clica nos links e vai
            embora — sem deixar dados conosco.
          </p>
          <p>
            Se você nos escrever por e-mail ou pelas redes sociais, aí sim
            teremos acesso ao que você mesmo enviar: seu nome, seu endereço de
            e-mail ou usuário e o conteúdo da mensagem. Usamos essas informações
            apenas para responder você e tratar do assunto da mensagem.
          </p>

          <h2>3. Dados coletados automaticamente pela hospedagem</h2>
          <p>
            Como acontece com qualquer site, o servidor que hospeda o{' '}
            {site.name} registra informações técnicas a cada visita, por
            necessidade de funcionamento e segurança:
          </p>
          <ul>
            <li>endereço IP;</li>
            <li>tipo de navegador e sistema operacional;</li>
            <li>páginas acessadas, data e horário do acesso;</li>
            <li>site de origem, quando você chega por um link.</li>
          </ul>
          <p>
            Esses registros ficam sob responsabilidade do provedor de hospedagem
            e servem para manter o site no ar, medir desempenho e prevenir abusos
            — nunca para identificar você individualmente ou montar perfis de
            comportamento. A base legal é o legítimo interesse, previsto no
            artigo 7º, inciso IX, da LGPD (Lei nº 13.709/2018).
          </p>

          <h2>4. Cookies</h2>
          <p>
            <strong>Este site não instala cookies próprios</strong> e não usa
            ferramentas de análise de audiência, remarketing ou publicidade
            comportamental. Não há rastreamento entre sites e não existe banner
            de consentimento porque não há o que consentir.
          </p>
          <p>
            Os links para YouTube, Spotify, TikTok e Instagram levam você para
            fora daqui. A partir do momento em que você clica e sai do nosso
            site, valem os cookies e as políticas de privacidade dessas
            plataformas — sobre as quais não temos qualquer controle.
          </p>
          <p>
            Você pode, a qualquer momento, bloquear ou apagar cookies nas
            configurações do seu navegador. Isso não afeta em nada o
            funcionamento deste site.
          </p>

          <h2>5. Conteúdo de terceiros</h2>
          <p>
            As capas dos episódios e dos cortes exibidas aqui são carregadas a
            partir dos servidores do YouTube. Ao abrir a página, seu navegador
            faz uma requisição a esses servidores, que podem registrar seu
            endereço IP, conforme a política de privacidade do Google. Nenhum
            vídeo é reproduzido dentro do nosso site: os players abrem sempre nas
            plataformas de origem.
          </p>

          <h2>6. Compartilhamento de dados</h2>
          <p>
            Não vendemos, alugamos, cedemos nem comercializamos dados pessoais.
            Como não coletamos dados por conta própria, não há o que
            compartilhar. Os registros técnicos citados no item 3 ficam
            exclusivamente com o provedor de hospedagem, no papel de operador.
          </p>

          <h2>7. Seus direitos</h2>
          <p>
            A LGPD garante a você, titular dos dados, o direito de confirmar se
            tratamos algum dado seu, acessá-lo, corrigi-lo, solicitar sua
            anonimização, bloqueio ou eliminação, revogar consentimento e pedir
            informações sobre compartilhamentos.
          </p>
          <p>
            Para exercer qualquer um desses direitos, escreva para{' '}
            <a href={`mailto:${site.email}`}>{site.email}</a>. Respondemos no
            menor prazo possível e, no máximo, em 15 dias.
          </p>

          <h2>8. Segurança e retenção</h2>
          <p>
            As mensagens que recebemos por e-mail ficam guardadas na conta de
            e-mail do projeto apenas enquanto forem necessárias para o assunto
            tratado, e são protegidas pelas medidas de segurança do próprio
            provedor de e-mail, incluindo autenticação em duas etapas.
          </p>

          <h2>9. Crianças e adolescentes</h2>
          <p>
            O conteúdo do {site.name} é voltado ao público adulto interessado em
            futebol. Não direcionamos o site a crianças nem coletamos
            conscientemente dados de menores de 18 anos.
          </p>

          <h2>10. Alterações desta política</h2>
          <p>
            Se o site passar a usar formulários, newsletter, players incorporados
            ou ferramentas de análise, esta política será atualizada antes da
            mudança entrar no ar, com nova data no topo do documento.
            Recomendamos reler esta página de tempos em tempos.
          </p>
        </div>

        <div className="medida-prosa mx-auto mt-14 rounded-2xl border border-ink-line bg-ink-surface p-7 sm:p-9">
          <h2 className="text-lg font-bold text-white sm:text-xl">
            Ficou alguma dúvida sobre privacidade?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Manda um e-mail para a bancada que a gente responde.
          </p>
          <a
            href={`mailto:${site.email}?subject=D%C3%BAvida%20sobre%20privacidade`}
            className="btn-primary mt-6 max-w-full !whitespace-normal [word-break:break-word]"
          >
            <MailIcon className="h-4 w-4" />
            {site.email}
          </a>
        </div>
      </div>
    </section>
  );
}
