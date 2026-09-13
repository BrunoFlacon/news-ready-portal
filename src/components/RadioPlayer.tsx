/**
 * Web Rádio Vitória — Player unificado.
 *
 * Uma única instância cuida de:
 *  - a transmissão ao vivo (live);
 *  - os podcasts (áudio sob demanda com barra inferior estilo Spotify);
 *  - os vídeos/reels/stories recomendados (mini-player flutuante).
 *
 * Regras de convivência:
 *  - tocar um podcast pausa automaticamente a transmissão ao vivo;
 *  - o elemento <audio> do conteúdo atual vive no provedor (nunca é
 *    desmontado ao minimizar a barra), então a reprodução continua de onde
 *    parou inclusive no card flutuante;
 *  - o estado play/pause é sincronizado pelos eventos reais da mídia;
 *  - ao terminar um podcast, um painel de sugestões é exibido; se nada for
 *    escolhido em 3 segundos, um vídeo/reel/story "breaking" recomendado
 *    começa a tocar automaticamente em um card flutuante.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Gauge,
  Headphones,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Radio,
  SkipBack,
  SkipForward,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { podcasts, type Podcast } from "@/data/podcasts";
import { breakingVisuals, type VisualFeedItem } from "@/data/media";

export function getRadioStreamUrl(): string {
  return (import.meta.env.VITE_RADIO_STREAM_URL as string | undefined) || "";
}

export type NowPlayingKind = "live" | "podcast" | "video";

export interface NowPlaying {
  kind: NowPlayingKind;
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  audioUrl?: string;
  videoUrl?: string;
  images?: string[];
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];
const SEEK_STEP_SECONDS = 15;

export interface RadioPlayerApi {
  streamUrl: string;
  liveOpen: boolean;
  livePlaying: boolean;
  liveError: boolean;
  nowPlaying: NowPlaying | null;
  playbackPlaying: boolean;
  minimized: boolean;
  suggestionsOpen: boolean;
  queue: Podcast[];
  queueIndex: number;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  openPlayer: () => void;
  closePlayer: () => void;
  toggleLivePlay: () => void;
  playPodcast: (podcast: Podcast, list?: Podcast[]) => void;
  playVisual: (item: VisualFeedItem) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayback: () => void;
  seekTo: (seconds: number) => void;
  seekBackward: () => void;
  seekForward: () => void;
  toggleMute: () => void;
  changeVolume: (volume: number) => void;
  cyclePlaybackRate: () => void;
  minimize: () => void;
  expand: () => void;
  closeNowPlaying: () => void;
  dismissSuggestions: () => void;
  handleMediaEnded: () => void;
  liveAudioRef: React.RefObject<HTMLAudioElement>;
  npAudioRef: React.RefObject<HTMLAudioElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function useRadioPlayer(): RadioPlayerApi {
  const streamUrl = getRadioStreamUrl();
  const liveAudioRef = useRef<HTMLAudioElement>(null);
  const npAudioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [liveOpen, setLiveOpen] = useState(false);
  const [livePlaying, setLivePlaying] = useState(false);
  const [liveError, setLiveError] = useState(false);

  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [playbackPlaying, setPlaybackPlaying] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [queue, setQueue] = useState<Podcast[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const openPlayer = useCallback(() => {
    if (!streamUrl) {
      return;
    }
    // Tocar a rádio ao vivo pausa qualquer podcast/vídeo em andamento.
    npAudioRef.current?.pause();
    videoRef.current?.pause();
    setNowPlaying(null);
    setSuggestionsOpen(false);
    setLiveError(false);
    setLiveOpen(true);
  }, [streamUrl]);

  const closePlayer = useCallback(() => {
    liveAudioRef.current?.pause();
    setLiveOpen(false);
    setLivePlaying(false);
    setLiveError(false);
  }, []);

  const toggleLivePlay = useCallback(() => {
    const audio = liveAudioRef.current;
    if (!audio || !liveOpen) {
      return;
    }
    if (livePlaying) {
      audio.pause();
    } else {
      setLiveError(false);
      audio.play().catch(() => {
        setLiveError(true);
        setLivePlaying(false);
      });
    }
  }, [liveOpen, livePlaying]);

  // Liga os eventos do <audio> ao vivo e inicia a reprodução ao abrir a barra.
  useEffect(() => {
    if (!liveOpen) {
      return;
    }
    const audio = liveAudioRef.current;
    if (!audio) {
      return;
    }
    const onPlay = () => {
      setLivePlaying(true);
      setLiveError(false);
    };
    const onPause = () => setLivePlaying(false);
    const onError = () => {
      setLiveError(true);
      setLivePlaying(false);
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    audio.play().catch(() => {
      setLiveError(true);
      setLivePlaying(false);
    });
    return () => {
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, [liveOpen]);

  // Sincroniza o estado play/pause, o progresso e o fim do conteúdo atual
  // (podcast ou slideshow de vídeo) com os eventos reais da mídia.
  useEffect(() => {
    const audio = npAudioRef.current;
    if (!audio) {
      return;
    }
    const onPlay = () => setPlaybackPlaying(true);
    const onPause = () => setPlaybackPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setPlaybackPlaying(false);
      setMinimized(false);
      setSuggestionsOpen(true);
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [nowPlaying?.kind, nowPlaying?.id]);

  // Sincroniza volume, mudo e velocidade em todo meio ativo.
  useEffect(() => {
    for (const media of [npAudioRef.current, videoRef.current]) {
      if (!media) {
        continue;
      }
      media.volume = volume;
      media.muted = muted;
      media.playbackRate = playbackRate;
    }
  }, [volume, muted, playbackRate]);

  const playPodcast = useCallback((podcast: Podcast, list?: Podcast[]) => {
    liveAudioRef.current?.pause();
    videoRef.current?.pause();
    const listItems = list && list.length > 0 ? list : podcasts;
    const index = Math.max(0, listItems.findIndex((item) => item.id === podcast.id));
    setQueue(listItems);
    setQueueIndex(index);
    setNowPlaying({
      kind: "podcast",
      id: podcast.id,
      title: podcast.title,
      subtitle: `${podcast.category} • ${podcast.durationLabel}`,
      imageUrl: podcast.imageUrl,
      audioUrl: podcast.audioUrl,
    });
    setPlaybackPlaying(true);
    setMinimized(false);
    setSuggestionsOpen(false);
    setLiveOpen(false);
    setLivePlaying(false);
    setLiveError(false);
  }, []);

  const playVisual = useCallback((item: VisualFeedItem) => {
    liveAudioRef.current?.pause();
    npAudioRef.current?.pause();
    setNowPlaying({
      kind: "video",
      id: item.id,
      title: item.title,
      subtitle: item.category,
      imageUrl: item.image,
      audioUrl: item.audioUrl,
      videoUrl: item.videoUrl,
      images: item.images && item.images.length > 0 ? item.images : [item.image],
    });
    setPlaybackPlaying(true);
    setMinimized(false);
    setSuggestionsOpen(false);
    setLiveOpen(false);
    setLivePlaying(false);
    setLiveError(false);
  }, []);

  const playNext = useCallback(() => {
    if (queue.length === 0) {
      return;
    }
    playPodcast(queue[(queueIndex + 1) % queue.length], queue);
  }, [queue, queueIndex, playPodcast]);

  const playPrevious = useCallback(() => {
    if (queue.length === 0) {
      return;
    }
    playPodcast(queue[(queueIndex - 1 + queue.length) % queue.length], queue);
  }, [queue, queueIndex, playPodcast]);

  const currentMedia = useCallback(() => {
    if (nowPlaying?.kind === "video" && nowPlaying.videoUrl) {
      return videoRef.current;
    }
    return npAudioRef.current;
  }, [nowPlaying]);

  const togglePlayback = useCallback(() => {
    const media = currentMedia();
    if (!media) {
      return;
    }
    if (playbackPlaying) {
      media.pause();
    } else {
      media.play().catch(() => {
        // Reprodução rejeitada sem gesto válido; o usuário pode clicar de novo.
      });
    }
  }, [currentMedia, playbackPlaying]);

  const seekTo = useCallback(
    (seconds: number) => {
      const media = currentMedia();
      if (!media) {
        return;
      }
      media.currentTime = Math.max(
        0,
        Math.min(seconds, media.duration || seconds),
      );
      setCurrentTime(media.currentTime || 0);
    },
    [currentMedia],
  );

  const seekBackward = useCallback(() => {
    const media = currentMedia();
    if (!media) {
      return;
    }
    media.currentTime = Math.max(0, media.currentTime - SEEK_STEP_SECONDS);
    setCurrentTime(media.currentTime || 0);
  }, [currentMedia]);

  const seekForward = useCallback(() => {
    const media = currentMedia();
    if (!media) {
      return;
    }
    media.currentTime = Math.min(
      media.currentTime + SEEK_STEP_SECONDS,
      media.duration || media.currentTime + SEEK_STEP_SECONDS,
    );
    setCurrentTime(media.currentTime || 0);
  }, [currentMedia]);

  const toggleMute = useCallback(() => setMuted((value) => !value), []);
  const changeVolume = useCallback(
    (value: number) => setVolume(Math.max(0, Math.min(1, value))),
    [],
  );

  const cyclePlaybackRate = useCallback(() => {
    setPlaybackRate((rate) => {
      const next = PLAYBACK_RATES[(PLAYBACK_RATES.indexOf(rate) + 1) % PLAYBACK_RATES.length];
      return next;
    });
  }, []);

  const handleMediaEnded = useCallback(() => {
    setPlaybackPlaying(false);
    setMinimized(false);
    setSuggestionsOpen(true);
  }, []);

  // Sugestões pós-podcast: se nada for escolhido em 3s, toca um visual
  // recomendado automaticamente.
  useEffect(() => {
    if (!suggestionsOpen) {
      return;
    }
    const timer = window.setTimeout(() => {
      playVisual(breakingVisuals[0]);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [suggestionsOpen, playVisual]);

  // Inicia a reprodução quando o now-playing (podcast ou vídeo) muda.
  useEffect(() => {
    if (!nowPlaying) {
      return;
    }
    if (nowPlaying.kind === "podcast" && nowPlaying.audioUrl) {
      npAudioRef.current?.play().catch(() => setPlaybackPlaying(false));
    }
    if (nowPlaying.kind === "video" && nowPlaying.videoUrl) {
      videoRef.current?.play().catch(() => setPlaybackPlaying(false));
    }
    if (nowPlaying.kind === "video" && !nowPlaying.videoUrl && nowPlaying.audioUrl) {
      npAudioRef.current?.play().catch(() => setPlaybackPlaying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowPlaying?.kind, nowPlaying?.id]);

  const minimize = useCallback(() => setMinimized(true), []);
  const expand = useCallback(() => setMinimized(false), []);
  const closeNowPlaying = useCallback(() => {
    npAudioRef.current?.pause();
    videoRef.current?.pause();
    setNowPlaying(null);
    setPlaybackPlaying(false);
    setSuggestionsOpen(false);
    setMinimized(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);
  const dismissSuggestions = useCallback(() => setSuggestionsOpen(false), []);

  return {
    streamUrl,
    liveOpen,
    livePlaying,
    liveError,
    nowPlaying,
    playbackPlaying,
    minimized,
    suggestionsOpen,
    queue,
    queueIndex,
    currentTime,
    duration,
    volume,
    muted,
    playbackRate,
    openPlayer,
    closePlayer,
    toggleLivePlay,
    playPodcast,
    playVisual,
    playNext,
    playPrevious,
    togglePlayback,
    seekTo,
    seekBackward,
    seekForward,
    toggleMute,
    changeVolume,
    cyclePlaybackRate,
    minimize,
    expand,
    closeNowPlaying,
    dismissSuggestions,
    handleMediaEnded,
    liveAudioRef,
    npAudioRef,
    videoRef,
  };
}

interface RadioPlayerBarProps {
  url: string;
  open: boolean;
  playing: boolean;
  error: boolean;
  togglePlay: () => void;
  closePlayer: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

/** Barra da transmissão ao vivo (fixa no rodapé). */
export function RadioPlayerBar({
  url,
  open,
  playing,
  error,
  togglePlay,
  closePlayer,
  audioRef,
}: RadioPlayerBarProps) {
  if (!url || !open) {
    return null;
  }

  return (
    <div
      data-testid="radio-player-bar"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-brand/40 bg-card/95 backdrop-blur-md shadow-brand"
    >
      <div className="h-0.5 animate-pulse bg-gradient-to-r from-transparent via-brand to-transparent" />
      <div className="container mx-auto flex items-center gap-4 px-4 py-3">
        <audio ref={audioRef} src={url} preload="none" />
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pausar transmissão" : "Reproduzir transmissão"}
          aria-pressed={playing}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg transition-colors hover:bg-accent"
        >
          {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 translate-x-0.5 fill-current" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 flex-shrink-0 text-brand" />
            <span className="truncate text-sm font-bold text-foreground">Web Rádio Vitória</span>
            <span className="hidden items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:inline-flex">
              <span className={cn("h-1.5 w-1.5 rounded-full", playing ? "animate-pulse bg-live" : "bg-border")} />
              Ao Vivo
            </span>
          </div>
          <div className="mt-1 flex h-5 items-end gap-0.5" aria-hidden>
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className={cn("w-1 rounded-full transition-all duration-300", playing ? "bg-brand wave-bar" : "bg-border")}
                style={{
                  height: playing ? `${8 + ((i * 7) % 18)}px` : "4px",
                  animationDelay: playing ? `${i * 0.06}s` : undefined,
                  animationDuration: playing ? `${0.7 + ((i * 13) % 9) / 10}s` : undefined,
                }}
              />
            ))}
          </div>
          {error && (
            <p className="mt-0.5 text-xs text-destructive" role="alert">
              Não foi possível iniciar o áudio. Verifique sua conexão e clique em reproduzir novamente.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={closePlayer}
          aria-label="Fechar player"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface NowPlayingBarProps {
  nowPlaying: NowPlaying;
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  onSeekTo: (seconds: number) => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onCycleRate: () => void;
  hasQueue: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onTogglePlay?: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

/** Barra inferior estilo Spotify para podcasts em reprodução. */
export function NowPlayingBar({
  nowPlaying,
  playing,
  currentTime,
  duration,
  volume,
  muted,
  playbackRate,
  onSeekTo,
  onSeekBackward,
  onSeekForward,
  onToggleMute,
  onVolumeChange,
  onCycleRate,
  hasQueue,
  onPrevious,
  onNext,
  onTogglePlay,
  onMinimize,
  onClose,
}: NowPlayingBarProps) {
  return (
    <div
      data-testid="now-playing-bar"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-card/95 shadow-2xl backdrop-blur-md"
    >
      <div className="container flex items-center gap-3 px-4 py-3 sm:gap-4">
        <img
          src={nowPlaying.imageUrl}
          alt=""
          className="h-12 w-12 flex-shrink-0 rounded-md object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{nowPlaying.title}</p>
          <p className="truncate text-xs text-muted-foreground">{nowPlaying.subtitle}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, "0")}
            </span>
            <input
              type="range"
              aria-label="Progresso do episódio"
              min={0}
              max={duration || 100}
              step={1}
              value={Math.min(currentTime, duration || 100)}
              onChange={(e) => onSeekTo(Number(e.target.value))}
              className="range-brand h-1 w-full"
            />
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}
            </span>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onSeekBackward}
            aria-label="Voltar 15 segundos"
            title="Voltar 15 segundos"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground sm:h-9 sm:w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {hasQueue && (
            <>
              <button
                type="button"
                onClick={onPrevious}
                aria-label="Episódio anterior"
                className="hidden h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground md:flex"
              >
                <SkipBack className="h-4 w-4 fill-current" />
              </button>
              <button
                type="button"
                onClick={onNext}
                aria-label="Próximo episódio"
                className="hidden h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground md:flex"
              >
                <SkipForward className="h-4 w-4 fill-current" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={playing ? "Pausar podcast" : "Reproduzir podcast"}
            aria-pressed={playing}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg transition-colors hover:bg-accent"
          >
            {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 translate-x-0.5 fill-current" />}
          </button>
          <button
            type="button"
            onClick={onSeekForward}
            aria-label="Avançar 15 segundos"
            title="Avançar 15 segundos"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground sm:h-9 sm:w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? "Ativar som" : "Silenciar"}
            aria-pressed={muted}
            title={muted ? "Ativar som" : "Silenciar"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            {muted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            type="range"
            aria-label="Volume"
            min={0}
            max={100}
            step={1}
            value={Math.round(volume * 100)}
            onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
            className="range-brand hidden h-1 w-16 sm:block"
          />
          <button
            type="button"
            onClick={onCycleRate}
            aria-label="Velocidade de reprodução"
            title="Velocidade de reprodução"
            className="flex h-9 items-center gap-1 rounded-full bg-secondary px-2.5 text-[11px] font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            <Gauge className="h-4 w-4" />
            {playbackRate}×
          </button>
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Minimizar player"
            title="Minimizar player"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar player"
            className="hidden h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface FloatingPlayerProps {
  nowPlaying: NowPlaying;
  playing: boolean;
  onTogglePlay: () => void;
  onExpand: () => void;
  onClose: () => void;
}

/** Card flutuante (canto inferior esquerdo) quando a barra é minimizada. */
export function FloatingPlayer({ nowPlaying, playing, onTogglePlay, onExpand, onClose }: FloatingPlayerProps) {
  return (
    <div
      data-testid="floating-player"
      className="fixed bottom-4 left-4 z-[70] flex w-64 max-w-[calc(100vw-2rem)] items-center gap-3 rounded-lg border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-md"
    >
      <img src={nowPlaying.imageUrl} alt="" className="h-12 w-12 flex-shrink-0 rounded-md object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-foreground">{nowPlaying.title}</p>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-live">
          <span className={cn("h-1.5 w-1.5 rounded-full", playing ? "animate-pulse bg-live" : "bg-border")} />
          {nowPlaying.kind === "podcast" ? "Podcast" : nowPlaying.subtitle}
        </span>
      </div>
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={playing ? "Pausar" : "Reproduzir"}
        aria-pressed={playing}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground transition-colors hover:bg-accent"
      >
        {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 translate-x-0.5 fill-current" />}
      </button>
      <button
        type="button"
        onClick={onExpand}
        aria-label="Expandir player"
        title="Expandir player"
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        title="Fechar"
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface SuggestionsPanelProps {
  podcastTitle: string;
  onPlayPodcast: (podcast: Podcast) => void;
  onPlayVisual: (item: VisualFeedItem) => void;
  onDismiss: () => void;
}

/** Painel de sugestões exibido quando o podcast termina (auto-avanço em 3s). */
export function SuggestionsPanel({ podcastTitle, onPlayPodcast, onPlayVisual, onDismiss }: SuggestionsPanelProps) {
  return (
    <div
      data-testid="suggestions-panel"
      role="dialog"
      aria-label="Sugestões de conteúdo"
      className="fixed inset-x-4 bottom-4 z-[65] mx-auto max-h-[70vh] max-w-lg overflow-y-auto rounded-xl border border-border bg-card/95 p-5 shadow-2xl backdrop-blur-md"
    >
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-border pb-3">
        <div>
          <p className="editorial-kicker">Concluído</p>
          <h3 className="mt-1 font-serif text-lg font-bold text-foreground">Fim do episódio</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">"{podcastTitle}" termina em instantes.</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar sugestões"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-brand">Ouvir mais podcasts</p>
      <ul className="mb-5 space-y-2">
        {podcasts.slice(0, 3).map((podcast) => (
          <li key={podcast.id}>
            <button
              type="button"
              onClick={() => onPlayPodcast(podcast)}
              className="flex w-full items-center gap-3 rounded-md border border-border bg-background p-2 text-left transition-colors hover:border-brand/50"
            >
              <img src={podcast.imageUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-foreground">{podcast.title}</span>
                <span className="block text-[10px] text-muted-foreground">{podcast.category}</span>
              </span>
              <Play className="h-4 w-4 flex-shrink-0 text-brand" />
            </button>
          </li>
        ))}
      </ul>

      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-brand">Assistir vídeos, reels e stories</p>
      <ul className="space-y-2">
        {breakingVisuals.slice(0, 3).map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onPlayVisual(item)}
              className="flex w-full items-center gap-3 rounded-md border border-border bg-background p-2 text-left transition-colors hover:border-brand/50"
            >
              <img src={item.image} alt="" className="h-10 w-10 flex-shrink-0 rounded object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-foreground">{item.title}</span>
                <span className="block text-[10px] text-muted-foreground">{item.category}</span>
              </span>
              <Video className="h-4 w-4 flex-shrink-0 text-brand" />
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-4 flex items-center gap-2 rounded-md bg-secondary/60 px-3 py-2 text-[11px] text-muted-foreground">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" />
        Reproduzindo automaticamente um vídeo de breaking news em instantes...
      </p>
    </div>
  );
}

interface VideoBubbleProps {
  nowPlaying: NowPlaying;
  muted: boolean;
  playbackRate: number;
  audioRef: React.RefObject<HTMLAudioElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  onEnded: () => void;
  onToggleMute: () => void;
  onCycleRate: () => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
  onClose: () => void;
}

/** Mini-player flutuante de vídeo/reel/story (canto inferior direito). */
export function VideoBubble({
  nowPlaying,
  muted,
  playbackRate,
  audioRef,
  videoRef,
  onEnded,
  onToggleMute,
  onCycleRate,
  onSeekBackward,
  onSeekForward,
  onClose,
}: VideoBubbleProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const images = nowPlaying.images && nowPlaying.images.length > 0 ? nowPlaying.images : [nowPlaying.imageUrl];

  // Slideshow das imagens enquanto o áudio toca (itens sem vídeo real).
  useEffect(() => {
    if (nowPlaying.videoUrl) {
      return;
    }
    if (images.length < 2) {
      return;
    }
    const timer = window.setInterval(() => {
      setImageIndex((index) => (index + 1) % images.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [nowPlaying.videoUrl, images.length]);

  return (
    <div
      data-testid="video-bubble"
      className="fixed bottom-4 right-4 z-[70] w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card/95 shadow-2xl backdrop-blur-md"
    >
      <div className="relative aspect-video overflow-hidden bg-black">
        {nowPlaying.videoUrl ? (
          <video
            ref={videoRef}
            src={nowPlaying.videoUrl}
            autoPlay
            controls
            playsInline
            onEnded={onEnded}
            className="h-full w-full object-cover"
          />
        ) : (
          <>
            <img src={images[imageIndex]} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-media-overlay" />
            <audio
              ref={audioRef}
              src={nowPlaying.audioUrl}
              autoPlay
              onEnded={onEnded}
              className="hidden"
            />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-sm bg-background/85 px-2 py-1 text-[10px] font-bold uppercase text-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" />
              {nowPlaying.subtitle}
            </span>
            <span className="absolute bottom-3 left-3 right-3 font-serif text-sm font-bold text-overlay-foreground">
              {nowPlaying.title}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2 p-3">
        <Headphones className="h-4 w-4 flex-shrink-0 text-brand" />
        <p className="min-w-0 flex-1 truncate text-xs font-bold text-foreground">{nowPlaying.title}</p>
        <button
          type="button"
          onClick={onSeekBackward}
          aria-label="Voltar 15 segundos"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onSeekForward}
          aria-label="Avançar 15 segundos"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? "Ativar som" : "Silenciar"}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
        >
          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={onCycleRate}
          aria-label="Velocidade de reprodução"
          className="flex h-7 items-center gap-0.5 rounded-full bg-secondary px-2 text-[10px] font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <Gauge className="h-3 w-3" />
          {playbackRate}×
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar vídeo"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

interface ListenNowButtonProps {
  streamUrl: string;
  onOpen: () => void;
}

export function ListenNowButton({ streamUrl, onOpen }: ListenNowButtonProps) {
  if (!streamUrl) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Configure VITE_RADIO_STREAM_URL no arquivo .env para liberar a transmissão"
        className="inline-flex items-center gap-2 rounded-md bg-secondary px-8 py-4 text-sm font-bold text-secondary-foreground opacity-60 shadow-xl"
      >
        <Play className="h-5 w-5 fill-current" />
        Em breve
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="listen-now"
      className="btn-brand px-8 py-4 text-sm font-bold shadow-xl transition-all duration-200 hover:shadow-2xl"
    >
      <Play className="h-5 w-5 fill-current" />
      Ouvir Agora
    </button>
  );
}