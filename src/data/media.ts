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