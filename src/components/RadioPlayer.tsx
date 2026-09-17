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
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Heart,
  Link2,
  Maximize2,
  MessageCircle,
  Mic2,
  Minimize2,
  MoreVertical,
  Music,
  Pause,
  Play,
  Radio,
  Share2,
  SkipBack,
  SkipForward,
  UserPlus,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SITE_URL, whatsAppLink } from "@/lib/whatsapp";
import { useSocialItem } from "@/lib/social";
import {
  CommentDialog,
  InlineComments,
  InviteDialog,
  ShareContentDialog,
} from "@/components/SocialDialogs";
import { podcasts, type Podcast } from "@/data/podcasts";
import { breakingVisuals, type VisualFeedItem } from "@/data/media";
import { upcomingLiveFrom, useSchedule } from "@/lib/schedule";

/**
 * URL do stream da rádio ao vivo.
 *
 * Ordem de resolução:
 *  1. VITE_RADIO_STREAM_URL configurada no ambiente (produção/CI);
 *  2. URL padrão da transmissão (usada como fallback para que o botão
 *     "Ouça a Rádio" nunca fique travado, mesmo em previews sem env);
 *  3. string vazia — caso o ambiente defina explicitamente "", o player
 *     permanece no modo "Em breve live".
 */
export function getRadioStreamUrl(): string {
  const configured = import.meta.env.VITE_RADIO_STREAM_URL as string | undefined;
  if (configured === undefined) {
    return "https://shoutcast2.s12.com.br:16002/stream";
  }
  return configured;
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
/** Preferência de volume do conteúdo (podcast/vídeo) persistida no navegador. */
const NOW_PLAYING_VOLUME_KEY = "radio.content.volume";

export interface RadioPlayerApi {
  streamUrl: string;
  liveOpen: boolean;
  livePlaying: boolean;
  /** Ouvintes acompanhando a transmissão ao vivo agora (null = fora do ar).
      Na Onda 5 é dado de demonstração até o backend 5.7 entrar no ar. */
  listeners: number | null;
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
  setPlaybackRate: (rate: number) => void;
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

  // Onda 5 — contagem de demonstração de ouvintes ao vivo (substituída pelo
  // backend `transmission_audience.current_listeners`, seção 5.7 do plano).
  const demoLiveListeners = useMemo(
    () => 142 + Math.floor(Math.random() * 47),
    [],
  );

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
  const [volume, setVolume] = useState<number>(
    () => {
      // Preferência de volume do conteúdo (podcast/vídeo) salva no navegador.
      const raw = window.localStorage.getItem(NOW_PLAYING_VOLUME_KEY);
      if (raw === null || raw === "") return 1;
      const parsed = Number(raw);
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 1;
    },
  );
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);

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
    setMinimized(false);
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
    // Na fila entram apenas episódios gratuitos (prévias); episódios na
    // íntegra são exclusivos da área premium e não fazem parte da playlist.
    const listItems =
      list && list.length > 0 ? list : podcasts.filter((item) => !item.premium);
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
  const changeVolume = useCallback((value: number) => {
    const next = Math.max(0, Math.min(1, value));
    setVolume(next);
    // Volume zero = mudo; qualquer outro valor restaura o som.  Mantém
    // consistência com o player de vídeo (YouTubePlayer.onVolumeInput).
    setMuted(next === 0);
    window.localStorage.setItem(NOW_PLAYING_VOLUME_KEY, String(next));
  }, []);

  // Taxa de reprodução: aceita qualquer um dos passos de PLAYBACK_RATES.
  const setPlaybackRate = useCallback((rate: number) => {
    if (!PLAYBACK_RATES.includes(rate)) {
      return;
    }
    setPlaybackRateState(rate);
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
    // Onda 5 — ouvintes ao vivo: índice de demonstração enquanto a transmissão
    // toca, `null` quando a rádio é desligada (o cabeçalho só renderiza o
    // contador quando `listeners != null`).
    listeners: livePlaying ? demoLiveListeners : null,
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
    setPlaybackRate,
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
  onMinimize: () => void;
}

const LIVE_LIKE_KEY = "radio.liked";
const LIVE_LIKES_METRIC_KEY = "radio.likes.total";

function readStoredLiked(): boolean {
  try {
    return window.localStorage.getItem(LIVE_LIKE_KEY) === "1";
  } catch {
    return false;
  }
}

function readLikesCount(): number {
  try {
    return Math.max(0, Number(window.localStorage.getItem(LIVE_LIKES_METRIC_KEY) || "0"));
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Equalizador da transmissão ao vivo (Web Audio API)
// ---------------------------------------------------------------------------
const EQ_BARS = 18;
const EQ_MAX_HEIGHT = 16;
/** Se o espectro vier zerado por ~1s seguido, o stream está bloqueado por
 *  CORS e o gráfico cai sozinho para o modo sintético (o som nunca muda). */
const ZERO_FRAME_LIMIT = 60;

interface LiveEqualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  playing: boolean;
  /** Quantidade de barras do gráfico. */
  bars?: number;
  testId?: string;
}

/**
 * Equalizador em tempo real do stream da rádio.
 *
 * O sinal é "escutado" com `audio.captureStream()` + AnalyserNode — SEM rotear
 * a saída do <audio> por um AudioContext. O antigo `createMediaElementSource`
 * desviava o som para o gráfico e, sem headers CORS no stream da rádio,
 * entregava espectro zerado e SILENCIAVA o ouvinte. A captura por stream é
 * tratada como mídia independente: o que sai dos alto-falantes nunca passa
 * pelo AudioContext e, portanto, nunca é afetado.
 *
 * Como o stream não envia headers CORS, é comum o espectro chegar zerado
 * (tainting). Detectamos isso e o gráfico alterna sozinho para o modo
 * sintético animado, mantendo as barras vivas sem arriscar o áudio.
 */
export function LiveEqualizer({
  audioRef,
  playing,
  bars = EQ_BARS,
  testId = "live-equalizer",
}: LiveEqualizerProps) {
  const barRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [realTime, setRealTime] = useState(false);

  useEffect(() => {
    const count = bars;
    const elements = barRefs.current;
    const idleHeights = Array.from(
      { length: count },
      (_, i) => 3 + ((i * 5) % 6),
    );
    const setHeights = (heights: number[]) => {
      for (let i = 0; i < count; i++) {
        const el = elements[i];
        if (el) {
          el.style.height = `${Math.max(3, Math.round(heights[i]))}px`;
        }
      }
    };

    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let data: Uint8Array | null = null;
    let raf = 0;
    let disposed = false;
    let zeroFrames = 0;
    let mode: "idle" | "synthetic" | "real" = "idle";
    const smooth = Array.from({ length: count }, () => 3);

    // Modo sintético: barras animadas por rAF — funciona sempre, mesmo sem
    // Web Audio API ou quando o stream é bloqueado por CORS.
    const syntheticTick = (time: number) => {
      if (disposed || mode !== "synthetic") {
        return;
      }
      const phase = time / 1000;
      for (let i = 0; i < count; i++) {
        const swell = Math.sin(phase * (1.6 + (i % 5) * 0.35) + i * 0.9);
        const breath = Math.sin(phase * 0.6 + i * 0.4);
        const target = 4 + (swell + 1) * 2.2 + (breath + 1) * 1.6;
        smooth[i] += (target - smooth[i]) * 0.18;
      }
      setHeights(smooth);
      raf = requestAnimationFrame(syntheticTick);
    };

    // Modo real: leitura do espectro capturado do <audio> sem desviar o som.
    const realTick = () => {
      if (disposed || mode !== "real") {
        return;
      }
      if (analyser && data) {
        analyser.getByteFrequencyData(data);
        let peak = 0;
        for (let i = 0; i < data.length; i++) {
          if (data[i] > peak) {
            peak = data[i];
          }
        }
        if (peak < 4) {
          // Espectro zerado — stream tainted por CORS ou contexto suspenso.
          zeroFrames += 1;
          if (zeroFrames >= ZERO_FRAME_LIMIT) {
            mode = "synthetic";
            setRealTime(false);
            try {
              source?.disconnect();
            } catch {
              // Nó já desconectado; nada a fazer.
            }
            analyser = null;
            data = null;
            raf = requestAnimationFrame(syntheticTick);
            return;
          }
        } else {
          zeroFrames = 0;
        }
        for (let i = 0; i < count; i++) {
          // Bins distribuídos logaritmicamente: graves à esquerda, agudos
          // à direita — leitura fiel do espectro da transmissão.
          const bin = Math.min(
            data.length - 1,
            Math.max(0, Math.round(Math.pow(data.length, (i + 1) / count) - 1)),
          );
          const target = ((data[bin] ?? 0) / 255) * EQ_MAX_HEIGHT;
          smooth[i] += (target - smooth[i]) * 0.45;
        }
        setHeights(smooth);
      }
      raf = requestAnimationFrame(realTick);
    };

    const startReal = () => {
      if (mode === "real" || disposed) {
        return;
      }
      mode = "real";
      setRealTime(true);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(realTick);
    };

    if (!playing) {
      setHeights(idleHeights);
      setRealTime(false);
    } else {
      // Começa pelo modo sintético (movimento garantido); troca para o
      // espectro real assim que o contexto rodar e houver sinal.
      mode = "synthetic";
      setRealTime(false);
      raf = requestAnimationFrame(syntheticTick);

      const audio = audioRef.current;
      // Firefox: captureStream em <audio> silencia a saída do elemento
      // (bug 1581192) — nesse navegador ficamos no modo sintético para
      // garantir que a rádio continue tocando.
      const isFirefox =
        typeof navigator !== "undefined" &&
        /Firefox\//.test(navigator.userAgent);
      const Ctor =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      const capture =
        audio &&
        (audio as HTMLAudioElement & { captureStream?: () => MediaStream })
          .captureStream;

      if (audio && capture && Ctor && !isFirefox) {
        try {
          stream = capture.call(audio) ?? null;
          if (!stream) {
            throw new Error("Nenhum fluxo capturável no <audio>");
          }
          ctx = new Ctor();
          source = ctx.createMediaStreamSource(stream);
          analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          data = new Uint8Array(analyser.frequencyBinCount);
          // SEM conexão com ctx.destination: o áudio do elemento segue
          // saindo normalmente pelos alto-falantes.
          source.connect(analyser);
          void ctx.resume?.().then(() => {
            if (!disposed && ctx && ctx.state === "running") {
              startReal();
            }
          });
        } catch {
          analyser = null;
          source = null;
          data = null;
        }
      }
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      try {
        source?.disconnect();
      } catch {
        // Nó já desconectado; nada a fazer.
      }
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
      if (ctx) {
        void ctx.close();
      }
    };
  }, [audioRef, playing, bars]);

  return (
    <span
      data-testid={testId}
      aria-hidden
      className={cn(
        "hidden h-5 items-end gap-[3px] sm:flex",
        !playing && "opacity-40",
      )}
    >
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            barRefs.current[i] = el;
          }}
          data-testid="equalizer-bar"
          className={cn(
            "w-[3px] rounded-full",
            realTime
              ? "bg-brand"
              : playing
                ? "bg-brand wave-bar"
                : "bg-neutral-700",
          )}
          style={{
            height:
              realTime ? "3px" : `${3 + ((i * 7) % 13)}px`,
            animationDelay:
              playing && !realTime ? `${i * 0.06}s` : undefined,
            animationDuration:
              playing && !realTime ? `${0.7 + ((i * 13) % 9) / 10}s` : undefined,
          }}
        />
      ))}
    </span>
  );
}

/**
 * Barra da transmissão ao vivo — compacta, dark e flutuante no rodapé
 * (estilo Spotify). Mostra o programa no ar, apresentador, horário e
 * cidade/estado, além de curtir (métricas), volume e o menu de três
 * pontos com pedir música, WhatsApp, compartilhar e link para amigos.
 */
export function RadioPlayerBar({
  url,
  open,
  playing,
  error,
  togglePlay,
  closePlayer,
  audioRef,
  onMinimize,
}: RadioPlayerBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [liked, setLiked] = useState(readStoredLiked);
  const [likesCount, setLikesCount] = useState(readLikesCount);
  const [requestOpen, setRequestOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  // Fase C (3.2) — o programa exibido vem da grade editável do painel admin.
  const grade = useSchedule();

  // Aplica o volume do player ao elemento <audio> da transmissão.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.volume = volume;
    audio.muted = muted;
  }, [audioRef, volume, muted]);

  if (!url || !open) {
    return null;
  }

  const program = upcomingLiveFrom(grade) ?? grade[0];

  const openInNewTab = (href: string) => {
    window.open(href, "_blank");
  };

  const toggleLike = () => {
    setLiked((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(LIVE_LIKE_KEY, next ? "1" : "0");
        // Métrica simples: total de curtidas registradas neste navegador.
        const total = Number(window.localStorage.getItem(LIVE_LIKES_METRIC_KEY) || "0");
        const updated = Math.max(0, total + (next ? 1 : -1));
        window.localStorage.setItem(LIVE_LIKES_METRIC_KEY, String(updated));
        setLikesCount(updated);
      } catch {
        // Sem armazenamento local, a curtida segue apenas visual.
      }
      return next;
    });
  };

  const applyVolume = (value: number) => {
    const next = Math.max(0, Math.min(1, value));
    setVolume(next);
    setMuted(next === 0);
  };

  const menuItems = [
    {
      label: "Pedir música",
      icon: Music,
      onClick: () => setRequestOpen(true),
    },
    {
      label: "Enviar mensagem no WhatsApp",
      icon: MessageCircle,
      onClick: () =>
        openInNewTab(
          whatsAppLink("Olá! Quero falar com a Web Rádio Vitória."),
        ),
    },
    {
      label: "Compartilhar nas redes sociais",
      icon: Share2,
      onClick: () => setShareOpen(true),
    },
    {
      label: "Enviar o link da rádio no WhatsApp",
      icon: Link2,
      onClick: () =>
        openInNewTab(
          whatsAppLink(
            `Ouça a Web Rádio Vitória ao vivo: ${window.location.href}`,
          ),
        ),
    },
    {
      label: "Pedir música por áudio",
      icon: Mic2,
      onClick: () =>
        openInNewTab(
          whatsAppLink("Quero pedir uma música por áudio na Web Rádio Vitória."),
        ),
    },
  ];

  return (
    <div
      data-testid="radio-player-bar"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-neutral-950/95 text-white shadow-2xl backdrop-blur-md"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-2.5 sm:gap-4">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pausar transmissão" : "Reproduzir transmissão"}
          aria-pressed={playing}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg transition-colors hover:bg-accent"
        >
          {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 translate-x-0.5 fill-current" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <LiveEqualizer audioRef={audioRef} playing={playing} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">
                {program.title}
              </p>
              <p className="truncate text-[11px] text-neutral-400">
                {program.host} · {program.day} • {program.time} · Tupã, SP
              </p>
            </div>
          </div>
          {error && (
            <p className="mt-0.5 text-xs text-red-400" role="alert">
              Não foi possível iniciar o áudio. Verifique sua conexão e clique em reproduzir novamente.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={toggleLike}
          aria-label={liked ? "Descurtir programa" : "Curtir programa"}
          aria-pressed={liked}
          title={liked ? "Descurtir" : "Curtir"}
          className="flex h-9 min-w-9 flex-shrink-0 items-center justify-center gap-1 rounded-full px-1.5 text-neutral-300 transition-colors hover:text-white"
        >
          <Heart
            className={cn(
              "h-[18px] w-[18px]",
              liked ? "fill-red-500 text-red-500" : "text-neutral-300",
            )}
          />
          <span
            data-testid="likes-count"
            className="text-[11px] font-semibold tabular-nums"
          >
            {likesCount}
          </span>
        </button>

        <div
          data-testid="live-volume"
          className="group/vol relative hidden flex-shrink-0 md:block"
        >
          <button
            type="button"
            onClick={() => setMuted((value) => !value)}
            aria-label={muted || volume === 0 ? "Ativar som" : "Silenciar"}
            aria-pressed={muted || volume === 0}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-300 transition-colors hover:text-white"
          >
            {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          {/* Controle vertical acima do alto-falante — só aparece quando o
              ouvinte vai abaixar/aumentar o volume (hover ou foco). */}
          <div className="invisible absolute bottom-full left-1/2 mb-3 -translate-x-1/2 rounded-lg border border-white/10 bg-neutral-900 p-2 opacity-0 shadow-2xl transition-all duration-200 group-hover/vol:visible group-hover/vol:opacity-100 group-focus-within/vol:visible group-focus-within/vol:opacity-100">
            <input
              type="range"
              aria-label="Volume da rádio"
              min={0}
              max={100}
              step={1}
              value={muted ? 0 : Math.round(volume * 100)}
              onChange={(e) => applyVolume(Number(e.target.value) / 100)}
              className="volume-slider h-24 w-1.5"
            />
          </div>
        </div>

        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setChatOpen((value) => !value)}
            aria-label={chatOpen ? "Recolher comentários" : "Comentar na transmissão"}
            aria-pressed={chatOpen}
            title={chatOpen ? "Recolher comentários" : "Comentar na transmissão"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-300 transition-colors hover:text-white"
          >
            {chatOpen ? <ChevronDown className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
          </button>
          {chatOpen && (
            <InlineComments
              publicationId="radio-live"
              title={upcomingLiveFrom(grade)?.title ?? "Rádio ao vivo"}
              live
              onClose={() => setChatOpen(false)}
              className="absolute bottom-full right-0 z-[70] mb-2 w-80 max-w-[78vw] rounded-lg shadow-2xl"
            />
          )}
        </div>

        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Mais opções"
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-300 transition-colors hover:text-white"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <ul
              data-testid="live-player-menu"
              role="menu"
              aria-label="Opções da rádio"
              className="absolute bottom-full right-0 z-[70] mb-2 w-72 rounded-lg border border-white/10 bg-neutral-900 p-1.5 shadow-2xl"
            >
              {menuItems.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      item.onClick();
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-neutral-100 transition-colors hover:bg-white/10"
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0 text-brand" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={onMinimize}
          aria-label="Minimizar player"
          title="Minimizar player"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:text-white"
        >
          <Minimize2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={closePlayer}
          aria-label="Fechar player"
          title="Fechar player"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Os diálogos são portados para o <body>: a barra usa backdrop-blur, e
          o backdrop-filter cria um containing block que enterraria um modal
          `fixed inset-0` no rodapé do navegador. */}
      {requestOpen &&
        createPortal(
          <RequestMusicDialog onClose={() => setRequestOpen(false)} />,
          document.body,
        )}
      {shareOpen &&
        createPortal(
          <ShareDialog onClose={() => setShareOpen(false)} />,
          document.body,
        )}
    </div>
  );
}

interface LiveMiniCardProps {
  url: string;
  playing: boolean;
  error: boolean;
  togglePlay: () => void;
  expand: () => void;
  closePlayer: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

/**
 * Card compacto fixo no canto inferior esquerdo quando a barra da
 * transmissão ao vivo é minimizada. A reprodução continua: o <audio> do
 * stream vive no provider e nunca é desmontado ao minimizar.
 */
export function LiveMiniCard({
  url,
  playing,
  error,
  togglePlay,
  expand,
  closePlayer,
  audioRef,
}: LiveMiniCardProps) {
  // Fase C (3.2) — a grade editável alimenta o programa exibido no card.
  const grade = useSchedule();

  if (!url) {
    return null;
  }

  const program = upcomingLiveFrom(grade) ?? grade[0];

  return (
    <div
      data-testid="live-mini-card"
      className="fixed bottom-4 left-4 z-[70] flex w-72 max-w-[calc(100vw-2rem)] items-center gap-3 rounded-lg border border-white/10 bg-neutral-950/95 p-3 text-white shadow-2xl backdrop-blur-md"
    >
      <LiveEqualizer
        audioRef={audioRef}
        playing={playing}
        bars={10}
        testId="mini-equalizer"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold">{program.title}</p>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[10px] font-semibold uppercase",
            playing ? "text-live" : "text-neutral-400",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              playing ? "animate-pulse bg-live" : "bg-neutral-600",
            )}
          />
          {error ? "Sem sinal" : playing ? "Ao vivo" : "Pausado"}
        </span>
      </div>
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "Pausar transmissão" : "Reproduzir transmissão"}
        aria-pressed={playing}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground transition-colors hover:bg-accent"
      >
        {playing ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="h-4 w-4 translate-x-0.5 fill-current" />
        )}
      </button>
      <button
        type="button"
        onClick={expand}
        aria-label="Expandir player"
        title="Expandir player"
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={closePlayer}
        aria-label="Fechar player"
        title="Fechar player"
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface RequestMusicDialogProps {
  onClose: () => void;
}

/** Diálogo "Pedir música": o pedido é enviado pelo WhatsApp da rádio. */
export function RequestMusicDialog({ onClose }: RequestMusicDialogProps) {
  const [name, setName] = useState("");
  const [song, setSong] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = [
      "📻 Pedido de música",
      "",
      `Nome: ${name}`,
      `Música: ${song}`,
      `Ouvindo a Web Rádio Vitória em ${window.location.href}`,
    ].join("\n");
    window.open(whatsAppLink(message), "_blank");
    onClose();
  };

  return (
    <div
      data-testid="request-music-dialog"
      role="dialog"
      aria-label="Pedir música"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />
      <div className="relative w-full max-w-sm rounded-xl border border-white/10 bg-neutral-900 p-5 text-white shadow-2xl">
        <button
          type="button"
          aria-label="Fechar diálogo"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="editorial-kicker">Pedido do ouvinte</p>
        <h3 className="mt-1 font-serif text-lg font-bold">Pedir música</h3>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            aria-label="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            required
            className="w-full rounded-md border border-white/10 bg-neutral-800 px-3 py-2 text-sm placeholder:text-neutral-500 focus:border-brand focus:outline-none"
          />
          <input
            aria-label="Música e artista"
            value={song}
            onChange={(e) => setSong(e.target.value)}
            placeholder="Música e artista"
            required
            className="w-full rounded-md border border-white/10 bg-neutral-800 px-3 py-2 text-sm placeholder:text-neutral-500 focus:border-brand focus:outline-none"
          />
          <Button type="submit" className="w-full">
            <Music className="h-4 w-4" /> Enviar pedido
          </Button>
        </form>
      </div>
    </div>
  );
}

interface ShareDialogProps {
  onClose: () => void;
}

/** Diálogo "Compartilhar": links prontos para as redes sociais. */
export function ShareDialog({ onClose }: ShareDialogProps) {
  const pageUrl = window.location.href || SITE_URL;
  const encodedUrl = encodeURIComponent(pageUrl);
  const shareText = encodeURIComponent("Web Rádio Vitória — confira a programação");

  const shareLinks = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${shareText}%20${encodedUrl}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${shareText}`,
    },
    {
      label: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${shareText}`,
    },
  ];

  return (
    <div
      data-testid="share-dialog"
      role="dialog"
      aria-label="Compartilhar nas redes sociais"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />
      <div className="relative w-full max-w-sm rounded-xl border border-white/10 bg-neutral-900 p-5 text-white shadow-2xl">
        <button
          type="button"
          aria-label="Fechar diálogo"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="editorial-kicker">Compartilhar</p>
        <h3 className="mt-1 font-serif text-lg font-bold">Espalhe a Web Rádio Vitória</h3>
        <ul className="mt-4 space-y-2">
          {shareLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-3 rounded-md border border-white/10 bg-neutral-800 px-3 py-2.5 text-sm font-medium transition-colors hover:border-brand/60"
              >
                <Share2 className="h-4 w-4 flex-shrink-0 text-brand" />
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface PlaybackRateMenuProps {
  rate: number;
  onSelect: (rate: number) => void;
}

/**
 * Seletor de velocidade compacto para o player de podcast: mostra apenas a
 * taxa atual ("1×") e abre um menu vertical com PLAYBACK_RATES ao tocar.
 * Usado no NowPlayingBar e no VideoBubble (padrão YouTube Music).
 */
function PlaybackRateMenu({ rate, onSelect }: PlaybackRateMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Velocidade de reprodução"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Velocidade de reprodução"
        className="flex h-8 items-center rounded-full bg-secondary px-2 text-[11px] font-bold text-muted-foreground transition-colors hover:text-foreground sm:h-9"
      >
        {rate}×
      </button>
      {open && (
        <div
          data-testid="playback-rate-menu"
          role="menu"
          aria-label="Velocidade de reprodução"
          className="absolute bottom-full left-0 mb-2 w-28 rounded-lg border border-border bg-card py-1 shadow-2xl"
        >
          {PLAYBACK_RATES.map((step) => (
            <button
              key={step}
              type="button"
              role="menuitemradio"
              aria-checked={rate === step}
              onClick={() => {
                onSelect(step);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <span>{step}x</span>
              {rate === step && <Check className="h-3.5 w-3.5 text-brand" />}
            </button>
          ))}
        </div>
      )}
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
  onSetPlaybackRate: (rate: number) => void;
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
  onSetPlaybackRate,
  hasQueue,
  onPrevious,
  onNext,
  onTogglePlay,
  onMinimize,
  onClose,
}: NowPlayingBarProps) {
  const social = useSocialItem(nowPlaying.id);
  const [socialDialog, setSocialDialog] = useState<"comments" | "share" | "invite" | null>(null);
  // Painel de volume vertical abre apenas quando o visitante clica no alto-falante.
  const [volumeOpen, setVolumeOpen] = useState(false);

  return (
    <div
      data-testid="now-playing-bar"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-card/95 shadow-2xl backdrop-blur-md"
    >
      {/* Grade de três colunas: informações à esquerda, transporte ao centro
          e ações à direita. A timeline vive no rodapé, fora da grade. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 pt-3.5 sm:gap-6 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 justify-self-start">
          <img
            src={nowPlaying.imageUrl}
            alt=""
            className="h-12 w-12 flex-shrink-0 rounded-md object-cover sm:h-14 sm:w-14"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{nowPlaying.title}</p>
            <p className="truncate text-xs text-muted-foreground">{nowPlaying.subtitle}</p>
          </div>
        </div>

        {/* Transporte centralizado no padrão YouTube/Spotify: Anterior → Voltar
            15s → Play/Pause → Avançar 15s → Velocidade → Próximo. */}
        <div
          data-testid="np-transport"
          className="flex items-center gap-1 justify-self-center sm:gap-2"
        >
          {hasQueue && (
            <button
              type="button"
              onClick={onPrevious}
              aria-label="Episódio anterior"
              title="Episódio anterior"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground md:flex"
            >
              <SkipBack className="h-4 w-4 fill-current" />
            </button>
          )}
          <button
            type="button"
            onClick={onSeekBackward}
            aria-label="Voltar 15 segundos"
            title="Voltar 15 segundos"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={playing ? "Pausar podcast" : "Reproduzir podcast"}
            aria-pressed={playing}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg transition-colors hover:bg-accent sm:h-11 sm:w-11"
          >
            {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 translate-x-0.5 fill-current" />}
          </button>
          <button
            type="button"
            onClick={onSeekForward}
            aria-label="Avançar 15 segundos"
            title="Avançar 15 segundos"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          {/* Seletor de velocidade compacto no centro, logo após "Avançar 15s". */}
          <PlaybackRateMenu rate={playbackRate} onSelect={onSetPlaybackRate} />
          {hasQueue && (
            <button
              type="button"
              onClick={onNext}
              aria-label="Próximo episódio"
              title="Próximo episódio"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground md:flex"
            >
              <SkipForward className="h-4 w-4 fill-current" />
            </button>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-1 justify-self-end sm:gap-2">
          {/* Volume vertical: o painel abre ao clicar no alto-falante. */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setVolumeOpen((value) => !value)}
              aria-label={muted || volume === 0 ? "Ativar som" : "Silenciar"}
              aria-pressed={muted || volume === 0}
              aria-expanded={volumeOpen}
              title={muted || volume === 0 ? "Ativar som" : "Silenciar"}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            >
              {muted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            {volumeOpen && (
              <div
                data-testid="podcast-volume-popover"
                className="absolute bottom-full right-0 z-[70] mb-3 rounded-lg border border-border bg-card p-2 shadow-2xl"
              >
                <input
                  type="range"
                  aria-label="Volume do podcast"
                  min={0}
                  max={100}
                  step={1}
                  value={muted ? 0 : Math.round(volume * 100)}
                  onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
                  className="volume-slider h-24 w-1.5"
                />
              </div>
            )}
          </div>

          {/* Ações sociais estilo Spotify: curtir, comentar, compartilhar e
              convidar amigos para assinar — sem banco (localStorage), com
              eventos prontos para a futura sincronização. */}
          <span
            data-testid="podcast-social-actions"
            className="hidden items-center gap-0.5 rounded-full border border-border bg-secondary/40 px-1 py-1 md:flex"
          >
            <button
              type="button"
              onClick={social.toggleLike}
              aria-label={social.liked ? "Descurtir podcast" : "Curtir podcast"}
              aria-pressed={social.liked}
              title={social.liked ? "Descurtir" : "Curtir"}
              className="flex h-8 items-center gap-1 rounded-full px-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  social.liked ? "fill-red-500 text-red-500" : "",
                )}
              />
              <span className="text-[11px] font-semibold tabular-nums">
                {social.likesCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSocialDialog("comments")}
              aria-label="Comentar podcast"
              title="Comentar"
              className="flex h-8 items-center gap-1 rounded-full px-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              {social.comments.length > 0 && (
                <span className="text-[11px] font-semibold tabular-nums">
                  {social.comments.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSocialDialog("share")}
              aria-label="Compartilhar podcast"
              title="Compartilhar"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setSocialDialog("invite")}
              aria-label="Convidar amigos para assinar"
              title="Convidar para assinar"
              className="flex h-8 items-center gap-1 rounded-full px-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <UserPlus className="h-4 w-4" />
              <span className="text-[11px] font-semibold">Convidar</span>
            </button>
          </span>

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

      {/* Timeline no rodapé da barra (não fica presa no meio da tela). */}
      <div className="flex items-center gap-2 border-t border-border/60 px-4 py-2.5 sm:px-6">
        <span className="flex-shrink-0 text-[10px] tabular-nums text-muted-foreground">
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
          className="range-brand h-1.5 w-full"
        />
        <span className="flex-shrink-0 text-[10px] tabular-nums text-muted-foreground">
          {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}
        </span>
      </div>

      {/* Diálogos sociais do episódio (portados ao <body> pelo próprio
          componente — a barra com backdrop-blur enterraria um fixed). */}
      {socialDialog === "comments" && (
        <CommentDialog
          publicationId={nowPlaying.id}
          title={nowPlaying.title}
          onClose={() => setSocialDialog(null)}
        />
      )}
      {socialDialog === "share" && (
        <ShareContentDialog
          publicationId={nowPlaying.id}
          title={nowPlaying.title}
          message={`Ouça na Vitória News: ${nowPlaying.title}`}
          onClose={() => setSocialDialog(null)}
        />
      )}
      {socialDialog === "invite" && (
        <InviteDialog
          publicationId={nowPlaying.id}
          title={nowPlaying.title}
          onClose={() => setSocialDialog(null)}
        />
      )}
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
        {podcasts
          .filter((item) => !item.premium)
          .slice(0, 3)
          .map((podcast) => (
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
  onSetPlaybackRate: (rate: number) => void;
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
  onSetPlaybackRate,
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
        <PlaybackRateMenu rate={playbackRate} onSelect={onSetPlaybackRate} />
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