import { Link, useLocation } from "react-router-dom";
import {
  Captions,
  Crown,
  Heart,
  Lock,
  Mic2,
  Newspaper,
  Pause,
  Play,
  Radio,
  Users,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Layout } from "@/components/Layout";
import { MediaRail } from "@/components/MediaRail";
import { Button } from "@/components/ui/button";
import { useRadioPlayerContext } from "@/contexts/RadioPlayerContext";
import { extractPalette, type AmbientPalette } from "@/lib/ambient";
import { podcasts } from "@/data/podcasts";
import {
  institutionalServices,
  schedule,
  socialMedia,
  stories,
  upcomingLive,
  watchFeed,
  watchRecommendations,
  type ScheduleEntry,
  type WatchFeedItem,
} from "@/data/media";

const institutionalImage = "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80";
const AUTO_ROTATE_MS = 8000;
const TRANSITION_MS = 12000;
const AD_STEP_MS = 4000;
const UI_HIDE_MS = 10000;

/** Descrição curta exibida no carrossel e no painel de informações do player. */
const watchBlurb = (item: WatchFeedItem) =>
  item.kind === "live"
    ? "Transmissão ao vivo da programação Web Rádio Vitória."
    : item.kind === "video"
      ? "Matéria e cortes produzidos pela redação da Web Rádio Vitória."
      : "Conteúdo rápido em formato vertical, direto da redação.";

/** Alvo da assinatura premium (reapresentações de lives e podcasts na íntegra). */
export interface PremiumTarget {
  kind: string;
  title: string;
  host?: string;
  when?: string;
}

type WatchPlaying = { item: WatchFeedItem; phase: "playing" };
type WatchTransition = { item: WatchFeedItem; phase: "transition"; next: WatchFeedItem };
type WatchState = WatchPlaying | WatchTransition;

/* -------------------------------------------------------------------------- */
/* Player imersivo do banner gigante                                         */
/* -------------------------------------------------------------------------- */

interface WatchOverlayProps {
  watch: WatchState;
  adIndex: number;
  ambient: AmbientPalette;
  uiVisible: boolean;
  onShowUi: () => void;
  onHideUi: () => void;
  onToggleUi: () => void;
  onClose: () => void;
  onEnded: () => void;
  onPremiumRequest: (target: PremiumTarget) => void;
}

function WatchOverlay({
  watch,
  adIndex,
  ambient,
  uiVisible,
  onShowUi,
  onHideUi,
  onToggleUi,
  onClose,
  onEnded,
  onPremiumRequest,
}: WatchOverlayProps) {
  const { item, phase } = watch;
  const transitioning = phase === "transition";
  const next = phase === "transition" ? watch.next : null;
  const vertical = item.orientation === "vertical";

  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [cc, setCc] = useState(true);

  // Aplica volume/mudo ao vídeo — inclusive quando o item troca de mídia.
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = muted;
      video.volume = volume;
    }
  }, [muted, volume, item.id]);

  const mediaBox = vertical ? (
    // Reels/stories em 9:16 centralizado, limitado pela altura da tela.
    <div className="relative aspect-[9/16] h-full max-h-[62vh] w-auto overflow-hidden rounded-lg bg-black shadow-2xl">
      <video
        key={item.id}
        ref={videoRef}
        data-testid="watch-media"
        src={item.videoUrl}
        autoPlay
        controls
        playsInline
        muted={muted}
        onEnded={onEnded}
        className="h-full w-full object-contain"
      />
    </div>
  ) : (
    // Vídeos/lives em 16:9: o contêiner ocupa TODO o banner e o vídeo cresce
    // até preencher a tela (object-contain preserva a proporção sem cortes —
    // as sobras mostram o fundo ambiente animado).
    <div className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden rounded-lg shadow-2xl">
      <video
        key={item.id}
        ref={videoRef}
        data-testid="watch-media"
        src={item.videoUrl}
        autoPlay
        controls
        playsInline
        muted={muted}
        onEnded={onEnded}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );

  return (
    <div
      data-testid="watch-overlay"
      className="fixed inset-0 z-[90] lg:absolute lg:inset-0 lg:z-30"
      style={{ "--ambient-a": ambient.a, "--ambient-b": ambient.b } as CSSProperties}
      onMouseEnter={onShowUi}
      onMouseLeave={onHideUi}
    >
      {!transitioning && (
        <>
          <div className="ambient-blob left-[-10%] top-[-20%] h-[80%] w-[70%]" style={{ background: ambient.a }} />
          <div className="ambient-blob ambient-blob-2 bottom-[-20%] right-[-10%] h-[80%] w-[70%]" style={{ background: ambient.b }} />
          <div className="ambient-dim" />

          {/* O vídeo preenche o banner inteiro; toque alterna a UI no mobile */}
          <div
            className="absolute inset-0 z-10 flex items-center justify-center"
            onPointerDown={() => {
              if (vertical) {
                onToggleUi();
              }
            }}
          >
            {mediaBox}
          </div>

          {/* Tarja superior esquerda: AO VIVO sempre visível; demais no hover */}
          <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4">
            {item.kind === "live" ? (
              <span
                data-testid="watch-live-badge"
                className="inline-flex items-center gap-2 rounded-sm bg-live px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-live-foreground shadow-lg"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live-foreground" />
                Ao vivo
              </span>
            ) : (
              <span
                className={cn(
                  "rounded-sm bg-background/85 px-2.5 py-1 text-[10px] font-bold uppercase text-foreground shadow-lg transition-opacity",
                  uiVisible ? "opacity-100" : "opacity-0",
                )}
              >
                {item.kicker} • {vertical ? "Formato vertical" : "Tela ampla"}
              </span>
            )}

            {/* Controles: mudo, volume, legendas (CC) e fechar */}
            <div
              className={cn(
                "flex items-center gap-2 transition-opacity",
                uiVisible ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              <button
                type="button"
                onClick={() => setMuted((value) => !value)}
                aria-label={muted ? "Ativar som do vídeo" : "Silenciar vídeo"}
                aria-pressed={muted}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background/85 text-foreground transition-colors hover:bg-background"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setVolume((value) => Math.max(0.1, Math.round((value - 0.15) * 100) / 100))}
                aria-label="Abaixar o volume do vídeo"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background/85 text-foreground transition-colors hover:bg-background"
              >
                <Volume1 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setVolume((value) => Math.min(1, Math.round((value + 0.15) * 100) / 100))}
                aria-label="Aumentar o volume do vídeo"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background/85 text-foreground transition-colors hover:bg-background"
              >
                <Volume2 className="h-4 w-4" />
              </button>
              <span className="hidden w-10 text-center text-[10px] font-bold tabular-nums text-foreground sm:inline">
                {Math.round(volume * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setCc((value) => !value)}
                aria-label="Legendas do vídeo"
                aria-pressed={cc}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                  cc ? "bg-brand text-brand-foreground" : "bg-background/85 text-foreground hover:bg-background",
                )}
              >
                <Captions className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar player"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background/85 text-foreground transition-colors hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Legenda (CC) sobre o vídeo, como no YouTube */}
          {cc && (
            <div
              data-testid="watch-caption"
              className="pointer-events-none absolute inset-x-0 bottom-16 z-20 flex justify-center px-4 lg:bottom-24"
            >
              <p className="max-w-3xl rounded-md bg-black/60 px-4 py-2 text-center text-sm leading-relaxed text-white backdrop-blur-sm">
                {item.caption}
              </p>
            </div>
          )}

          {/* Painel de informações: título, descrição e "a seguir" (hover/toque; some após 10s) */}
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-4 pb-3 pt-16 transition-opacity duration-300 lg:px-6",
              uiVisible ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            onPointerDown={(event) => {
              event.stopPropagation();
              if (vertical) {
                onToggleUi();
              }
            }}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 max-w-2xl">
                <p className="editorial-kicker">{item.kicker}</p>
                <h3 className="font-serif text-lg font-bold leading-snug text-overlay-foreground lg:text-2xl">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-overlay-muted">{watchBlurb(item)}</p>
              </div>
              {next && (
                <div className="flex w-fit shrink-0 items-center gap-3 rounded-md bg-black/50 p-2 backdrop-blur-sm">
                  <img src={next.image} alt="" className="h-12 w-12 flex-shrink-0 rounded object-cover" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-brand">A seguir</p>
                    <p className="max-w-40 truncate text-xs font-bold text-white">{next.title}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {transitioning && (
        <div data-testid="watch-transition" className="relative h-full overflow-y-auto bg-background">
          <div className="container mx-auto flex min-h-full flex-col items-center justify-center gap-5 px-5 py-10">
            <div className="mb-2 flex w-full max-w-md items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand">Conteúdo em destaque</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar player"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {adIndex === 0 && next && (
              <div data-testid="watch-next-card" className="w-full max-w-md overflow-hidden rounded-lg border border-border bg-card">
                <div className="relative aspect-video overflow-hidden bg-black">
                  <img src={next.image} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-media-overlay" />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-sm bg-live px-2.5 py-1 text-[10px] font-bold uppercase text-live-foreground">
                    <Play className="h-3 w-3 fill-current" /> A seguir
                  </span>
                </div>
                <div className="p-4">
                  <p className="editorial-kicker">{next.kicker}</p>
                  <h3 className="mt-1 font-serif text-lg font-bold text-foreground">{next.headline}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">Reproduzindo automaticamente em instantes…</p>
                </div>
              </div>
            )}

            {adIndex === 1 && (
              <div data-testid="watch-premium-ad" className="w-full max-w-md rounded-lg border border-brand/40 bg-card p-6 text-center">
                <Crown className="mx-auto mb-3 h-8 w-8 text-brand" />
                <p className="editorial-kicker">Área premium</p>
                <h3 className="mt-2 font-serif text-xl font-bold text-foreground">Assine e não perca nada</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Reapresentações de lives e podcasts na íntegra são exclusivos para assinantes.
                </p>
                <Button className="mt-5 w-full" onClick={() => onPremiumRequest({ kind: "premium", title: "Área Premium da Web Rádio Vitória" })}>
                  <Crown className="h-4 w-4" /> Assinar a área premium
                </Button>
              </div>
            )}

            {adIndex === 2 && (
              <div data-testid="watch-schedule-ad" className="w-full max-w-md space-y-3">
                <div className="rounded-lg border border-border bg-card p-5">
                  <p className="editorial-kicker">Grade de programação</p>
                  <h3 className="mt-2 font-serif text-lg font-bold text-foreground">Próxima live</h3>
                  {upcomingLive && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {upcomingLive.title} — {upcomingLive.day} às {upcomingLive.time} com {upcomingLive.host}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Próximo programa: {firstFreeProgram().title} com {firstFreeProgram().host}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-5">
                  <p className="editorial-kicker">Na área premium</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Reapresentações de lives e episódios completos de podcasts — assine para assistir na íntegra.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5" aria-hidden>
              {[0, 1, 2].map((index) => (
                <span key={index} className={cn("h-1.5 w-5 rounded-full", index === adIndex ? "bg-brand" : "bg-border")} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function firstFreeProgram(): ScheduleEntry {
  return schedule.find((entry) => entry.kind === "program" && !entry.premium) ?? schedule[0];
}

/* -------------------------------------------------------------------------- */
/* Hero do banner gigante                                                    */
/* -------------------------------------------------------------------------- */

function RadioHero({
  watch,
  onPlay,
  onCloseWatch,
  onEnded,
  onAutoPlay,
  onPremiumRequest,
}: {
  watch: WatchState | null;
  onPlay: (item: WatchFeedItem) => void;
  onCloseWatch: () => void;
  onEnded: () => void;
  onAutoPlay: () => void;
  onPremiumRequest: (target: PremiumTarget) => void;
}) {
  const player = useRadioPlayerContext();
  const hasStream = Boolean(player.streamUrl);

  const [activeIndex, setActiveIndex] = useState(0);
  const [ambient, setAmbient] = useState<AmbientPalette>({ a: "#7c2d12", b: "#1c1917" });
  const [uiVisible, setUiVisible] = useState(true);
  const [adIndex, setAdIndex] = useState(0);

  const active = watchFeed[activeIndex % watchFeed.length];

  // Rotação automática dos destaques — suspensa enquanto o banner é usado.
  useEffect(() => {
    if (watch) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % watchFeed.length);
    }, AUTO_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [watch]);

  // Cores ambiente capturadas da capa/vídeo em exibição (só enquanto toca).
  const watchImage = watch?.phase === "playing" ? watch.item.image : null;
  useEffect(() => {
    if (!watchImage) {
      return;
    }
    let cancelled = false;
    void extractPalette(watchImage).then((palette) => {
      if (!cancelled) {
        setAmbient(palette);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [watchImage]);

  // Ao iniciar a reprodução, reapresenta a UI (título/controles).
  const mediaId = watch?.phase === "playing" ? watch.item.id : null;
  useEffect(() => {
    if (!mediaId) {
      return;
    }
    setUiVisible(true);
  }, [mediaId]);

  // Estilo YouTube: o título/descrição e os controles somem após 10s de
  // inatividade, deixando o vídeo em tela cheia dentro do banner.
  useEffect(() => {
    if (!mediaId || !uiVisible) {
      return;
    }
    const timer = window.setTimeout(() => setUiVisible(false), UI_HIDE_MS);
    return () => window.clearTimeout(timer);
  }, [mediaId, uiVisible]);

  // Fase de transição: alterna manchete/próximo, anúncio premium e grade, e
  // dispara o play automático do próximo em 3 segundos.
  const transitionNextId = watch?.phase === "transition" ? watch.next.id : null;
  useEffect(() => {
    if (!transitionNextId) {
      return;
    }
    setAdIndex(0);
    const step = window.setInterval(() => setAdIndex((index) => (index + 1) % 3), AD_STEP_MS);
    const timer = window.setTimeout(onAutoPlay, TRANSITION_MS);
    return () => {
      window.clearInterval(step);
      window.clearTimeout(timer);
    };
  }, [transitionNextId, onAutoPlay]);

  return (
    <section
      className="relative min-h-[640px] overflow-hidden border-b border-border md:min-h-[700px]"
      aria-label="Rádio ao vivo"
    >
      {!watch && (
        <>
          <div className="absolute inset-0">
            <img src={active.image} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-hero-overlay" />
          </div>
          <div className="container relative flex min-h-[640px] flex-col justify-end py-12 md:min-h-[700px] md:py-16">
            <div className="grid items-end gap-10 lg:grid-cols-[1fr_26rem]">
              <div className="max-w-2xl">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  {hasStream ? (
                    <span className="inline-flex items-center gap-2 rounded-sm bg-live px-3 py-1.5 text-[10px] font-bold uppercase text-live-foreground">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live-foreground" />
                      Ao vivo
                    </span>
                  ) : upcomingLive ? (
                    <>
                      <span className="inline-flex items-center gap-2 rounded-sm bg-live px-3 py-1.5 text-[10px] font-bold uppercase text-live-foreground">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live-foreground" />
                        Em breve live
                      </span>
                      <span className="rounded-sm border border-overlay-foreground/20 bg-background/30 px-3 py-1.5 text-[10px] font-bold uppercase text-overlay-foreground backdrop-blur-md">
                        {upcomingLive.day} • {upcomingLive.time}
                      </span>
                    </>
                  ) : null}
                  <span className="rounded-sm border border-overlay-foreground/20 bg-background/30 px-3 py-1.5 text-[10px] font-bold uppercase text-overlay-foreground backdrop-blur-md">
                    De Tupã para todo o Brasil
                  </span>
                </div>
                <div className="flex items-start gap-4 sm:gap-5">
                  <span className="mt-1 hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg sm:flex">
                    <Play className="h-5 w-5 translate-x-0.5 fill-current" />
                  </span>
                  <div className="min-w-0">
                    <h1 className="font-serif text-3xl font-bold leading-tight text-overlay-foreground md:text-5xl">
                      {active.title}
                    </h1>
                    <p className="mt-3 max-w-2xl text-base leading-relaxed text-overlay-muted md:text-lg">
                      {watchBlurb(active)}
                    </p>
                    <div className="mt-6">
                      <Button asChild variant="outline" size="lg">
                        <Link to="/noticias">
                          <Newspaper className="h-5 w-5" /> Acessar Vitória News
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Destaques do banner: carrossel automático */}
              <div className="overflow-hidden rounded-lg border border-border bg-card/90 shadow-2xl backdrop-blur-md" aria-label={`Destaque: ${active.title}`}>
                <div className="relative aspect-video overflow-hidden bg-black">
                  <button type="button" onClick={() => onPlay(active)} className="group relative block h-full w-full text-left">
                    <img src={active.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-media-overlay" />
                    <span className="absolute left-3 top-3 rounded-sm bg-background/85 px-2 py-1 text-[10px] font-bold uppercase text-foreground">
                      {active.kicker}
                    </span>
                    <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg transition-transform duration-200 group-hover:scale-110">
                        <Play className="h-5 w-5 translate-x-0.5 fill-current" />
                      </span>
                      <span className="font-serif text-lg font-bold text-overlay-foreground">{active.title}</span>
                    </span>
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="editorial-kicker">{active.kicker}</p>
                    <p className="mt-0.5 truncate font-serif text-sm font-bold text-foreground">{active.title}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onPlay(active)}
                    className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground transition-colors hover:bg-accent"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" /> Assistir
                  </button>
                  <span className="flex-shrink-0 text-xs tabular-nums text-muted-foreground">
                    {activeIndex + 1}/{watchFeed.length}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-1.5 lg:hidden" aria-hidden>
              {watchFeed.map((item, index) => (
                <span key={item.id} className={cn("h-1.5 w-6 rounded-full", index === activeIndex ? "bg-brand" : "bg-foreground/20")} />
              ))}
            </div>
          </div>
        </>
      )}

      {watch && (
        <WatchOverlay
          watch={watch}
          adIndex={adIndex}
          ambient={ambient}
          uiVisible={uiVisible}
          onShowUi={() => setUiVisible(true)}
          onHideUi={() => setUiVisible(false)}
          onToggleUi={() => setUiVisible((visible) => !visible)}
          onClose={onCloseWatch}
          onEnded={onEnded}
          onPremiumRequest={onPremiumRequest}
        />
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Programação dinâmica (Web Rádio Programação)                              */
/* -------------------------------------------------------------------------- */

function PodcastCard({ title, category, durationLabel, imageUrl, host, when, isCurrent, premium, onOpen }: {
  title: string;
  category: string;
  durationLabel: string;
  imageUrl: string;
  host: string;
  when: string;
  isCurrent: boolean;
  premium: boolean;
  onOpen: () => void;
}) {
  return (
    <article className="group flex gap-4 overflow-hidden rounded-md border border-border bg-card p-4 transition-colors hover:border-brand/50">
      <img src={imageUrl} alt="" loading="lazy" className="h-20 w-20 flex-shrink-0 rounded-md object-cover" />
      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-bold uppercase text-brand">{category}</span>
        <h3 className="mt-1 font-serif text-sm font-bold leading-snug text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {durationLabel} • Apresentador(a): {host} • {when}
        </p>
        <button
          type="button"
          onClick={onOpen}
          aria-label={premium ? `Assinar para ouvir ${title}` : `Reproduzir podcast ${title}`}
          aria-pressed={isCurrent}
          className={`mt-3 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
            premium
              ? "bg-secondary text-secondary-foreground hover:bg-brand hover:text-brand-foreground"
              : isCurrent
                ? "bg-brand text-brand-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-brand hover:text-brand-foreground"
          }`}
        >
          {premium ? <Lock className="h-3.5 w-3.5" /> : isCurrent ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
          {premium ? "Premium" : isCurrent ? "Tocando" : "Ouvir"}
        </button>
      </div>
    </article>
  );
}

function ProgrammingSection({
  onPlay,
  onPremium,
}: {
  onPlay: (item: WatchFeedItem) => void;
  onPremium: (target: PremiumTarget) => void;
}) {
  const player = useRadioPlayerContext();

  const handleRow = (entry: ScheduleEntry) => {
    if (entry.premium) {
      onPremium({ kind: entry.kind, title: entry.title, host: entry.host, when: `${entry.day} • ${entry.time}` });
      return;
    }
    if (entry.kind === "live") {
      const liveItem = watchFeed.find((item) => item.id === "live-now-1");
      if (liveItem) {
        onPlay(liveItem);
      }
      return;
    }
    if (entry.kind === "podcast") {
      const podcast = podcasts.find((item) => !item.premium);
      if (podcast) {
        player.playPodcast(podcast);
      }
    }
    // Programas abertos (não-premium) são informativos nesta tela.
  };

  const handlePodcast = (podcast: (typeof podcasts)[number]) => {
    if (podcast.premium) {
      onPremium({ kind: "podcast", title: podcast.title, host: podcast.host, when: podcast.when });
      return;
    }
    player.playPodcast(podcast);
  };

  return (
    <section className="page-band">
      <div className="container grid gap-10 lg:grid-cols-[17rem_1fr]">
        {/* Menu lateral da programação — esquerda, como no layout original */}
        <aside className="space-y-5">
          <div>
            <p className="editorial-kicker">Web Rádio</p>
            <h2 className="mt-2 font-serif text-2xl font-bold">Programação</h2>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Clique em cada horário para assistir a live no banner ou ouvir a prévia do podcast.
            </p>
          </div>
          <div className="space-y-3" data-testid="schedule-grid">
            {schedule.map((entry, index) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => handleRow(entry)}
                aria-label={`${entry.day} • ${entry.time} — ${entry.title} (apresentador(a): ${entry.host})`}
                className={cn(
                  "block w-full border-l-2 p-4 text-left transition-colors",
                  index === 0 ? "border-brand bg-card" : "border-border hover:border-brand/60",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase text-brand">{entry.day} • {entry.time}</span>
                  {entry.premium ? (
                    <span className="inline-flex items-center gap-1 rounded-sm bg-secondary px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">
                      <Lock className="h-2.5 w-2.5" /> Premium
                    </span>
                  ) : entry.kind === "live" ? (
                    <span className="inline-flex items-center gap-1 rounded-sm bg-live px-1.5 py-0.5 text-[9px] font-bold uppercase text-live-foreground">
                      <span className="h-1 w-1 animate-pulse rounded-full bg-live-foreground" /> Ao vivo
                    </span>
                  ) : null}
                </span>
                <h3 className="mt-1.5 text-sm font-bold leading-snug text-foreground">{entry.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">Apresentador(a): {entry.host}</p>
              </button>
            ))}
          </div>
        </aside>

        {/* Podcasts sob demanda — conteúdo principal à direita */}
        <div>
          <div className="mb-6 flex items-end justify-between border-b border-border pb-4">
            <div>
              <p className="editorial-kicker">Sob demanda</p>
              <h2 className="mt-2 font-serif text-3xl font-bold">Podcasts</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {podcasts.filter((item) => !item.premium).length} prévias gratuitas • episódios completos premium
            </span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {podcasts.map((podcast) => (
              <PodcastCard
                key={podcast.id}
                title={podcast.title}
                category={podcast.category}
                durationLabel={podcast.durationLabel}
                imageUrl={podcast.imageUrl}
                host={podcast.host}
                when={podcast.when}
                onOpen={() => handlePodcast(podcast)}
                isCurrent={player.nowPlaying?.id === podcast.id && player.nowPlaying?.kind === "podcast"}
                premium={podcast.premium}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Entretenimento (Reels e stories — seção dividida)                          */
/* -------------------------------------------------------------------------- */

function EntertainmentBand({ onSelectId }: { onSelectId: (id: string) => void }) {
  return (
    <section className="page-band border-y border-border bg-card">
      <div className="container">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="editorial-kicker">Web Rádio</p>
            <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">Entretenimento</h2>
            <p className="mt-2 text-muted-foreground">Reels e stories produzidos pela redação.</p>
          </div>
        </div>
        <div className="grid gap-10 lg:grid-cols-2">
          <MediaRail
            title="Reels da redação"
            eyebrow="Reels"
            items={socialMedia}
            portrait
            onSelect={(item) => onSelectId(item.id)}
          />
          <MediaRail
            title="Stories em destaque"
            eyebrow="Stories"
            items={stories}
            portrait
            onSelect={(item) => onSelectId(item.id)}
          />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Institucional (somente via menu)                                          */
/* -------------------------------------------------------------------------- */

function InstitutionalBand() {
  const location = useLocation();
  if (location.hash !== "#institucional") {
    return null;
  }

  return (
    <section id="institucional" className="border-y border-border py-16 md:py-24">
      <div className="container">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="editorial-kicker">Área institucional</p>
            <h2 className="mt-3 max-w-2xl font-serif text-4xl font-bold md:text-5xl">Uma voz que informa, acolhe e conecta.</h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">A Web Rádio Vitória nasceu para zelar pela verdade dos fatos e levar fé, esperança e informação de qualidade. De Tupã, São Paulo, transmitimos para todo o Brasil.</p>
            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-4">
              {[{ icon: Heart, value: "Fé", label: "e esperança" }, { icon: Newspaper, value: "Verdade", label: "no jornalismo" }, { icon: Users, value: "29K+", label: "seguidores" }, { icon: Radio, value: "24h", label: "no ar" }].map(({ icon: Icon, value, label }) => (
                <div key={value} className="bg-background p-5">
                  <Icon className="mb-3 h-5 w-5 text-brand" />
                  <strong className="block font-serif text-xl">{value}</strong>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild><Link to="/contato">Fale com a rádio</Link></Button>
              <Button asChild variant="outline"><Link to="/noticias"><Newspaper className="h-4 w-4" /> Vitória News</Link></Button>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-border">
            <img src={institutionalImage} alt="Estúdio da Web Rádio Vitória" loading="lazy" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-media-overlay" />
            <div className="absolute bottom-0 p-6">
              <Mic2 className="mb-3 h-8 w-8 text-brand" />
              <p className="font-serif text-2xl font-bold text-overlay-foreground">Tupã, SP — Brasil</p>
              <p className="text-sm text-overlay-muted">Notícias, informação e conteúdo para toda a comunidade.</p>
            </div>
          </div>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {institutionalServices.map((service) => (
            <article key={service.title} className="border-t-2 border-brand pt-5">
              <h3 className="font-serif text-lg font-bold">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Painel da área premium                                                    */
/* -------------------------------------------------------------------------- */

function PremiumPanel({ target, onClose }: { target: PremiumTarget; onClose: () => void }) {
  return (
    <div
      data-testid="premium-panel"
      role="dialog"
      aria-label="Área premium"
      className="fixed inset-0 z-[95] flex items-center justify-center p-4"
    >
      <button type="button" aria-label="Fechar painel premium" onClick={onClose} className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-brand/40 bg-card p-6 shadow-2xl md:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <Crown className="mb-3 h-9 w-9 text-brand" />
        <p className="editorial-kicker">Área premium</p>
        <h2 className="mt-2 font-serif text-2xl font-bold text-foreground">{target.title}</h2>
        {target.host && (
          <p className="mt-3 text-sm text-muted-foreground">Apresentador(a): {target.host}</p>
        )}
        {target.when && (
          <p className="mt-1 text-sm text-muted-foreground">Data e horário: {target.when}</p>
        )}
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Reapresentações de lives e podcasts na íntegra são exclusivos para assinantes da área premium.
          Assine para assistir e ouvir sem limites.
        </p>
        <div className="mt-5 space-y-2 rounded-md border border-border bg-background p-4">
          <p className="flex items-center gap-2 text-xs font-bold text-foreground"><Play className="h-3.5 w-3.5 text-brand" /> Reapresentações de lives</p>
          <p className="flex items-center gap-2 text-xs font-bold text-foreground"><Play className="h-3.5 w-3.5 text-brand" /> Podcasts na íntegra</p>
          <p className="flex items-center gap-2 text-xs font-bold text-foreground"><Radio className="h-3.5 w-3.5 text-brand" /> Conteúdos especiais da programação</p>
        </div>
        <Button className="mt-5 w-full" onClick={onClose}>
          <Crown className="h-4 w-4" /> Assinar a área premium
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Home                                                                       */
/* -------------------------------------------------------------------------- */

export default function Home() {
  const [watch, setWatch] = useState<WatchState | null>(null);
  const [premium, setPremium] = useState<PremiumTarget | null>(null);

  const playNow = useCallback((item: WatchFeedItem) => {
    setPremium(null);
    setWatch({ item, phase: "playing" });
  }, []);

  const closeWatch = useCallback(() => setWatch(null), []);

  const handleEnded = useCallback(() => {
    setWatch((prev) => {
      if (!prev || prev.phase !== "playing") {
        return prev;
      }
      const index = watchRecommendations.findIndex((item) => item.id === prev.item.id);
      const next = watchRecommendations[(index + 1) % watchRecommendations.length];
      return { item: prev.item, phase: "transition", next };
    });
  }, []);

  const autoPlayNext = useCallback(() => {
    setWatch((prev) => {
      if (!prev || prev.phase !== "transition") {
        return prev;
      }
      return { item: prev.next, phase: "playing" };
    });
  }, []);

  const selectWatchById = useCallback(
    (id: string) => {
      const item = watchFeed.find((entry) => entry.id === id);
      if (item) {
        playNow(item);
      }
    },
    [playNow],
  );

  const openPremium = useCallback(
    (target: PremiumTarget) => {
      setPremium(target);
    },
    [],
  );

  return (
    <Layout>
      <RadioHero
        watch={watch}
        onPlay={playNow}
        onCloseWatch={closeWatch}
        onEnded={handleEnded}
        onAutoPlay={autoPlayNext}
        onPremiumRequest={openPremium}
      />
      <ProgrammingSection onPlay={playNow} onPremium={openPremium} />
      <EntertainmentBand onSelectId={selectWatchById} />
      <InstitutionalBand />
      {premium && <PremiumPanel target={premium} onClose={() => setPremium(null)} />}
    </Layout>
  );
}