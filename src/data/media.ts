import { articles } from "./articles";

/** Capa exclusiva por manchete — evita que itens vizinhos do carrossel
 *  compartilhem a mesma imagem (a manchete muda mas a capa fica igual). */
const cover = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?w=800&q=80`;

const covers = {
  code: cover("photo-1498050108023-c5249f4df085"),
  chip: cover("photo-1518770660439-4636190af475"),
  cinema: cover("photo-1489599849927-2ee91cede3ba"),
  docs: cover("photo-1450101499163-c8848c66ca85"),
  dataCenter: cover("photo-1558494949-ef010cbdcc31"),
  team: cover("photo-1522071820081-009f0129c71c"),
  healthAi: cover("photo-1576091160399-112ba8d25d1d"),
  theater: cover("photo-1517604931442-7e0c8ed2963c"),
  solar: cover("photo-1509391366360-2e959784a276"),
  mic: cover("photo-1478737270239-2f02b77fc618"),
  news: cover("photo-1504711434969-e33886168f5c"),
  matrix: cover("photo-1526374965328-7f61d4dc18c5"),
  festival: cover("photo-1533174072545-7a4b6ad7a6c3"),
  studio: cover("photo-1590602847861-f357a9332bbc"),
} as const;

export const socialMedia = [
  { id: "reel-1", title: "Inteligência artificial na saúde", category: "Tecnologia", image: covers.healthAi, duration: "0:42" },
  { id: "reel-2", title: "Cinema nacional em destaque", category: "Entretenimento", image: covers.theater, duration: "0:36" },
  { id: "reel-3", title: "Energia solar brasileira", category: "Tecnologia", image: covers.solar, duration: "0:51" },
  { id: "reel-4", title: "Bastidores da redação", category: "Rádio", image: covers.mic, duration: "0:28" },
];

export const stories = [
  { id: "story-1", title: "Notícias", image: covers.news },
  { id: "story-2", title: "Tecnologia", image: covers.matrix },
  { id: "story-3", title: "Cultura", image: covers.festival },
  { id: "story-4", title: "Ao vivo", image: covers.studio },
];

export const videoCuts = [
  { id: "video-1", title: "Entenda o novo pacote de infraestrutura digital", image: covers.code, duration: "08:14" },
  { id: "video-2", title: "Como a IA está transformando os diagnósticos", image: covers.chip, duration: "12:08" },
  { id: "video-3", title: "Os destaques do cinema nacional em 2026", image: covers.cinema, duration: "06:32" },
  { id: "video-4", title: "LGPD: o que muda com as novas regras", image: covers.docs, duration: "09:47" },
];

export const institutionalServices = [
  { title: "Rádio online 24h", description: "Transmissão contínua com música, adoração e programação especial." },
  { title: "Notícias e informação", description: "Cobertura jornalística independente, responsável e próxima da comunidade." },
  { title: "Conteúdo espiritual", description: "Mensagens de fé e esperança para acompanhar toda a família." },
  { title: "Comunidade ativa", description: "Uma audiência presente nas redes e na programação da rádio." },
];

/**
 * Feed de vídeos, reels e stories recomendados (sugestões pós-podcast e
 * reprodução automática). Cada item possui `images` (slideshow enquanto toca)
 * e `audioUrl` de demonstração; quando `videoUrl` estiver definido, o
 * mini-player exibe o vídeo real no lugar do slideshow.
 */
export interface VisualFeedItem {
  id: string;
  title: string;
  category: "Vídeo" | "Reel" | "Story";
  image: string;
  images?: string[];
  audioUrl?: string;
  videoUrl?: string;
  duration?: string;
}

const demoAudio = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3";
const demoAudioB = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3";
const demoVideo = "https://www.w3schools.com/html/mov_bbb.mp4";

export const breakingVisuals: VisualFeedItem[] = [
  {
    id: "brk-1",
    title: "Infraestrutura digital: o pacote de R$ 12 bi",
    category: "Vídeo",
    image: articles[0].imageUrl,
    images: [articles[0].imageUrl, articles[1].imageUrl],
    audioUrl: demoAudio,
    videoUrl: demoVideo,
    duration: "0:42",
  },
  {
    id: "brk-2",
    title: "IA nos diagnósticos médicos",
    category: "Reel",
    image: articles[1].imageUrl,
    images: [articles[1].imageUrl, articles[5].imageUrl],
    audioUrl: demoAudioB,
    duration: "0:36",
  },
  {
    id: "brk-3",
    title: "LGPD: o que muda agora",
    category: "Story",
    image: articles[3].imageUrl,
    images: [articles[3].imageUrl, articles[2].imageUrl],
    audioUrl: demoAudio,
    duration: "0:28",
  },
  {
    id: "brk-4",
    title: "Bateria solar brasileira",
    category: "Reel",
    image: articles[4].imageUrl,
    images: [articles[4].imageUrl, articles[1].imageUrl],
    audioUrl: demoAudioB,
    duration: "0:51",
  },
];

/**
 * Reapresentações de lives — EXCLUSIVAS da área premium (assinatura paga).
 * Fora do player aberto: aparecem apenas como anúncio/convite para assinar.
 */
export const lives = [
  { id: "live-1", title: "Culto de adoração ao vivo — reapresentação", category: "Live", image: articles[0].imageUrl, duration: "1:24:10", host: "Equipe Web Rádio Vitória", when: "Sábado • 9h", premium: true },
  { id: "live-2", title: "Bate-papo com a comunidade — reapresentação", category: "Live", image: articles[2].imageUrl, duration: "58:40", host: "Ana Beatriz", when: "Domingo • 10h", premium: true },
  { id: "live-3", title: "Programa da manhã — reflexões do dia", category: "Live", image: articles[4].imageUrl, duration: "2:05:33", host: "Carlos Eduardo", when: "Sábado • 14h", premium: true },
  { id: "live-4", title: "Encontro de oração — edição da semana", category: "Live", image: articles[5].imageUrl, duration: "1:10:02", host: "Marina Duarte", when: "Domingo • 18h", premium: true },
];

/**
 * Grade de programação exibida dinamicamente na seção "Web Rádio Programação".
 * Para itens premium, mostra-se apenas data/hora, nome e apresentador.
 */
export interface ScheduleEntry {
  id: string;
  day: string;
  time: string;
  title: string;
  host: string;
  kind: "program" | "live" | "podcast" | "replay";
  premium: boolean;
}

export const schedule: ScheduleEntry[] = [
  { id: "sch-1", day: "Domingo", time: "19h", title: "Culto de adoração ao vivo", host: "Equipe Web Rádio Vitória", kind: "live", premium: false },
  { id: "sch-2", day: "Segunda a sexta", time: "7h", title: "Programa da manhã", host: "Ana Beatriz", kind: "program", premium: false },
  { id: "sch-3", day: "Segunda a sexta", time: "13h", title: "Podcast: Fé e informação (prévia)", host: "Carlos Eduardo", kind: "podcast", premium: false },
  { id: "sch-4", day: "Terça", time: "20h", title: "Podcast: Tecnologia e fé (prévia)", host: "Marina Duarte", kind: "podcast", premium: false },
  { id: "sch-5", day: "Quinta", time: "21h", title: "Papo de quinta", host: "Rodrigo Alves", kind: "program", premium: true },
  { id: "sch-6", day: "Sábado", time: "9h", title: "Reapresentação — Culto da semana", host: "Equipe Web Rádio Vitória", kind: "replay", premium: true },
];

/** Próxima live agendada (não-premium) — base para a tarja do banner. */
export const upcomingLive = schedule.find((entry) => entry.kind === "live" && !entry.premium) ?? null;

/**
 * Item assistível no banner gigante: vídeos horizontais, lives, reels e
 * stories (formato vertical). Todos chegam com `videoUrl` de demonstração.
 */
export interface WatchFeedItem {
  id: string;
  kind: "video" | "live" | "reel" | "story";
  orientation: "horizontal" | "vertical";
  kicker: string;
  title: string;
  headline: string;
  caption: string;
  image: string;
  videoUrl: string;
  duration?: string;
  /** Quando presente, a capa/manchete abre a matéria correspondente. */
  articleId?: string;
  /**
   * Nicho/tema editorial da manchete. Quando presente, o carrossel exibe o
   * badge correspondente sobre o título; sem tema, nenhum badge é mostrado
   * (as tarjas fixas "Ao vivo • De Tupã para todo o Brasil" foram removidas).
   */
  theme?: string;
}

/** Vínculo manchete → matéria (rota /artigo/:id) para a capa clicável. */
const watchArticleId: Record<string, string | undefined> = {
  "video-1": "1",
  "video-2": "2",
  "video-3": "3",
  "video-4": "4",
  "reel-1": "2",
  "reel-2": "3",
  "reel-3": "5",
};

/**
 * Nicho/tema da manchete a partir da matéria vinculada. O carrossel só exibe
 * o badge sobre o título quando há tema — as tarjas fixas ("Ao Vivo • De Tupã
 * para todo o Brasil") foram descontinuadas.
 */
const themeOf = (articleId: string | undefined): string | undefined => {
  if (!articleId) {
    return undefined;
  }
  return articles.find((article) => article.id === articleId)?.category;
};

const watchCaption = (text: string) =>
  `Legenda do áudio: ${text} Acompanhe o conteúdo na íntegra na programação da Web Rádio Vitória.`;

const watchVideoUrl = (id: string) => `${demoVideo}?v=${id}`;

export const watchFeed: WatchFeedItem[] = [
  // Vídeos horizontais (cortes e matérias)
  ...videoCuts.map((video) => ({
    id: video.id,
    kind: "video" as const,
    orientation: "horizontal" as const,
    kicker: "Vídeo",
    title: video.title,
    headline: video.title,
    caption: watchCaption("Comentário da redação sobre os bastidores da reportagem."),
    image: video.image,
    videoUrl: watchVideoUrl(video.id),
    duration: video.duration,
    articleId: watchArticleId[video.id],
    theme: themeOf(watchArticleId[video.id]),
  })),
  // Lives (programação ao vivo em andamento)
  {
    id: "live-now-1",
    kind: "live" as const,
    orientation: "horizontal" as const,
    kicker: "Ao vivo",
    title: "Culto de adoração ao vivo",
    headline: "Culto de adoração ao vivo agora na Web Rádio Vitória",
    caption: watchCaption("Culto de adoração com louvores, oração e palavra para toda a família."),
    image: covers.dataCenter,
    videoUrl: watchVideoUrl("live-now-1"),
    duration: "Ao vivo",
  },
  {
    id: "live-now-2",
    kind: "live" as const,
    orientation: "horizontal" as const,
    kicker: "Ao vivo",
    title: "Bate-papo com a comunidade",
    headline: "Bate-papo ao vivo: a comunidade responde",
    caption: watchCaption("Participação da audiência com perguntas, recados e testemunhos."),
    image: covers.team,
    videoUrl: watchVideoUrl("live-now-2"),
    duration: "Ao vivo",
  },
  // Reels (formato vertical)
  ...socialMedia.map((reel) => ({
    id: reel.id,
    kind: "reel" as const,
    orientation: "vertical" as const,
    kicker: "Reel",
    title: reel.title,
    headline: `Reel: ${reel.title}`,
    caption: watchCaption("Conteúdo rápido e descontraído produzido pela redação."),
    image: reel.image,
    videoUrl: watchVideoUrl(reel.id),
    duration: reel.duration,
    articleId: watchArticleId[reel.id],
    theme: themeOf(watchArticleId[reel.id]),
  })),
  // Stories (formato vertical)
  ...stories.map((story) => ({
    id: story.id,
    kind: "story" as const,
    orientation: "vertical" as const,
    kicker: "Story",
    title: story.title,
    headline: `Story: ${story.title} em destaque`,
    caption: watchCaption("Story em destaque com um resumo do que está no ar."),
    image: story.image,
    videoUrl: watchVideoUrl(story.id),
  })),
];

/** Recomendações "a seguir": mescla vídeos, lives, reels e stories. */
export const watchRecommendations: WatchFeedItem[] = [
  watchFeed.find((item) => item.id === "live-now-1") ?? watchFeed[0],
  watchFeed.find((item) => item.id === "video-2") ?? watchFeed[0],
  watchFeed.find((item) => item.id === "reel-1") ?? watchFeed[0],
  watchFeed.find((item) => item.id === "story-3") ?? watchFeed[0],
];