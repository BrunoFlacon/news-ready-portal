import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  Captions,
  Check,
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Gauge,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RectangleHorizontal,
  RectangleVertical,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

type WatchQuality = "auto" | "144" | "240" | "360" | "480" | "720" | "1080";

const QUALITY_LEVELS: WatchQuality[] = ["auto", "1080", "720", "480", "360", "240", "144"];

const QUALITY_LABELS: Record<WatchQuality, string> = {
  auto: "Auto",
  "144": "144p",
  "240": "240p",
  "360": "360p",
  "480": "480p",
  "720": "720p",
  "1080": "1080p",
};

const SPEED_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const PLAYER_PREFS_KEY = "radio.watch.player";

/** Preferências persistidas da barra do player (volume, velocidade, etc.). */
interface PlayerPrefs {
  volume: number;
  muted: boolean;
  speed: number;
  quality: WatchQuality;
  theater: boolean;
}

const DEFAULT_PREFS: PlayerPrefs = { volume: 0.85, muted: false, speed: 1, quality: "auto", theater: false };

function loadPlayerPrefs(): PlayerPrefs {
  try {
    const raw = window.localStorage.getItem(PLAYER_PREFS_KEY);
    if (!raw) {
      return DEFAULT_PREFS;
    }
    const parsed = JSON.parse(raw) as Partial<PlayerPrefs>;
    return {
      volume:
        typeof parsed.volume === "number" && parsed.volume >= 0 && parsed.volume <= 1
          ? parsed.volume
          : DEFAULT_PREFS.volume,
      muted: parsed.muted === true,
      speed:
        typeof parsed.speed === "number" && SPEED_STEPS.includes(parsed.speed)
          ? parsed.speed
          : DEFAULT_PREFS.speed,
      quality: QUALITY_LEVELS.includes(parsed.quality as WatchQuality)
        ? (parsed.quality as WatchQuality)
        : DEFAULT_PREFS.quality,
      theater: parsed.theater === true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePlayerPrefs(prefs: PlayerPrefs) {
  try {
    window.localStorage.setItem(PLAYER_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Armazenamento indisponível (privado/quota): segue sem persistir.
  }
}

const leadingZero = new Intl.NumberFormat(undefined, { minimumIntegerDigits: 2 });

function formatDuration(time: number) {
  if (!Number.isFinite(time) || time <= 0) {
    return "0:00";
  }
  const seconds = Math.floor(time % 60);
  const minutes = Math.floor(time / 60) % 60;
  const hours = Math.floor(time / 3600);
  return hours > 0
    ? `${hours}:${leadingZero.format(minutes)}:${leadingZero.format(seconds)}`
    : `${minutes}:${leadingZero.format(seconds)}`;
}

/**
 * Qualidade "Auto": escolhe a melhor resolução pela velocidade da conexão
 * (Network Information API) e reduz automaticamente quando o vídeo trava.
 */
function resolveAutoQuality(): WatchQuality {
  const connection = (navigator as Navigator & { connection?: { downlink?: number } }).connection;
  const downlink = connection?.downlink;
  if (!downlink || downlink >= 5) return "1080";
  if (downlink >= 2.5) return "720";
  if (downlink >= 1.5) return "480";
  if (downlink >= 0.8) return "360";
  if (downlink >= 0.4) return "240";
  return "144";
}

function degradeQuality(level: WatchQuality): WatchQuality {
  const order: WatchQuality[] = ["1080", "720", "480", "360", "240", "144"];
  const index = order.indexOf(level);
  return order[Math.min(index + 1, order.length - 1)];
}

/* -------------------------------------------------------------------------- */
/* Botão de controle com texto explicativo (tooltip)                          */
/* -------------------------------------------------------------------------- */

interface ControlButtonProps {
  label: string;
  tooltip: string;
  pressed?: boolean;
  hasMenu?: boolean;
  expanded?: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}

function ControlButton({
  label,
  tooltip,
  pressed,
  hasMenu,
  expanded,
  onClick,
  className,
  children,
}: ControlButtonProps) {
  return (
    <div className="group/tb relative">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={pressed}
        aria-haspopup={hasMenu ? "menu" : undefined}
        aria-expanded={hasMenu ? expanded : undefined}
        className={cn(
          "flex h-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
          className ?? "w-9",
        )}
      >
        {children}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900/95 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tb:opacity-100 group-focus-within/tb:opacity-100"
      >
        {tooltip}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Player estilo YouTube                                                       */
/* -------------------------------------------------------------------------- */

interface YouTubePlayerProps {
  src: string;
  poster?: string;
  caption: string;
  orientation: "horizontal" | "vertical";
  /** Legendas (CC) ligadas/desligadas — escolha vivida pelo usuário. */
  cc: boolean;
  /** Sinal da Home (auto-ocultar após 10s / hover) para mostrar os controles. */
  showControls: boolean;
  onToggleCc: () => void;
  onEnded: () => void;
}

type SettingsView = "root" | "quality" | "speed" | "view";

export function YouTubePlayer({
  src,
  poster,
  caption,
  orientation,
  cc,
  showControls,
  onToggleCc,
  onEnded,
}: YouTubePlayerProps) {
  const initialPrefs = useRef(loadPlayerPrefs());
  const prefs = initialPrefs.current;

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [paused, setPaused] = useState(false);
  const [buffering, setBuffering] = useState(false);
  // Dedos/mouse sobre a imagem: o botão central de play (estilo YouTube)
  // aparece apenas quando o usuário passa o dedo sobre a capa do vídeo.
  const [hovered, setHovered] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [muted, setMuted] = useState(prefs.muted);
  const [volume, setVolume] = useState(prefs.volume);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [speed, setSpeed] = useState(prefs.speed);
  const [openMenu, setOpenMenu] = useState<"settings" | null>(null);
  const [settingsView, setSettingsView] = useState<SettingsView>("root");
  const [quality, setQuality] = useState<WatchQuality>(prefs.quality);
  const [activeQuality, setActiveQuality] = useState<WatchQuality>(
    prefs.quality === "auto" ? resolveAutoQuality() : prefs.quality,
  );
  const [theater, setTheater] = useState(prefs.theater);
  const [fullscreen, setFullscreen] = useState(false);
  const [miniPlayer, setMiniPlayer] = useState(false);

  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const qualityRef = useRef(quality);
  qualityRef.current = quality;
  const scrubbingRef = useRef(scrubbing);
  scrubbingRef.current = scrubbing;
  const previewRef = useRef(preview);
  previewRef.current = preview;
  const scrubbingWasPausedRef = useRef(false);

  // Salva as preferências da barra (volume, mudo, velocidade, qualidade, teatro).
  useEffect(() => {
    savePlayerPrefs({ volume, muted, speed, quality, theater });
  }, [volume, muted, speed, quality, theater]);

  // Aplica preferências de áudio e velocidade à mídia (inclusive em trocas).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.muted = muted;
    video.volume = volume;
    video.playbackRate = speed;
  }, [muted, volume, speed]);

  /**
   * Reproduz com proteção contra autoplay bloqueado (ex.: iframe do preview):
   * se o navegador recusar tocar com áudio, inicia mudo e segue tocando.
   */
  const attemptPlay = useCallback((video: HTMLVideoElement) => {
    const started = video.play();
    if (started !== undefined) {
      return started.catch(() => {
        video.muted = true;
        setMuted(true);
        setVolumeOpen(true);
        return video.play().catch(() => undefined);
      });
    }
    return started;
  }, []);

  // Autoplay: volta ao início e retoma a qualidade automática quando o item muda.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    setPaused(false);
    setActiveQuality(qualityRef.current === "auto" ? resolveAutoQuality() : qualityRef.current);
    void attemptPlay(video);
  }, [src, attemptPlay]);

  // Esconde o campo de volume ~1,6s depois de usá-lo (hover ainda o revela).
  useEffect(() => {
    if (!volumeOpen) {
      return;
    }
    const timer = setTimeout(() => setVolumeOpen(false), 1600);
    return () => clearTimeout(timer);
  }, [volumeOpen, volume]);

  const getTimelinePosition = useCallback((clientX: number) => {
    const timeline = timelineRef.current;
    if (!timeline) {
      return 0;
    }
    const rect = timeline.getBoundingClientRect();
    return Math.min(Math.max(0, clientX - rect.left), rect.width) / rect.width || 0;
  }, []);

  const handlePreview = useCallback(
    (clientX: number) => {
      const position = getTimelinePosition(clientX);
      previewRef.current = position;
      setPreview(position);
    },
    [getTimelinePosition],
  );

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const max = Number.isFinite(video.duration) ? video.duration : Infinity;
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, max));
  }, []);

  // Conexões lentas: "Auto" reduz a qualidade efetiva até a reprodução fluir.
  const handleWaiting = useCallback(() => {
    setBuffering(true);
    if (qualityRef.current === "auto") {
      setActiveQuality((level) => degradeQuality(level));
    }
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (pausedRef.current) {
      void attemptPlay(video);
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  }, [attemptPlay]);

  // Clique no player (fora dos controles): fecha menus e dá play/pause.
  const handlePlayerClick = useCallback(() => {
    setOpenMenu(null);
    setSettingsView("root");
    setVolumeOpen(false);
    togglePlay();
  }, [togglePlay]);

  const toggleMute = useCallback(() => {
    if (mutedRef.current) {
      if (volumeRef.current === 0) {
        setVolume(0.85);
      }
      setMuted(false);
    } else {
      setMuted(true);
    }
  }, []);

  const onVolumeInput = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setVolume(value);
    setMuted(value === 0);
    setVolumeOpen(true);
  };

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => undefined);
    } else {
      void container.requestFullscreen?.().catch(() => undefined);
    }
  }, []);

  const togglePictureInPicture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) {
      return;
    }
    if (document.pictureInPictureElement) {
      void document.exitPictureInPicture?.().catch(() => undefined);
    } else {
      void video.requestPictureInPicture?.().catch(() => undefined);
    }
  }, []);

  const openSettings = () => {
    setOpenMenu((current) => {
      if (current === "settings") {
        return null;
      }
      setSettingsView("root");
      return "settings";
    });
    setVolumeOpen(false);
  };

  const selectQuality = (level: WatchQuality) => {
    setQuality(level);
    setActiveQuality(level === "auto" ? resolveAutoQuality() : level);
    setOpenMenu(null);
    setSettingsView("root");
  };

  const startScrubbing = (event: React.PointerEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    scrubbingWasPausedRef.current = video.paused;
    setScrubbing(true);
    setOpenMenu(null);
    setSettingsView("root");
    setVolumeOpen(false);
    video.pause();
    handlePreview(event.clientX);
  };

  const endScrubbing = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const position = previewRef.current;
    setProgress(position);
    if (Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = position * video.duration;
    }
    if (!scrubbingWasPausedRef.current) {
      void attemptPlay(video);
      setPaused(false);
    }
    setPreview(0);
    setScrubbing(false);
  }, [attemptPlay]);

  // Arrastar no timeline funciona mesmo com o cursor fora do elemento.
  useEffect(() => {
    if (!scrubbing) {
      return;
    }
    const onMove = (event: PointerEvent) => handlePreview(event.clientX);
    const onUp = () => endScrubbing();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [scrubbing, endScrubbing, handlePreview, getTimelinePosition]);

  // Atalhos de teclado do YouTube: espaço/k play, f tela cheia, t teatro,
  // i picture-in-picture, m mudo, j/l/setas avançar/voltar, c legendas, Esc fecha menus.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target instanceof HTMLInputElement) {
        return;
      }
      if (event.key === " " && target instanceof HTMLButtonElement) {
        return;
      }
      if (event.key === "Escape") {
        setOpenMenu(null);
        setSettingsView("root");
        setVolumeOpen(false);
        return;
      }
      switch (event.key.toLowerCase()) {
        case " ":
        case "k":
          event.preventDefault();
          togglePlay();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "t":
          setTheater((value) => !value);
          break;
        case "i":
          togglePictureInPicture();
          break;
        case "m":
          toggleMute();
          break;
        case "j":
        case "arrowleft":
          skip(-5);
          break;
        case "l":
        case "arrowright":
          skip(5);
          break;
        case "c":
          onToggleCc();
          break;
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [togglePlay, toggleFullscreen, togglePictureInPicture, toggleMute, skip, onToggleCc]);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    const video = videoRef.current;
    const onEnterPiP = () => setMiniPlayer(true);
    const onLeavePiP = () => setMiniPlayer(false);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    video?.addEventListener("enterpictureinpicture", onEnterPiP);
    video?.addEventListener("leavepictureinpicture", onLeavePiP);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      video?.removeEventListener("enterpictureinpicture", onEnterPiP);
      video?.removeEventListener("leavepictureinpicture", onLeavePiP);
    };
  }, [src]);

  const controlsVisible = showControls || paused;
  const qualityLabel =
    quality === "auto" ? `Auto (${QUALITY_LABELS[activeQuality]})` : QUALITY_LABELS[quality];
  const volumePercent = muted ? 0 : Math.round(volume * 100);

  const viewActions: Array<{
    key: string;
    label: string;
    icon: typeof RectangleHorizontal;
    active: boolean;
    run: () => void;
  }> = [
    {
      key: "theater",
      label: "Teatro",
      icon: RectangleVertical,
      active: theater,
      run: () => setTheater((value) => !value),
    },
    {
      key: "pip",
      label: "Mini player",
      icon: PictureInPicture2,
      active: miniPlayer,
      run: togglePictureInPicture,
    },
    { key: "fullscreen", label: "Tela cheia", icon: Maximize, active: fullscreen, run: toggleFullscreen },
  ];

  const activeViewLabel = theater
    ? "Teatro"
    : miniPlayer
      ? "Mini player"
      : fullscreen
        ? "Tela cheia"
        : "Padrão";

  const menuItemClasses = (active: boolean) =>
    cn(
      "flex w-full items-center justify-between gap-2 rounded-sm px-3 py-1.5 text-left text-xs",
      active ? "bg-brand font-bold text-brand-foreground" : "text-foreground hover:bg-secondary",
    );

  return (
    <div
      ref={containerRef}
      data-testid="youtube-player"
      onClick={handlePlayerClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={cn(
        "group/player relative flex h-full cursor-pointer items-center justify-center overflow-hidden",
        orientation === "vertical"
          ? "aspect-[9/16] h-full w-auto max-w-full rounded-lg bg-black shadow-2xl"
          : "w-full rounded-lg",
        scrubbing && "scrubbing",
        paused && "paused",
        fullscreen && "full-screen",
      )}
    >
      <video
        ref={videoRef}
        key={src}
        data-testid="watch-media"
        src={src}
        poster={poster}
        playsInline
        preload="auto"
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          setCurrentTime(video.currentTime);
          setDuration(video.duration);
          setProgress(video.duration > 0 ? video.currentTime / video.duration : 0);
        }}
        onLoadedData={(event) => setDuration(event.currentTarget.duration)}
        onEnded={onEnded}
        onVolumeChange={(event) => {
          setMuted(event.currentTarget.muted);
          setVolume(event.currentTarget.volume);
        }}
        onWaiting={handleWaiting}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setBuffering(false)}
        className={cn(
          "pointer-events-none relative z-[1] h-full w-full",
          orientation === "horizontal"
            ? theater
              ? "object-contain"
              : "object-cover"
            : "object-contain",
        )}
      />

      {/* Thumbnail da capa durante o arraste no timeline (scrubbing) */}
      {scrubbing && poster && (
        <img
          src={poster}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] h-full w-full object-cover"
        />
      )}

      {/* Indicador de buffering */}
      {buffering && (
        <span className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-white drop-shadow-lg" />
        </span>
      )}

      {/*
        Botão central de play, no estilo do play da capa do YouTube:
        existe somente quando o vídeo tem capa (poster) e aparece quando o
        usuário passa o dedo/mouse sobre a imagem.
      */}
      {poster && (
        <button
          type="button"
          data-testid="player-center-play"
          aria-label={paused ? "Reproduzir conteúdo" : "Pausar conteúdo"}
          onClick={(event) => {
            event.stopPropagation();
            togglePlay();
          }}
          className={cn(
            "absolute inset-0 z-[2] flex items-center justify-center transition-opacity duration-200",
            hovered
              ? "opacity-100"
              : "pointer-events-none opacity-0",
          )}
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/95 text-brand-foreground shadow-2xl ring-4 ring-white/25 transition-transform duration-200 group-hover:scale-110 md:h-24 md:w-24">
            {paused ? (
              <Play className="h-9 w-9 translate-x-0.5 fill-current md:h-10 md:w-10" />
            ) : (
              <Pause className="h-9 w-9 fill-current md:h-10 md:w-10" />
            )}
          </span>
        </button>
      )}

      {/* Legenda (CC) sobre o vídeo — sem tarja preta, só sombra para contraste */}
      {cc && (
        <div
          data-testid="watch-caption"
          className="pointer-events-none absolute inset-x-0 bottom-20 z-[4] flex justify-center px-4 lg:bottom-24"
        >
          <p className="max-w-3xl px-4 py-2 text-center text-sm font-medium leading-relaxed text-white [text-shadow:_0_1px_2px_rgba(0,0,0,0.9),_0_0_10px_rgba(0,0,0,0.6)]">
            {caption}
          </p>
        </div>
      )}

      {/* Barra de controles inferior (clone do YouTube) */}
      <div
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "absolute inset-x-0 bottom-0 z-[5] transition-opacity duration-150",
          controlsVisible
            ? "opacity-100"
            : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100",
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent"
          aria-hidden
        />

        {/* Timeline: progresso, pré-visualização no hover e arraste (scrub) */}
        <div
          ref={timelineRef}
          data-testid="player-timeline"
          className="relative z-[1] mx-3 flex h-8 cursor-pointer touch-none items-center"
          onPointerDown={startScrubbing}
          onPointerMove={(event) => {
            handlePreview(event.clientX);
          }}
          onPointerLeave={() => {
            if (!scrubbingRef.current) {
              setPreview(0);
            }
          }}
        >
          <div className="group/timeline relative h-1 w-full">
            <span className="absolute inset-y-0 left-0 bg-white/50" style={{ width: `${preview * 100}%` }} />
            <span className="absolute inset-y-0 left-0 bg-live" style={{ width: `${progress * 100}%` }} />
            <span
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-live shadow-md"
              style={{ left: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Linha de controles: play, tempo, volume (vertical), legendas e configurações (⋮) */}
        <div className="relative z-[1] flex items-center gap-0.5 px-2 pb-2 text-white">
          <ControlButton
            label={paused ? "Reproduzir vídeo" : "Pausar vídeo"}
            tooltip={paused ? "Reproduzir (K)" : "Pausar (K)"}
            onClick={togglePlay}
          >
            {paused ? <Play className="h-5 w-5 fill-current" /> : <Pause className="h-5 w-5 fill-current" />}
          </ControlButton>

          <div className="min-w-0 whitespace-nowrap px-1.5 text-xs font-medium tabular-nums">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </div>

          <div className="flex-1" />

          {/* Volume: alto-falante + barra vertical que abre para cima no hover/toque */}
          <div className="group/vol relative flex items-center">
            <ControlButton
              label={muted ? "Ativar som do vídeo" : "Silenciar vídeo"}
              tooltip={muted ? "Ativar som (M)" : "Silenciar (M)"}
              pressed={muted}
              onClick={toggleMute}
            >
              {muted ? (
                <VolumeX className="h-5 w-5" />
              ) : volume >= 0.5 ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <Volume1 className="h-5 w-5" />
              )}
            </ControlButton>
            <div
              data-testid="volume-popover"
              className={cn(
                "absolute bottom-full right-0 mb-2 flex flex-col items-center gap-1.5 rounded-md bg-neutral-900/95 px-2 py-2 shadow-xl",
                "sm:pointer-events-none sm:opacity-0 sm:transition-all sm:duration-150 sm:group-hover/vol:pointer-events-auto sm:group-hover/vol:opacity-100",
                volumeOpen && "sm:pointer-events-auto sm:opacity-100",
                "max-sm:static max-sm:mb-0 max-sm:rounded-none max-sm:bg-transparent max-sm:px-0 max-sm:py-0 max-sm:shadow-none",
              )}
            >
              {/* Barra de volume na VERTICAL (gira o input; o TAG/valor sobe com o arraste) */}
              <span className="relative block h-20 w-6">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={onVolumeInput}
                  aria-valuetext={`${volumePercent}%`}
                  aria-label="Volume do vídeo"
                  className="absolute left-1/2 top-1/2 h-1.5 w-20 -translate-x-1/2 -translate-y-1/2 rotate-[-90deg] cursor-pointer accent-live"
                />
              </span>
              <span className="w-8 text-center text-[10px] font-bold tabular-nums text-white">
                {volumePercent}%
              </span>
            </div>
          </div>

          <ControlButton
            label="Legendas do vídeo"
            tooltip={cc ? "Legendas ativadas (C)" : "Legendas desativadas (C)"}
            pressed={cc}
            onClick={onToggleCc}
            className={cn("w-9", cc && "text-brand")}
          >
            <Captions className="h-5 w-5" />
          </ControlButton>

          {/* Configurações (⋮): qualidade, velocidade e exibição em um só botão */}
          <ControlButton
            label="Configurações do vídeo"
            tooltip="Qualidade, velocidade e exibição"
            hasMenu
            expanded={openMenu === "settings"}
            onClick={openSettings}
          >
            <EllipsisVertical className="h-5 w-5" />
          </ControlButton>

          {openMenu === "settings" && (
            <div
              role="menu"
              data-testid="settings-menu"
              className="absolute bottom-10 right-2 z-30 w-60 overflow-hidden rounded-md border border-border bg-background p-1 shadow-2xl"
            >
              {settingsView === "root" && (
                <>
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Configurações
                  </p>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setSettingsView("quality")}
                    className="flex w-full items-center justify-between gap-2 rounded-sm px-3 py-1.5 text-left text-xs text-foreground hover:bg-secondary"
                  >
                    <span className="flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      Qualidade do vídeo
                    </span>
                    <span className="flex items-center gap-1 text-[10px] opacity-70">
                      {qualityLabel}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setSettingsView("speed")}
                    className="flex w-full items-center justify-between gap-2 rounded-sm px-3 py-1.5 text-left text-xs text-foreground hover:bg-secondary"
                  >
                    <span className="flex items-center gap-2">
                      <Play className="h-3.5 w-3.5 opacity-70" />
                      Velocidade de reprodução
                    </span>
                    <span className="flex items-center gap-1 text-[10px] opacity-70">
                      {speed}x
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setSettingsView("view")}
                    className="flex w-full items-center justify-between gap-2 rounded-sm px-3 py-1.5 text-left text-xs text-foreground hover:bg-secondary"
                  >
                    <span className="flex items-center gap-2">
                      <RectangleHorizontal className="h-4 w-4" />
                      Exibição
                    </span>
                    <span className="flex items-center gap-1 text-[10px] opacity-70">
                      {activeViewLabel}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </>
              )}

              {settingsView === "quality" && (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setSettingsView("root")}
                    className="flex w-full items-center gap-1 rounded-sm px-2 py-1.5 text-left text-xs font-bold text-foreground hover:bg-secondary"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Qualidade
                  </button>
                  {QUALITY_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      role="menuitemradio"
                      aria-checked={quality === level}
                      onClick={() => selectQuality(level)}
                      className={menuItemClasses(quality === level)}
                    >
                      <span className="flex items-center gap-2">{QUALITY_LABELS[level]}</span>
                      {quality === level && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </>
              )}

              {settingsView === "speed" && (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setSettingsView("root")}
                    className="flex w-full items-center gap-1 rounded-sm px-2 py-1.5 text-left text-xs font-bold text-foreground hover:bg-secondary"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Velocidade
                  </button>
                  {SPEED_STEPS.map((step) => (
                    <button
                      key={step}
                      type="button"
                      role="menuitemradio"
                      aria-checked={speed === step}
                      onClick={() => {
                        setSpeed(step);
                        setOpenMenu(null);
                        setSettingsView("root");
                      }}
                      className={menuItemClasses(speed === step)}
                    >
                      <span className="flex items-center gap-2">
                        {step}x
                        {step === 1 && <span className="text-[10px] opacity-60">Normal</span>}
                      </span>
                      {speed === step && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </>
              )}

              {settingsView === "view" && (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setSettingsView("root")}
                    className="flex w-full items-center gap-1 rounded-sm px-2 py-1.5 text-left text-xs font-bold text-foreground hover:bg-secondary"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Exibição
                  </button>
                  {viewActions.map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      role="menuitemradio"
                      aria-checked={action.active}
                      onClick={() => {
                        action.run();
                        setOpenMenu(null);
                        setSettingsView("root");
                      }}
                      className={menuItemClasses(action.active)}
                    >
                      <span className="flex items-center gap-2">
                        <action.icon className="h-4 w-4" />
                        {action.label}
                      </span>
                      {action.active && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}