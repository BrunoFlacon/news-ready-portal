import type { AdCampaign } from "@/components/AdSpot";
import { DEFAULT_SKIP_AFTER_MS } from "@/components/AdSpot";
import { schedule } from "./media";

/*
 * Onda 6 (plano propagandas/grade/alertas, item 1.1): campanhas intersticiais
 * exibidas entre o fim de um video e o proximo. v0 usa um seed local; a
 * sincronizacao com o banco (secao frontmatter `ads`) fica para a fase do
 * backend. ASCII puro (sem acentos) por padrao do repo.
 */

/** Próxima entrada ao vivo da grade (reutilizada pelo anúncio "Ver na grade"). */
const upcomingLiveSchedule = schedule.find(
  (entry) => entry.kind === "live" && !entry.premium,
);

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
    target: "url",
    targetUrl: "/#assinatura",
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
  // Item 1.2 — banner gigante vira propaganda: campanha "empurrada" para a
  // posicao de hero (featured). No carrossel do banner ela entra como slide
  // patrocinado; o CTA "Ver na grade" rola ate a grade de programacao.
  {
    id: "ad-grade-programacao-1",
    brand: "Web Radio Vitoria",
    tagline: "Patrocinado",
    headline: "Programacao ao vivo, do culto ao podcast",
    caption: "Confira os horarios da grade e agenda o proximo programa que voce nao quer perder.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80",
    ctaLabel: "Ver na grade",
    skipAfterMs: DEFAULT_SKIP_AFTER_MS,
    featured: true,
    target: "schedule",
    scheduledTitle: upcomingLiveSchedule?.title ?? "Culto de adoracao ao vivo",
    scheduledWhen: upcomingLiveSchedule
      ? `${upcomingLiveSchedule.day} • ${upcomingLiveSchedule.time}`
      : undefined,
  },
];

/** Campanhas com `featured` — slides patrocinados do carrossel do banner. */
export function featuredAdCampaigns(): AdCampaign[] {
  return adCampaigns.filter((ad) => ad.featured);
}

/** Campanha ativa para o intersticial (rotação simples por número de exibição). */
export function pickAdCampaign(exhibitionIndex: number): AdCampaign {
  return adCampaigns[exhibitionIndex % adCampaigns.length];
}