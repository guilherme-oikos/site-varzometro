/**
 * Fonte única de verdade do conteúdo do site.
 * Para trocar links, integrantes, episódios ou cortes, edite apenas este arquivo.
 */

export const site = {
  name: 'VARzômetro',
  shortDescription: 'O hub do futebol paulista sem filtro.',
  description:
    'Podcast sobre o futebol paulista feito por quatro torcedores dos 4 grandes de SP. Pré-jogo, pós-jogo, análises e resenha 100% autêntica.',
  /*
   * Com o "www" de propósito: o domínio sem www responde 308 e manda para cá.
   * Este valor vira canonical, sitemap e og:url, então precisa ser a URL que
   * devolve 200 — apontar para a que redireciona faz todo rastreador gastar um
   * salto à toa. Se um dia a Vercel passar a servir o domínio sem www como
   * principal, é aqui que muda.
   */
  url: 'https://www.varzometro.com.br',
  email: 'varzometropodcast@gmail.com',
  locale: 'pt-BR',
  /** Logo oficial (lockup horizontal) e ícone quadrado para favicon. */
  logo: '/logo.png',
  logoWidth: 806,
  logoHeight: 509,
  icone: '/icone.png',
} as const;

export const socials = {
  youtube: 'https://www.youtube.com/@VARz%C3%B4metroPodcast',
  spotify: 'https://open.spotify.com/show/6WfDPCAJMVbYaW4G24nv59',
  tiktok: 'https://www.tiktok.com/@varzometro',
  instagram: 'https://www.instagram.com/varzometro/',
} as const;

export const navLinks = [
  { label: 'Início', href: '/#inicio' },
  { label: 'O Projeto', href: '/#projeto' },
  { label: 'A Bancada', href: '/#bancada' },
  { label: 'Episódios', href: '/#episodios' },
  { label: 'Blog', href: '/blog' },
] as const;

/* ---------------------------------- Clubes --------------------------------- */

export type ClubeSigla = 'SPFC' | 'SCCP' | 'SEP' | 'SFC';

export type Clube = {
  nome: string;
  torcedor: string;
  /**
   * Classe do selo com a sigla (SPFC, SCCP...). Fonte única: vale no blog e nos
   * cards do topo. Antes o topo montava as cores inline e os dois desenhos
   * divergiam.
   */
  classe: string;
  /** Cor de destaque do clube, usada em borda, faixa e brilho. */
  cor: string;
  /** Cor do clube legivel como texto pequeno sobre grafite (min 4,5:1). */
  corTexto: string;
  /**
   * Cor da linha que fecha a capa nos cards do blog. Existe separada de `cor`
   * porque ali as duas únicas restrições são contrastar com o grafite do card
   * e não confundir Corinthians com Santos — decisões que não valem para o
   * brilho da bancada nem para a borda do topo, que continuam usando `cor`.
   */
  corLinha: string;
  /** Faixas da camisa/escudo, na ordem em que aparecem no card. */
  faixas: string[];
  /** Apelido curto usado no card do herói. */
  apelido: string;
};

export const clubes: Record<ClubeSigla, Clube> = {
  SPFC: {
    nome: 'São Paulo FC',
    torcedor: 'São-paulino',
    apelido: 'Tricolor',
    classe: 'bg-clube-spfc text-white border border-white/20',
    cor: '#E30613',
    // O vermelho do manto da 3,69:1 a 11px sobre grafite; este clareado da 6,5:1.
    corTexto: '#F05A63',
    corLinha: '#E30613',
    faixas: ['#E30613', '#FFFFFF', '#0B0B0B'],
  },
  SCCP: {
    nome: 'Corinthians',
    torcedor: 'Corintiano',
    apelido: 'Timão',
    classe: 'bg-[#0B0B0B] text-white border border-white/30',
    cor: '#FFFFFF',
    corTexto: '#FFFFFF',
    // O preto do Timão não existe sobre o grafite do card. Este cinza dá 3,73:1
    // contra o card — a mesma presença do vermelho do São Paulo, que é a régua
    // de "linha que se vê" aqui — e 4,83:1 contra o branco do Santos, que é de
    // quem ele precisa se diferenciar. Escurecer mais apaga a linha: #52525B
    // foi testado e sumiu.
    corLinha: '#71717A',
    faixas: ['#0B0B0B', '#FFFFFF'],
  },
  SEP: {
    nome: 'Palmeiras',
    torcedor: 'Palmeirense',
    apelido: 'Verdão',
    classe: 'bg-clube-sep text-white border border-white/20',
    cor: '#00A868',
    corTexto: '#00A868',
    corLinha: '#00A868',
    faixas: ['#006437', '#FFFFFF'],
  },
  SFC: {
    nome: 'Santos FC',
    torcedor: 'Santista',
    apelido: 'Peixe',
    // Santos é o único contornado em vez de preenchido. Preto e branco é a
    // identidade dele e a do Corinthians ao mesmo tempo; distinguir por
    // preenchido/contornado é mais firme do que por tom de cinza. E um pill
    // branco sólido sobre fundo grafite pesa mais que os outros três.
    classe: 'bg-[#D4D4D8]/10 text-[#D4D4D8] border border-[#D4D4D8]/35',
    cor: '#D4D4D8',
    corTexto: '#D4D4D8',
    corLinha: '#FFFFFF',
    faixas: ['#FFFFFF', '#0B0B0B', '#FFFFFF'],
  },
};

/* ---------------------------- Selo do artigo ------------------------------ */

/**
 * O que o card e o cabeçalho do artigo mostram: o clube, ou o selo geral.
 *
 * O selo geral existe porque nem todo artigo é de um clube. Texto sobre regra da
 * CBF, calendário, arbitragem ou dinheiro do futebol fala dos quatro ao mesmo
 * tempo, e carimbar um deles fura a regra editorial de equilíbrio do briefing —
 * o artigo apareceria no filtro de um clube só, e inflaria a conta dele.
 *
 * Também fecha um buraco silencioso: antes, cabeçalho sem `clube` virava São
 * Paulo por omissão, e sigla digitada errada derrubava o build.
 */
export type Selo = {
  sigla: string;
  nome: string;
  classe: string;
  corLinha: string;
};

const SELO_GERAL: Selo = {
  sigla: 'GERAL',
  nome: 'Futebol brasileiro',
  classe: 'bg-primary/15 text-primary border border-primary/40',
  /* Acompanha o `primary` do tailwind.config.ts — se o laranja mudar, muda aqui. */
  corLinha: '#E07C0A',
};

export function seloDoArtigo(sigla?: ClubeSigla): Selo {
  if (!sigla) return SELO_GERAL;
  const clube = clubes[sigla];
  return {
    sigla,
    nome: clube.nome,
    classe: clube.classe,
    corLinha: clube.corLinha,
  };
}

/** Valida a sigla do cabeçalho. Devolve `undefined` para vazio ou inválido. */
export function siglaDeClube(bruto: unknown): ClubeSigla | undefined {
  const sigla = String(bruto ?? '')
    .trim()
    .toUpperCase();
  if (!sigla) return undefined;
  if (sigla in clubes) return sigla as ClubeSigla;
  console.warn(
    `[posts] clube "${sigla}" não existe. Use SPFC, SCCP, SEP ou SFC, ` +
      `ou deixe o campo fora do cabeçalho para o artigo sair como geral.`,
  );
  return undefined;
}

/* --------------------------------- Pilares --------------------------------- */

export const pilares = [
  {
    icone: 'users' as const,
    titulo: 'Representatividade',
    texto:
      'Voz ativa para são-paulinos, corinthianos, palmeirenses e santistas. Toda torcida tem alguém falando por ela na mesa.',
  },
  {
    icone: 'whistle' as const,
    titulo: 'Sem Filtro Tático',
    texto:
      'Análise real da rodada, sem jargões rebuscados nem "futebolês" de TV para parecer mais inteligente do que é.',
  },
  {
    icone: 'calendar' as const,
    titulo: 'Pré e Pós-Jogo',
    texto:
      'Cobertura semanal completa: os jogos do meio de semana e a rodada do fim de semana, antes e depois de a bola rolar.',
  },
  {
    icone: 'beer' as const,
    titulo: 'Autenticidade',
    texto:
      'Uma mesa de bar gravada. O clima de papo direto entre quatro amigos que se conhecem e não se poupam.',
  },
];

/* -------------------------------- Manifesto -------------------------------- */

export const manifestoDestaques = [
  {
    icone: 'mic' as const,
    titulo: 'Resenha Raiz',
    texto:
      'Opinião sincera e sem rabo preso com diretoria, clube ou patrocinador.',
  },
  {
    icone: 'beer' as const,
    titulo: 'Mesa de Bar',
    texto:
      'O clima descontraído da resenha com os amigos, do jeito que acontece de verdade.',
  },
  {
    icone: 'stadium' as const,
    titulo: 'Visão de Arquibancada',
    texto:
      'Feito por torcedores apaixonados para torcedores. Sem terno, sem gravata.',
  },
];

/* --------------------------------- Bancada --------------------------------- */

export type Integrante = {
  nome: string;
  papel: string;
  funcao: string;
  clube: ClubeSigla;
  bio: string;
  foto?: string;
  /**
   * Foto só do avatar do blog, quando deve ser diferente da do card da bancada.
   * Sem ela, o blog usa `foto`.
   */
  fotoBlog?: string;
  iniciais: string;
};

export const bancada: Integrante[] = [
  {
    nome: 'GJ',
    papel: 'Âncora / Apresentador',
    funcao: 'Conduz o programa',
    clube: 'SPFC',
    iniciais: 'GJ',
    bio: 'O responsável por conduzir o programa, controlar os horários e equilibrar os ânimos quando a discussão esquenta.',
    foto: '/bancada/gj.jpg',
    fotoBlog: '/autores/gj.jpg',
  },
  {
    nome: 'Marti',
    papel: 'Comentarista',
    funcao: 'O gerador de cortes',
    clube: 'SCCP',
    iniciais: 'MA',
    bio: 'Argumentação forte, opiniões bem elaboradas e o especialista em gerar os momentos mais marcantes e os cortes do programa.',
    foto: '/bancada/marti.jpg',
    fotoBlog: '/autores/marti.jpg',
  },
  {
    nome: 'Vinícius',
    papel: 'Comentarista',
    funcao: 'Opiniões impopulares',
    clube: 'SEP',
    iniciais: 'VI',
    bio: 'O dono das visões fora da caixa, das opiniões impopulares e dos debates mais acalorados sobre a rodada.',
    foto: '/bancada/vinicius.jpg',
    fotoBlog: '/autores/vinicius.jpg',
  },
  {
    nome: 'Gê',
    papel: 'Comentarista',
    funcao: 'Paixão à flor da pele',
    clube: 'SEP',
    iniciais: 'GE',
    bio: 'A paixão à flor da pele, a defesa fervorosa do momento do clube e o combustível para as melhores provocações da mesa.',
    foto: '/bancada/ge.jpg',
    fotoBlog: '/autores/ge.jpg',
  },
];

/**
 * Quem escreve no blog sem estar na bancada.
 *
 * Esta lista existe **separada** de propósito: a seção "A Bancada" na home é
 * montada a partir de `bancada`, então incluir alguém lá daria a ele um card de
 * integrante automaticamente. Quem está aqui aparece só como autor de artigo —
 * foto no avatar, iniciais como reserva e a tag do clube.
 *
 * Se um convidado entrar para a bancada, mova o item para `bancada` e acrescente
 * `papel`, `funcao` e `bio`; os artigos antigos dele continuam funcionando, sem
 * precisar tocar em arquivo nenhum de `content/posts/`.
 */
export type Convidado = Pick<Integrante, 'nome' | 'clube' | 'foto' | 'fotoBlog' | 'iniciais'>;

export const convidados: Convidado[] = [
  {
    nome: 'Léo',
    clube: 'SFC',
    iniciais: 'LE',
    foto: '/autores/leo.jpg',
  },
];

/** Todo mundo que pode assinar um artigo — a bancada mais os convidados. */
export const autoresDoBlog: Convidado[] = [...bancada, ...convidados];


/* -------------------------------- Episódios -------------------------------- */

/**
 * Para publicar um episódio novo: copie o ID do vídeo no YouTube
 * (o trecho depois de "watch?v=") e adicione um item no topo da lista.
 * A capa e o link são montados sozinhos.
 */
export type Episodio = {
  numero: string;
  titulo: string;
  descricao: string;
  youtubeId: string;
  /** Opcional: aparece como selo sobre a capa. Ex.: '1h 12min'. */
  duracao?: string;
  /** Opcional: link direto do episódio no Spotify. Sem isso, abre o programa. */
  spotifyUrl?: string;
};

export const episodios: Episodio[] = [
  {
    numero: 'EP #16',
    titulo: 'Memphis volta e os paulistas avançam',
    descricao:
      'A volta de Memphis, o avanço dos times paulistas e o que muda na briga do estadual — com as quatro torcidas na mesa.',
    youtubeId: 'ja37DHDfGAA',
  },
  {
    numero: 'EP #15',
    titulo: 'Memphis fora, Palmeiras tropeça e São Paulo no caos',
    descricao:
      'Rodada de sustos: desfalque no Corinthians, tropeço do Palmeiras e mais um capítulo da crise tricolor.',
    youtubeId: 'uCfdapFEtTk',
  },
  {
    numero: 'EP #14',
    titulo: 'O Palmeiras está sendo beneficiado pela arbitragem?',
    descricao:
      'O debate mais quente da temporada. Cada torcedor defende o seu lado e ninguém sai ileso.',
    youtubeId: '6kmbrsjoies',
  },
  {
    numero: 'Especial',
    titulo: 'Quem vai vencer a Copa?',
    descricao:
      'A bancada crava os favoritos, as zebras e o campeão da Copa do Mundo. Guardem esse episódio.',
    youtubeId: 'p0hGsEK1-8w',
  },
];

/* ---------------------------- Cortes / Verticais --------------------------- */

/**
 * Cortes verticais. Duas formas de adicionar:
 *  1. Shorts do YouTube → preencha `youtubeId` (capa e link automáticos).
 *  2. TikTok/Instagram  → preencha `link` e `thumb` (imagem em /public/cortes).
 */
export type Corte = {
  titulo: string;
  youtubeId?: string;
  link?: string;
  thumb?: string;
  /** Opcional: selo de visualizações. Ex.: '12,4 mil'. */
  views?: string;
};

export const cortes: Corte[] = [
  {
    titulo: 'Cravamos tudo? A bancada revisita os palpites da Copa',
    youtubeId: 'kYa5kVgwk7I',
  },
  {
    titulo: 'Cravamos a Libertadores: quem vai ser campeão?',
    youtubeId: 'bw3lhWUzFcE',
  },
  {
    titulo: 'Palpites para as oitavas da Libertadores',
    youtubeId: '27rHh0AY--A',
  },
  {
    titulo: 'Palpites da rodada: Libertadores e Sul-Americana',
    youtubeId: 'edn1pxwdAc4',
  },
  {
    titulo: 'A LIBRA vai dar certo ou o futebol brasileiro segue uma bagunça?',
    youtubeId: 'LKvWM7fk8F4',
  },
  {
    titulo: 'Palpites da Copa do Brasil direto do podcast',
    youtubeId: 'qcnF3m5Tawc',
  },
];
