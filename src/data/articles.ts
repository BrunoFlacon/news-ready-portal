export interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  /** Data/hora exata da publicação (ISO local) — alimenta o tempo relativo. */
  publishedAt: string;
  /** Data/hora da última atualização (opcional; "atualizado às …"). */
  updatedAt?: string;
  /** Cidade e UF de apuração. */
  city?: string;
  state?: string;
  imageUrl: string;
  body: string;
}

export const articles: Article[] = [
  {
    id: "1",
    title: "Governo anuncia novo pacote de investimentos em infraestrutura digital",
    excerpt: "Programa prevê R$ 12 bilhões para expandir a conectividade em regiões remotas do país nos próximos cinco anos.",
    category: "Política",
    author: "Ana Beatriz Silva",
    date: "2026-03-26",
    publishedAt: "2026-03-26T07:42:00",
    updatedAt: "2026-03-26T12:30:00",
    city: "Brasília",
    state: "DF",
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
    body: "O governo federal apresentou nesta terça-feira um ambicioso pacote de investimentos voltado para a infraestrutura digital do país. Com previsão de R$ 12 bilhões em recursos, o programa visa levar internet de alta velocidade a comunidades rurais e regiões remotas.\n\nSegundo o ministro das Comunicações, a iniciativa faz parte do plano estratégico de transformação digital e pretende conectar mais de 30 milhões de brasileiros que ainda não possuem acesso adequado à internet.\n\nO pacote inclui a instalação de fibra óptica em municípios com menos de 50 mil habitantes, além de subsídios para operadoras que atuarem em áreas de difícil acesso. Especialistas apontam que o investimento pode impulsionar significativamente a economia digital nas regiões beneficiadas.",
  },
  {
    id: "2",
    title: "Inteligência artificial revoluciona diagnósticos médicos no Brasil",
    excerpt: "Hospitais públicos começam a adotar sistemas de IA para acelerar diagnósticos e reduzir filas de espera.",
    category: "Tecnologia",
    author: "Carlos Eduardo Mendes",
    date: "2026-03-25",
    publishedAt: "2026-03-25T09:15:00",
    city: "São Paulo",
    state: "SP",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
    body: "Uma revolução silenciosa está transformando o sistema de saúde público brasileiro. Hospitais em São Paulo, Rio de Janeiro e Belo Horizonte já utilizam sistemas de inteligência artificial para auxiliar no diagnóstico de doenças, reduzindo o tempo de espera dos pacientes em até 60%.\n\nA tecnologia, desenvolvida por startups brasileiras em parceria com universidades públicas, analisa exames de imagem e dados clínicos para sugerir diagnósticos aos médicos.\n\nOs resultados preliminares mostram uma taxa de acerto superior a 95% em diagnósticos de pneumonia e outras doenças pulmonares, além de avanços significativos na detecção precoce de câncer.",
  },
  {
    id: "3",
    title: "Festival de cinema nacional bate recorde de público em 2026",
    excerpt: "Mais de 500 mil espectadores participaram da maior edição já realizada do evento cultural.",
    category: "Entretenimento",
    author: "Mariana Costa",
    date: "2026-03-24",
    publishedAt: "2026-03-24T18:05:00",
    city: "Vitória",
    state: "ES",
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80",
    body: "O Festival Nacional de Cinema encerrou sua 28ª edição com números históricos. Mais de 500 mil espectadores participaram do evento, que exibiu 320 filmes de todo o país durante 12 dias.\n\nO filme vencedor do prêmio principal, 'Horizonte Interior', dirigido por Cláudia Santos, aborda a vida de uma comunidade ribeirinha no Amazonas e já garantiu distribuição internacional.\n\nOrganizadores destacam que o crescimento do público reflete o amadurecimento da indústria cinematográfica brasileira e o interesse crescente do público por produções nacionais.",
  },
  {
    id: "4",
    title: "Nova legislação de proteção de dados entra em vigor com regras mais rígidas",
    excerpt: "Empresas têm 90 dias para se adequar às novas exigências da LGPD atualizada.",
    category: "Política",
    author: "Roberto Almeida",
    date: "2026-03-23",
    publishedAt: "2026-03-23T11:20:00",
    updatedAt: "2026-03-23T16:45:00",
    city: "Brasília",
    state: "DF",
    imageUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
    body: "A versão atualizada da Lei Geral de Proteção de Dados (LGPD) entrou em vigor nesta semana, trazendo regras mais rígidas para o tratamento de dados pessoais por empresas e organizações.\n\nEntre as principais mudanças estão a obrigatoriedade de relatórios de impacto para qualquer operação que envolva dados sensíveis e multas que podem chegar a 4% do faturamento bruto da empresa.\n\nA Autoridade Nacional de Proteção de Dados (ANPD) concedeu um prazo de 90 dias para que as empresas se adequem às novas exigências.",
  },
  {
    id: "5",
    title: "Startup brasileira desenvolve bateria solar com eficiência recorde",
    excerpt: "Tecnologia nacional promete reduzir custos de energia solar em até 40% nos próximos anos.",
    category: "Tecnologia",
    author: "Fernanda Lima",
    date: "2026-03-22",
    publishedAt: "2026-03-22T08:30:00",
    city: "Campinas",
    state: "SP",
    imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
    body: "Uma startup sediada em Campinas (SP) anunciou o desenvolvimento de uma nova bateria solar com eficiência energética recorde. A tecnologia, resultado de cinco anos de pesquisa, promete reduzir os custos de armazenamento de energia solar em até 40%.\n\nA empresa já recebeu investimentos de R$ 200 milhões de fundos internacionais e planeja iniciar a produção em escala no segundo semestre de 2026.\n\nEspecialistas do setor afirmam que a inovação pode acelerar significativamente a transição energética no Brasil e posicionar o país como líder global em tecnologia de energia renovável.",
  },
  {
    id: "6",
    title: "Seleção brasileira de e-sports conquista campeonato mundial",
    excerpt: "Equipe nacional vence final emocionante contra a Coreia do Sul e leva o título inédito.",
    category: "Entretenimento",
    author: "Lucas Ferreira",
    date: "2026-03-21",
    publishedAt: "2026-03-21T21:10:00",
    city: "Vitória",
    state: "ES",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
    body: "A seleção brasileira de e-sports fez história ao conquistar o campeonato mundial da modalidade, vencendo a Coreia do Sul na grande final por 3 a 2 em uma partida emocionante.\n\nO torneio, realizado em Tóquio, reuniu equipes de 48 países e teve uma audiência online superior a 50 milhões de espectadores simultâneos.\n\nA conquista coloca o Brasil no topo do ranking mundial e deve impulsionar investimentos no setor de jogos eletrônicos no país.",
  },
];

export const trendingTopics = [
  "Eleições 2026",
  "Inteligência Artificial",
  "Copa do Mundo",
  "Economia Digital",
  "Mudanças Climáticas",
  "Educação Online",
];
