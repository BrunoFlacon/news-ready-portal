import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Crown,
  Heart,
  Lock,
  Mic2,
  Newspaper,
  Pause,
  Play,
  Radio,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Layout } from "@/components/Layout";
import { MediaRail } from "@/components/MediaRail";
import { YouTubePlayer } from "@/components/YouTubePlayer";
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
const WATCH_CC_STORAGE_KEY = "radio.watch.cc";

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
  cc: boolean;
  onToggleCc: () => void;
  onShowUi: () => void;
  onHideUi: () => void;
  onClose: () => void;
  onEnded: () => void;
  onPremiumRequest: (target: PremiumTarget) => void;
}

function WatchOverlay({
  watch,
  adIndex,
  ambient,
  uiVisible,
  cc,
  onToggleCc,
  onShowUi,
  onHideUi,
  onClose,
  onEnded,
  onPremiumRequest,
}: WatchOverlayProps) {
  const { item, phase } = watch;
  const transitioning = phase === "transition";
  const next = phase === "transition" ? watch.next : null;
  const vertical = item.orientation === "vertical";

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

          {/* O vídeo ocupa o banner inteiro com o player estilo YouTube */}
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <YouTubePlayer
              src={item.videoUrl}
              poster={item.image}
              caption={item.caption}
              orientation={item.orientation}
              cc={cc}
              showControls={uiVisible}
              onToggleCc={onToggleCc}
              onEnded={onEnded}
            />
          </div>

          {/* Tarja do tipo no canto superior esquerdo (AO VIVO sempre visível) */}
          <div className="absolute left-4 top-4 z-20">
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
          </div>

          {/* Fechar o player (não faz parte do clone YouTube) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar player"
            className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-background/85 text-foreground transition-colors hover:bg-background"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Título, descrição e "a seguir" (hover/toque; some após 10s) */}
          <div
            className={cn(
              "pointer-events-none absolute left-4 top-16 z-20 max-w-2xl transition-opacity duration-300",
              uiVisible ? "opacity-100" : "opacity-0",
            )}
          >
            <p className="editorial-kicker text-overlay-foreground [text-shadow:_0_1px_2px_rgba(0,0,0,0.8)]">{item.kicker}</p>
            <h3 className="mt-1 font-serif text-lg font-bold leading-snug text-overlay-foreground [text-shadow:_0_1px_2px_rgba(0,0,0,0.8)] lg:text-2xl">
              {item.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-overlay-muted [text-shadow:_0_1px_2px_rgba(0,0,0,0.8)]">
              {watchBlurb(item)}
            </p>
            {next && <p className="mt-2 text-xs font-bold text-brand">A seguir: {next.title}</p>}
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

  // Legenda (CC): o player lembra a escolha do usuário entre sessões.
  const [cc, setCc] = useState(
    () => window.localStorage.getItem(WATCH_CC_STORAGE_KEY) !== "off",
  );
  const toggleCc = useCallback(() => {
    setCc((value) => {
      const next = !value;
      window.localStorage.setItem(WATCH_CC_STORAGE_KEY, next ? "on" : "off");
      return next;
    });
  }, []);

  const active = watchFeed[activeIndex % watchFeed.length];
  // Quando a manchete tem matéria vinculada, a capa abre o artigo para leitura.
  const articleLink = active.articleId ? `/artigo/${active.articleId}` : null;

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
          {/* A capa do destaque cobre o banner inteiro. Quando a manchete tem
              matéria vinculada, a capa abre o artigo para leitura; sem matéria,
              o clique na capa reproduz. O play central aparece só no hover. */}
          <div className="group absolute inset-0 block h-full w-full">
            {articleLink ? (
              <Link
                to={articleLink}
                aria-label={`Abrir matéria: ${active.title}`}
                className="absolute inset-0 block h-full w-full"
              >
                <img
                  src={active.image}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-hero-overlay" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onPlay(active)}
                aria-label={`Reproduzir ${active.title}`}
                className="absolute inset-0 block h-full w-full"
              >
                <img
                  src={active.image}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-hero-overlay" />
              </button>
            )}

            {/* Botão do player no centro da capa — visível apenas ao passar o
                dedo/mouse sobre a capa ou ao focar (estilo YouTube) */}
            <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
              <button
                type="button"
                onClick={() => onPlay(active)}
                aria-label={`Reproduzir ${active.title}`}
                className="pointer-events-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand/95 text-brand-foreground shadow-2xl ring-4 ring-white/25 transition-transform duration-200 group-hover:scale-110 md:h-24 md:w-24"
              >
                <Play className="h-9 w-9 translate-x-0.5 fill-current md:h-10 md:w-10" />
              </button>
            </span>
          </div>
          <div className="container relative flex min-h-[640px] flex-col justify-end py-12 md:min-h-[700px] md:py-16">
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
                <div className="min-w-0">
                  <h1 className="font-serif text-3xl font-bold leading-tight text-overlay-foreground md:text-5xl">
                    {articleLink ? (
                      <Link to={articleLink} className="transition-colors hover:text-brand">
                        {active.title}
                      </Link>
                    ) : (
                      active.title
                    )}
                  </h1>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-overlay-muted md:text-lg">
                    {watchBlurb(active)}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    {articleLink && (
                      <Button asChild size="lg">
                        <Link to={articleLink} className="gap-2">
                          <BookOpen className="h-5 w-5" /> Ler matéria
                        </Link>
                      </Button>
                    )}
                    <Button asChild variant="outline" size="lg">
                      <Link to="/noticias">
                        <Newspaper className="h-5 w-5" /> Acessar Vitória News
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-1.5 lg:hidden" aria-label="Selecionar manchete em destaque">
              {watchFeed.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Ir para manchete: ${item.title}`}
                  aria-current={index === activeIndex}
                  className={cn(
                    "h-1.5 w-6 rounded-full transition-colors",
                    index === activeIndex ? "bg-brand" : "bg-foreground/20 hover:bg-foreground/40",
                  )}
                />
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
          cc={cc}
          onToggleCc={toggleCc}
          onShowUi={() => setUiVisible(true)}
          onHideUi={() => setUiVisible(false)}
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

  const location = useLocation();
  const navigate = useNavigate();

  // O botão "Assine" do topo aponta para a assinatura: abre o painel premium
  // e limpa o hash da URL para o painel não reaparecer em recarregamentos.
  useEffect(() => {
    if (location.hash === "#assinatura") {
      setPremium({ kind: "premium", title: "Área Premium da Web Rádio Vitória" });
      navigate(location.pathname, { replace: true });
    }
  }, [location.hash, navigate, location.pathname]);

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