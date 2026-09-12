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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      className="fixed bottom-0 inset-x-0 z-[60] border-t border-[#c9a227]/40 bg-[#060f1e]/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(0,0,0,0.45)]"
    >
      {/* Barra superior pulsante */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[#c9a227] to-transparent animate-pulse" />

      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        <audio ref={audioRef} src={url} preload="none" />

        {/* Botão play/pause */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pausar transmissão" : "Reproduzir transmissão"}
          aria-pressed={playing}
          className="flex-shrink-0 w-11 h-11 rounded-full bg-[#c9a227] hover:bg-[#f0c040] text-[#0b1e3d] flex items-center justify-center transition-colors shadow-lg"
        >
          {playing ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Identificação */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#c9a227] flex-shrink-0" />
            <span
              className="text-white font-bold text-sm truncate"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Web Rádio Vitória
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/60">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  playing ? "bg-red-500 animate-pulse" : "bg-white/30",
                )}
              />
              Ao Vivo
            </span>
          </div>

          {/* Visualizer */}
          <div className="flex items-end gap-0.5 h-5 mt-1" aria-hidden>
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all duration-300",
                  playing
                    ? "bg-[#c9a227] wave-bar"
                    : "bg-white/15",
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
            <p className="text-red-400 text-xs mt-0.5" role="alert">
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
          className="flex-shrink-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
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
        className="flex items-center gap-2 bg-[#c9a227] text-[#0b1e3d] font-bold px-8 py-4 rounded-full opacity-60 cursor-not-allowed shadow-xl"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        <Play className="w-5 h-5" />
        Em breve
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="listen-now"
      className="flex items-center gap-2 bg-[#c9a227] hover:bg-[#f0c040] text-[#0b1e3d] font-bold px-8 py-4 rounded-full transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
      style={{ fontFamily: "'Lato', sans-serif" }}
    >
      <Play className="w-5 h-5 fill-current" />
      Ouvir Agora
    </button>
  );
}