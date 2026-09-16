import type { AdCampaign } from "@/components/AdSpot";
import { DEFAULT_SKIP_AFTER_MS } from "@/components/AdSpot";

/*
 * Onda 6 (plano propagandas/grade/alertas, item 1.1): campanhas intersticiais
 * exibidas entre o fim de um video e o proximo. v0 usa um seed local; a
 * sincronizacao com o banco (secao frontmatter `ads`) fica para a fase do
 * backend. ASCII puro (sem acentos) por padrao do repo.
 */
export const adCampaigns: AdCampaign[] = [
  {
    id: "ad-vitoria-news-1",
    brand: "Vitória News",
    tagline: "Patrocinado",
    headline: "Assine a Web Rádio Vitória",
    caption:
      "Reapresentações de lives e podcasts na íntegra são exclusivos para assinantes.",
    image: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200&q=80",
    ctaLabel: "Saiba mais",
    skipAfterMs: DEFAULT_SKIP_AFTER_MS,
  },
  {
    id: "ad-agencia-vitrine-1",
    brand: "Agencia Vitrine",
    tagline: "Patrocinado",
    headline: "Sua marca em alta rotatividade",
    caption: "Campanhas de impacto para marcas que querem mais audiência.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
    ctaLabel: "Conhecer a agencia",
    skipAfterMs: DEFAULT_SKIP_AFTER_MS,
  },
];

/** Campanha ativa para o intersticial (rotação simples por número de exibição). */
export function pickAdCampaign(exhibitionIndex: number): AdCampaign {
  return adCampaigns[exhibitionIndex % adCampaigns.length];
}