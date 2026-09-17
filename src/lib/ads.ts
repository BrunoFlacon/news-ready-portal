/**
 * Web Rádio Vitória — campanhas de patrocínio editáveis (Onda 6, item 3.1).
 *
 * v0 persiste as campanhas no localStorage (`radio.ads`) com o seed de
 * `src/data/ads.ts` como padrão, e guarda métricas locais
 * (`radio.ads.metrics`) de impressões e cliques. Toda escrita avisa os hooks
 * (`useAdCampaigns`) via evento `ads:change`, então o painel admin reflete
 * imediatamente nos slots da Home (intersticial e banner do hero).
 *
 * Para o banco futuro (PLANO-BANCO-DADOS-BACKEND.md): mapear 1:1 para a tabela
 * `ads` (id, brand, headline, caption, image, ctaLabel, target, status, kind,
 * orientation) e `ad_metrics` (adId, impressions, clicks).
 */
import { useEffect, useState } from "react";
import { DEFAULT_SKIP_AFTER_MS, type AdCampaign } from "@/components/AdSpot";
import { adCampaigns as seedAds } from "@/data/ads";

export const ADS_CHANGE_EVENT = "ads:change";
export const ADS_STORAGE_KEY = "radio.ads";
export const ADS_METRICS_KEY = "radio.ads.metrics";

export interface AdMetrics {
  impressions: number;
  clicks: number;
}

/** Cópia cacheada: uma referência estável por mudança (evita loops em hooks). */
let cache: AdCampaign[] | null = null;

function cloneSeed(): AdCampaign[] {
  return seedAds.map((ad) => ({ ...ad }));
}

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Sem armazenamento local as campanhas seguem apenas em memória (visual).
  }
}

function notifyChange(): void {
  window.dispatchEvent(new Event(ADS_CHANGE_EVENT));
}

/** Campanhas efetivas: localStorage quando o editor já salvou, senão o seed. */
export function getAdCampaigns(): AdCampaign[] {
  if (cache) {
    return cache;
  }
  const raw = readStored(ADS_STORAGE_KEY);
  if (!raw) {
    cache = cloneSeed();
    return cache;
  }
  try {
    const parsed = JSON.parse(raw) as AdCampaign[];
    cache = Array.isArray(parsed) ? parsed : cloneSeed();
  } catch {
    cache = cloneSeed();
  }
  return cache;
}

export function saveAdCampaigns(ads: AdCampaign[]): AdCampaign[] {
  cache = ads;
  writeStored(ADS_STORAGE_KEY, JSON.stringify(ads));
  notifyChange();
  return cache;
}

/* -------------------------------------------------------------------------- */
/* Filtros de slot                                                            */
/* -------------------------------------------------------------------------- */

/** Campanha visível: tudo que não foi pausado no painel. */
export function isAdActive(ad: AdCampaign): boolean {
  return ad.status !== "paused";
}

/** Campanhas em rotação nos slots (intersticial e carrossel do hero). */
export function activeAdCampaigns(ads: AdCampaign[] = getAdCampaigns()): AdCampaign[] {
  return ads.filter(isAdActive);
}

/** Slides patrocinados do carrossel do banner gigante (hero). */
export function featuredAdCampaigns(ads: AdCampaign[] = getAdCampaigns()): AdCampaign[] {
  return activeAdCampaigns(ads).filter((ad) => ad.featured);
}

/** Campanha da vez no intersticial (rotação simples por número de exibição). */
export function pickAdCampaign(
  exhibitionIndex: number,
  ads: AdCampaign[] = getAdCampaigns(),
): AdCampaign | null {
  const active = activeAdCampaigns(ads);
  if (active.length === 0) {
    return null;
  }
  const index = ((exhibitionIndex % active.length) + active.length) % active.length;
  return active[index];
}

/* -------------------------------------------------------------------------- */
/* CRUD do painel                                                             */
/* -------------------------------------------------------------------------- */

function makeId(): string {
  return `ad-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export type NewAdCampaign = Omit<AdCampaign, "id" | "skipAfterMs"> &
  Partial<Pick<AdCampaign, "id" | "skipAfterMs">>;

/** Cria a campanha no topo da lista — aparece imediatamente nos slots. */
export function createAdCampaign(input: NewAdCampaign): AdCampaign {
  const ad: AdCampaign = {
    skipAfterMs: DEFAULT_SKIP_AFTER_MS,
    status: "active",
    ...input,
    id: input.id ?? makeId(),
  };
  saveAdCampaigns([ad, ...getAdCampaigns()]);
  return ad;
}

export function updateAdCampaign(
  id: string,
  patch: Partial<Omit<AdCampaign, "id">>,
): AdCampaign[] {
  return saveAdCampaigns(
    getAdCampaigns().map((ad) => (ad.id === id ? { ...ad, ...patch } : ad)),
  );
}

export function removeAdCampaign(id: string): AdCampaign[] {
  return saveAdCampaigns(getAdCampaigns().filter((ad) => ad.id !== id));
}

/** Alterna pausar/reativar — pausada sai da rotação dos slots. */
export function toggleAdStatus(id: string): AdCampaign[] {
  return saveAdCampaigns(
    getAdCampaigns().map((ad) =>
      ad.id === id
        ? { ...ad, status: isAdActive(ad) ? "paused" : "active" }
        : ad,
    ),
  );
}

/* -------------------------------------------------------------------------- */
/* Métricas (impressões e cliques)                                            */
/* -------------------------------------------------------------------------- */

export function getAdMetrics(): Record<string, AdMetrics> {
  const raw = readStored(ADS_METRICS_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, AdMetrics>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getAdMetric(id: string): AdMetrics {
  const metrics = getAdMetrics()[id];
  return {
    impressions: Math.max(0, Math.floor(metrics?.impressions ?? 0)),
    clicks: Math.max(0, Math.floor(metrics?.clicks ?? 0)),
  };
}

function bumpMetric(id: string, field: keyof AdMetrics): AdMetrics {
  const all = getAdMetrics();
  const current = getAdMetric(id);
  const updated: AdMetrics = { ...current, [field]: current[field] + 1 };
  all[id] = updated;
  writeStored(ADS_METRICS_KEY, JSON.stringify(all));
  return updated;
}

/** Registra uma exibição do criativo (slot intersticial ou hero). */
export function recordAdImpression(id: string): AdMetrics {
  return bumpMetric(id, "impressions");
}

/** Registra um clique no CTA da campanha. */
export function recordAdClick(id: string): AdMetrics {
  return bumpMetric(id, "clicks");
}

/** Totais do painel: soma de impressões e cliques de todas as campanhas. */
export function getAdsTotals(): AdMetrics {
  return Object.values(getAdMetrics()).reduce<AdMetrics>(
    (total, item) => ({
      impressions: total.impressions + Math.max(0, item?.impressions ?? 0),
      clicks: total.clicks + Math.max(0, item?.clicks ?? 0),
    }),
    { impressions: 0, clicks: 0 },
  );
}

/** Zera métricas e restaura o seed original (botão "Restaurar" do painel). */
export function resetAdCampaigns(): AdCampaign[] {
  try {
    window.localStorage.removeItem(ADS_STORAGE_KEY);
    window.localStorage.removeItem(ADS_METRICS_KEY);
  } catch {
    // Ignora ambientes sem armazenamento.
  }
  cache = null;
  const ads = getAdCampaigns();
  notifyChange();
  return ads;
}

/* -------------------------------------------------------------------------- */
/* Reatividade                                                                */
/* -------------------------------------------------------------------------- */

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === ADS_STORAGE_KEY) {
      cache = null;
      onChange();
    }
  };
  window.addEventListener(ADS_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(ADS_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Hook reativo: campanhas em edição pelo painel admin. */
export function useAdCampaigns(): AdCampaign[] {
  const [ads, setAds] = useState<AdCampaign[]>(getAdCampaigns);
  useEffect(() => {
    const onChange = () => setAds(getAdCampaigns());
    return subscribe(onChange);
  }, []);
  return ads;
}

/** Zera o cache em memória (testes e restauração do seed). */
export const __resetAdsCache = (): void => {
  cache = null;
};