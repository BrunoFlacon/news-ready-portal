import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Apos quantos ms o botao "Pular anuncio" e habilitado (padrao 5s). */
export const DEFAULT_SKIP_AFTER_MS = 5000;

/** Contrato de uma campanha de patrocinio intersticial entre videos. */
export interface AdCampaign {
  id: string;
  brand: string;
  tagline: string;
  headline: string;
  caption: string;
  image: string;
  ctaLabel: string;
  skipAfterMs: number;
}

interface AdSpotProps {
  ad: AdCampaign;
  onSkip: () => void;
  onCta?: () => void;
  onComplete?: () => void;
}

/*
 * Onda 6 (plano propagandas/grade/alertas, subentrega 1.1) — intersticial:
 * entre o fim de um video (onEnded) e o proximo, um anuncio cobrindo
 * SOMENTE a area do video; o rail vertical de cards permanece acessivel.
 * Contagem regressiva de 5s e botao "Pular anuncio" habilitado apos esse
 * tempo; se ninguem pular, o intersticial fecha sozinho — onComplete e
 * chamado EXATAMENTE 1x (guard via useRef).
 */
export function AdSpot({ ad, onSkip, onCta, onComplete }: AdSpotProps) {
  const [remainingMs, setRemainingMs] = useState(ad.skipAfterMs);
  const completedRef = useRef(false);

  /*
   * Updater 100% puro: apenas decrementa o tempo restante. NUNCA chama
   * callbacks aqui dentro — React pode executar updaters funcionais mais
   * de uma vez (double-invoke), o que multiplicaria o side-effect.
   */
  useEffect(() => {
    setRemainingMs(ad.skipAfterMs);
    completedRef.current = false;
    const timer = window.setInterval(() => {
      setRemainingMs((ms) => Math.max(0, ms - 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [ad.skipAfterMs]);

  /*
   * Reativo: quando a contagem zera, dispara onComplete uma unica vez.
   * O guard `completedRef` garante exatamente 1 chamada mesmo se o
   * remainingMs permanecer 0 por varios renders.
   */
  useEffect(() => {
    if (remainingMs === 0 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [remainingMs, onComplete]);

  const canSkip = remainingMs <= 0;
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));

  return (
    <div
      data-testid="ad-interstitial"
      className="absolute inset-0 z-[6] flex items-center justify-center bg-black/95 p-4"
    >
      <article className="relative w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-card">
        <img
          data-testid="ad-image"
          src={ad.image}
          alt=""
          className="h-56 w-full object-cover sm:h-72"
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <span
            data-testid="ad-badge"
            className="rounded-sm bg-brand/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-foreground"
          >
            Patrocinado
          </span>
          <span
            data-testid="ad-countdown"
            className="rounded-sm bg-black/60 px-2 py-1 text-xs font-bold tabular-nums text-white"
          >
            {seconds}s
          </span>
        </div>
        <div className="p-5">
          <p
            data-testid="ad-headline"
            className="font-serif text-xl font-bold leading-snug text-foreground"
          >
            {ad.headline}
          </p>
          <p
            data-testid="ad-caption"
            className="mt-2 text-sm leading-relaxed text-muted-foreground"
          >
            {ad.caption}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {onCta && (
              <button
                type="button"
                data-testid="ad-cta"
                onClick={onCta}
                className="rounded-sm bg-brand px-4 py-2 text-sm font-bold text-brand-foreground transition-colors hover:bg-brand/90"
              >
                {ad.ctaLabel}
              </button>
            )}
            <button
              type="button"
              data-testid="ad-skip-button"
              disabled={!canSkip}
              onClick={onSkip}
              className={cn(
                "rounded-sm px-4 py-2 text-sm font-bold transition-colors",
                canSkip
                  ? "bg-secondary text-foreground hover:bg-secondary/80"
                  : "cursor-not-allowed bg-secondary/50 text-muted-foreground",
              )}
            >
              Pular anuncio
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
