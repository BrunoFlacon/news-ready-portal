import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  Captions,
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
 * Rendições reais exigem fontes multi-arquivo ou HLS; com uma única fonte,
 * a seleção fica registrada e aplicada quando houver qualidades disponíveis.
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

/**
 * Player estilo YouTube: reproduz em tela cheia no banner gigante com barra
 * de controles própria (timeline, play/pause, volume, legendas, velocidade,
 * qualidade, teatro, picture-in-picture e tela cheia). Portado do clone
 * anexado em src/clone-youtube-player, convertido para React.
 */
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
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [paused, setPaused] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [speed, setSpeed] = useState(1);
  const [qualityOpen, setQualityOpen] = useState(false);
  const [quality, setQuality] = useState<WatchQuality>("auto");
  const [activeQuality, setActiveQuality] = useState<WatchQuality>("1080");
  const [theater, setTheater] = useState(false);
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

  // Reproduz automaticamente e volta à qualidade automática quando o item muda.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    setPaused(false);
    setActiveQuality(resolveAutoQuality());
    void video.play().catch(() => undefined);
  }, [src]);

  const getTimelinePosition = useCallback((clientX: number) => {
    const timeline = timelineRef.current;
    if (!timeline) {
      return 0;
    }
    const rect = timeline.getBoundingClientRect();
    return Math.min(Math.max(0, clientX - rect.left), rect.width) / rect.width || 0;
  }, []);

  const handlePreview = (clientX: number) => {
    const position = getTimelinePosition(clientX);
    previewRef.current = position;
    setPreview(position);
  };

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
      void video.play().catch(() => undefined);
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  }, []);

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
  };

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else {
      void container.requestFullscreen().catch(() => undefined);
    }
  }, []);

  const togglePictureInPicture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) {
      return;
    }
    if (document.pictureInPictureElement) {
      void document.exitPictureInPicture().catch(() => undefined);
    } else {
      void video.requestPictureInPicture().catch(() => undefined);
    }
  }, []);

  const cycleSpeed = () => {
    setSpeed((current) => {
      const index = SPEED_STEPS.indexOf(current);
      return SPEED_STEPS[(index + 1) % SPEED_STEPS.length];
    });
  };

  const selectQuality = (level: WatchQuality) => {
    setQuality(level);
    setActiveQuality(level === "auto" ? resolveAutoQuality() : level);
    setQualityOpen(false);
  };

  const startScrubbing = (event: React.PointerEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    scrubbingWasPausedRef.current = video.paused;
    setScrubbing(true);
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
      void video.play().catch(() => undefined);
      setPaused(false);
    }
    setPreview(0);
    setScrubbing(false);
  }, []);

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
  // i picture-in-picture, m mudo, setas/j/l avançar/voltar, c legendas.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target instanceof HTMLInputElement) {
        return;
      }
      if (event.key === " " && target instanceof HTMLButtonElement) {
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

  return (
    <div
      ref={containerRef}
      data-testid="youtube-player"
      className={cn(
        "group/player relative flex h-full w-full items-center justify-center overflow-hidden",
        orientation === "vertical" ? "aspect-[9/16] h-full w-auto rounded-lg bg-black shadow-2xl" : "rounded-lg",
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
        onClick={togglePlay}
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
          "relative z-[1] h-full w-full",
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
        className={cn(
          "absolute inset-x-0 bottom-0 z-[5] transition-opacity duration-150",
          controlsVisible
            ? "opacity-100"
            : "pointer-events-none opacity-0 group-hover/player:pointer-events-auto group-hover/player:opacity-100",
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

        {/* Linha de controles */}
        <div className="relative z-[1] flex items-center gap-1 px-2 pb-2 text-white">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={paused ? "Reproduzir vídeo" : "Pausar vídeo"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
          >
            {paused ? <Play className="h-5 w-5 fill-current" /> : <Pause className="h-5 w-5 fill-current" />}
          </button>

          <div className="whitespace-nowrap px-1 text-xs font-medium tabular-nums">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </div>

          <div className="flex-1" />

          {/* Volume no canto direito, como pedido */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Ativar som do vídeo" : "Silenciar vídeo"}
            aria-pressed={muted}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
          >
            {muted ? (
              <VolumeX className="h-5 w-5" />
            ) : volume >= 0.5 ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <Volume1 className="h-5 w-5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={onVolumeInput}
            aria-label="Volume do vídeo"
            className="h-1.5 w-16 cursor-pointer accent-live lg:w-24"
          />

          <button
            type="button"
            onClick={onToggleCc}
            aria-label="Legendas do vídeo"
            aria-pressed={cc}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
              cc ? "text-brand" : "text-white hover:bg-white/15",
            )}
          >
            <Captions className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={cycleSpeed}
            aria-label="Velocidade de reprodução"
            className="flex h-9 items-center justify-center rounded-full px-2 text-xs font-bold text-white transition-colors hover:bg-white/15"
          >
            {speed}x
          </button>

          {/* Seletor de qualidade (padrão: Auto — 1080p em conexões boas) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setQualityOpen((value) => !value)}
              aria-label="Qualidade do vídeo"
              aria-haspopup="menu"
              aria-expanded={qualityOpen}
              className="flex h-9 items-center justify-center gap-1 rounded-full px-2 text-white transition-colors hover:bg-white/15"
            >
              <Gauge className="h-4 w-4" />
              <span className="text-[10px] font-bold">
                {quality === "auto" ? `Auto (${QUALITY_LABELS[activeQuality]})` : QUALITY_LABELS[quality]}
              </span>
            </button>
            {qualityOpen && (
              <div
                role="menu"
                data-testid="quality-menu"
                className="absolute bottom-10 right-0 z-30 w-44 overflow-hidden rounded-md border border-border bg-background p-1 shadow-2xl"
              >
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Qualidade
                </p>
                {QUALITY_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    role="menuitemradio"
                    aria-checked={quality === level}
                    onClick={() => selectQuality(level)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-sm px-3 py-1.5 text-left text-xs",
                      quality === level ? "bg-brand font-bold text-brand-foreground" : "text-foreground hover:bg-secondary",
                    )}
                  >
                    {QUALITY_LABELS[level]}
                    {level === "auto" && <span className="text-[10px] opacity-70">automático</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setTheater((value) => !value)}
            aria-label="Alternar modo teatro"
            aria-pressed={theater}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
          >
            {theater ? <RectangleVertical className="h-5 w-5" /> : <RectangleHorizontal className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={togglePictureInPicture}
            aria-label="Mini player (picture-in-picture)"
            aria-pressed={miniPlayer}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
          >
            <PictureInPicture2 className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
          >
            {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}