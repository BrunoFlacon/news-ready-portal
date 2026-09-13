/**
 * Web Rádio Vitória — Player de áudio ao vivo
 *
 * - A URL do stream vem de `VITE_RADIO_STREAM_URL` (arquivo .env).
 * - Sem URL configurada, o botão "Ouvir Agora" exibe o estado "Em breve"
 *   e a barra do player nunca é renderizada (fallback seguro).
 * - A barra (fixa no rodapé) é aberta a partir do clique no hero,
 *   respeitando a política de reprodução por gesto do usuário.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Radio, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function getRadioStreamUrl(): string {
  return (import.meta.env.VITE_RADIO_STREAM_URL as string | undefined) || "";
}

export interface RadioPlayerApi {
  streamUrl: string;
  open: boolean;
  playing: boolean;
  error: boolean;
  openPlayer: () => void;
  closePlayer: () => void;
  togglePlay: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

export function useRadioPlayer(): RadioPlayerApi {
  const streamUrl = getRadioStreamUrl();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);

  const openPlayer = useCallback(() => {
    if (!streamUrl) {
      return;
    }
    setOpen(true);
    setError(false);
  }, [streamUrl]);

  const closePlayer = useCallback(() => {
    audioRef.current?.pause();
    setOpen(false);
    setPlaying(false);
    setError(false);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (playing) {
      audio.pause();
    } else {
      setError(false);
      audio.play().catch(() => {
        setError(true);
        setPlaying(false);
      });
    }
  }, [playing]);

  // Liga os eventos do <audio> e tenta iniciar a reprodução assim que a
  // barra é aberta (o clique do usuário conta como gesto válido).
  useEffect(() => {
    if (!open) {
      return;
    }
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const onPlay = () => {
      setPlaying(true);
      setError(false);
    };
    const onPause = () => setPlaying(false);
    const onError = () => {
      setError(true);
      setPlaying(false);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    audio.play().catch(() => {
      setError(true);
      setPlaying(false);
    });

    return () => {
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, [open]);

  return {
    streamUrl,
    open,
    playing,
    error,
    openPlayer,
    closePlayer,
    togglePlay,
    audioRef,
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
      {/* Barra superior pulsante */}
      <div className="h-0.5 animate-pulse bg-gradient-to-r from-transparent via-brand to-transparent" />

      <div className="container mx-auto flex items-center gap-4 px-4 py-3">
        <audio ref={audioRef} src={url} preload="none" />

        {/* Botão play/pause */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pausar transmissão" : "Reproduzir transmissão"}
          aria-pressed={playing}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg transition-colors hover:bg-accent"
        >
          {playing ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 translate-x-0.5 fill-current" />
          )}
        </button>

        {/* Identificação */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 flex-shrink-0 text-brand" />
            <span className="truncate text-sm font-bold text-foreground">
              Web Rádio Vitória
            </span>
            <span className="hidden items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:inline-flex">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  playing ? "animate-pulse bg-live" : "bg-border",
                )}
              />
              Ao Vivo
            </span>
          </div>

          {/* Visualizer */}
          <div className="mt-1 flex h-5 items-end gap-0.5" aria-hidden>
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all duration-300",
                  playing ? "bg-brand wave-bar" : "bg-border",
                )}
                style={{
                  height: playing ? `${8 + ((i * 7) % 18)}px` : "4px",
                  animationDelay: playing ? `${i * 0.06}s` : undefined,
                  animationDuration: playing
                    ? `${0.7 + ((i * 13) % 9) / 10}s`
                    : undefined,
                }}
              />
            ))}
          </div>

          {error && (
            <p className="mt-0.5 text-xs text-destructive" role="alert">
              Não foi possível iniciar o áudio. Verifique sua conexão e clique
              em reproduzir novamente.
            </p>
          )}
        </div>

        {/* Fechar */}
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