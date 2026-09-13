/**
 * Web Rádio Vitória — Podcasts.
 *
 * EPISÓDIOS DEMONSTRAÇÃO: os `audioUrl` abaixo são fontes públicas
 * (SoundHelix/Archive) apenas para validar o player; substitua pelas URLs
 * reais quando a programação estiver no ar.
 *
 * Regra de conteúdo:
 *  - `premium: false` → PRÉVIA gratuita (primeiros minutos, tocável direto);
 *  - `premium: true`  → EPISÓDIO NA ÍNTEGRA, exclusivo da área premium.
 */
export interface Podcast {
  id: string;
  title: string;
  description: string;
  category: string;
  durationLabel: string;
  audioUrl: string;
  imageUrl: string;
  host: string;
  when: string;
  premium: boolean;
}

export const podcasts: Podcast[] = [
  {
    id: "pod-1",
    title: "Fé e informação — como a rádio conecta a comunidade",
    description:
      "Bate-papo sobre o papel da Web Rádio Vitória na vida da cidade: fé, informação e acolhimento.",
    category: "Institucional",
    durationLabel: "Prévia • pílula de 5 min",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80",
    host: "Carlos Eduardo",
    when: "Segunda a sexta • 13h",
    premium: false,
  },
  {
    id: "pod-2",
    title: "Tecnologia e fé lado a lado",
    description:
      "Como a transformação digital aproxima as pessoas da comunidade e da programação da rádio.",
    category: "Tecnologia",
    durationLabel: "Prévia • episódio de 5 min",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
    host: "Marina Duarte",
    when: "Terça • 20h",
    premium: false,
  },
  {
    id: "pod-3",
    title: "Boletim de notícias da semana",
    description:
      "Os principais fatos da semana em um resumo direto, com análise e contexto.",
    category: "Notícias",
    durationLabel: "Episódio na íntegra • Premium",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
    host: "Rodrigo Alves",
    when: "Quinta feira • 7h",
    premium: true,
  },
  {
    id: "pod-4",
    title: "Papo sobre cultura e entretenimento",
    description:
      "Cinema, música e cultura pop em conversa leve para toda a família.",
    category: "Entretenimento",
    durationLabel: "Episódio na íntegra • Premium",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80",
    host: "Ana Beatriz",
    when: "Quarta • 19h",
    premium: true,
  },
  {
    id: "pod-5",
    title: "O mundo dos e-sports no Brasil",
    description:
      "O crescimento dos jogos eletrônicos e o título mundial da seleção brasileira.",
    category: "Entretenimento",
    durationLabel: "Episódio na íntegra • Premium",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
    host: "Rodrigo Alves",
    when: "Sábado • 15h",
    premium: true,
  },
  {
    id: "pod-6",
    title: "Saúde com inteligência artificial",
    description:
      "Como a IA acelera diagnósticos nos hospitais públicos do Brasil.",
    category: "Tecnologia",
    durationLabel: "Episódio na íntegra • Premium",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
    host: "Marina Duarte",
    when: "Sexta • 18h",
    premium: true,
  },
];