/**
 * Onda 6, Fase D (4.1/4.2) — alertas sonoros discretos (sino de estreia) e de
 * emergencia (breaking). Usa o construtor global `Audio` (jsdom espiona) e
 * respeita mute/volume globais + a opcao "sem som" do editor.
 */
export type AlertSoundKind = "discreet" | "breaking";

interface AlertSoundOptions {
  kind: AlertSoundKind;
  volume?: number;
  muted?: boolean;
}

/** Cache de toques por horizonte (evita repetir o mesmo alerta). */
const SOUNDS_DIR = new Map<string, number>();
const WINDOW_MS = 3600_000; // 1h de janela anti-repeticao por alerta.

/** URLs de som — o editor alterna entre sirene e beep discreto. */
const SOUND_URLS: Record<AlertSoundKind, string> = {
  discreet:
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  breaking:
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
};

/**
 * Toca o som de alerta UMA vez dentro da janela, respeitando mute e volume.
 * Retorna `true` se tocou; `false` se foi silenciado/pulado.
 */
export function playAlertSound(options: AlertSoundOptions): boolean {
  const kind = options.kind;
  const muted = options.muted === true;
  if (muted) {
    return false;
  }
  const now = Date.now();
  const last = SOUNDS_DIR.get(kind);
  if (last !== undefined && now - last < WINDOW_MS) {
    return false; // ja tocou nesta janela — nao repete.
  }
  const volume =
    typeof options.volume === "number"
      ? Math.min(1, Math.max(0, options.volume))
      : 1;
  try {
    const audio = new Audio(SOUND_URLS[kind]);
    audio.volume = volume;
    void audio.play();
    SOUNDS_DIR.set(kind, now);
    return true;
  } catch {
    return false; // silencioso: Audio indisponivel (jsdom/SSR).
  }
}

/** Zera o cache de toques (testes e restauracao do seed). */
export function __resetAudioAlertCache(): void {
  SOUNDS_DIR.clear();
}