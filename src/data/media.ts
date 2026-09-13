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