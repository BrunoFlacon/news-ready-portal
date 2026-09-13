import { articles } from "./articles";

export const socialMedia = [
  { id: "reel-1", title: "Inteligência artificial na saúde", category: "Tecnologia", image: articles[1].imageUrl, duration: "0:42" },
  { id: "reel-2", title: "Cinema nacional em destaque", category: "Entretenimento", image: articles[2].imageUrl, duration: "0:36" },
  { id: "reel-3", title: "Energia solar brasileira", category: "Tecnologia", image: articles[4].imageUrl, duration: "0:51" },
  { id: "reel-4", title: "Bastidores da redação", category: "Rádio", image: articles[0].imageUrl, duration: "0:28" },
];

export const stories = [
  { id: "story-1", title: "Notícias", image: articles[0].imageUrl },
  { id: "story-2", title: "Tecnologia", image: articles[1].imageUrl },
  { id: "story-3", title: "Cultura", image: articles[2].imageUrl },
  { id: "story-4", title: "Ao vivo", image: articles[5].imageUrl },
];

export const videoCuts = [
  { id: "video-1", title: "Entenda o novo pacote de infraestrutura digital", image: articles[0].imageUrl, duration: "08:14" },
  { id: "video-2", title: "Como a IA está transformando os diagnósticos", image: articles[1].imageUrl, duration: "12:08" },
  { id: "video-3", title: "Os destaques do cinema nacional em 2026", image: articles[2].imageUrl, duration: "06:32" },
  { id: "video-4", title: "LGPD: o que muda com as novas regras", image: articles[3].imageUrl, duration: "09:47" },
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
 * Lives (reapresentações) exibidas na faixa "Lives" da seção de vídeos.
 */
export const lives = [
  { id: "live-1", title: "Culto de adoração ao vivo — reapresentação", category: "Live", image: articles[0].imageUrl, duration: "1:24:10" },
  { id: "live-2", title: "Bate-papo com a comunidade — reapresentação", category: "Live", image: articles[2].imageUrl, duration: "58:40" },
  { id: "live-3", title: "Programa da manhã — reflexões do dia", category: "Live", image: articles[4].imageUrl, duration: "2:05:33" },
  { id: "live-4", title: "Encontro de oração — edição da semana", category: "Live", image: articles[5].imageUrl, duration: "1:10:02" },
];

/** Próxima live programada (exibida no banner quando a rádio está fora do ar). */
export const nextLive = {
  title: "Culto de adoração ao vivo",
  when: "Domingo, às 19h",
};

export interface HeroHighlight {
  id: string;
  kind: "live" | "video" | "reel" | "story";
  kicker: string;
  title: string;
  image: string;
  images?: string[];
  audioUrl?: string;
  videoUrl?: string;
  liveWhen?: string;
}

const heroAudio = demoAudio;
const heroAudioB = demoAudioB;

/** Destaques do banner: últimas lives, notícias de capa e breaking news. */
export const heroHighlights: HeroHighlight[] = [
  {
    id: "hl-1",
    kind: "live",
    kicker: "Última live",
    title: "Culto de adoração ao vivo — reapresentação",
    image: articles[0].imageUrl,
    images: [articles[0].imageUrl, articles[3].imageUrl],
    audioUrl: heroAudio,
    videoUrl: demoVideo,
  },
  {
    id: "hl-2",
    kind: "reel",
    kicker: "Breaking",
    title: "Infraestrutura digital: o pacote de R$ 12 bilhões",
    image: articles[1].imageUrl,
    images: [articles[1].imageUrl, articles[4].imageUrl],
    audioUrl: heroAudioB,
  },
  {
    id: "hl-3",
    kind: "story",
    kicker: "Destaque",
    title: "IA nos diagnósticos médicos do Brasil",
    image: articles[2].imageUrl,
    images: [articles[2].imageUrl, articles[5].imageUrl],
    audioUrl: heroAudio,
  },
  {
    id: "hl-4",
    kind: "video",
    kicker: "Vídeo da semana",
    title: "Bateria solar brasileira alcança eficiência recorde",
    image: articles[4].imageUrl,
    images: [articles[4].imageUrl, articles[1].imageUrl],
    audioUrl: heroAudioB,
  },
];