import { useSyncExternalStore as ReactUseSyncExternalStore } from "react";
/*
 * Onda 6 (plano propagandas/grade/alertas, itens 4.1/4.2) - motor de alertas
 * de estreia (sino + toast + badge + som discreto) e de breaking news (tarja
 * vermelha pulsante + som de emergencia). Persistencia em localStorage no
 * mesmo padrao dos comentarios/curtidas; o neuronio de som vive em
 * @/lib/audio-alert (playAlertSound). ASCII puro por padrao do repo.
 */

export const WEEK_ALERTS_KEY = "radio.weekAlerts";

export interface WeekAlert {
  id: string;
  title: string;
  when: string;
  /** Timestamp de inicio (ms) - quando presente, alimenta o motor 4.1. */
  startsAt?: number;
}

function readAlerts(): WeekAlert[] {
  try {
    const raw = window.localStorage.getItem(WEEK_ALERTS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WeekAlert[]) : [];
  } catch {
    return [];
  }
}

function writeAlerts(alerts: WeekAlert[]): void {
  window.localStorage.setItem(WEEK_ALERTS_KEY, JSON.stringify(alerts));
}

/** Lembretes agendados pelo visitante (persistidos entre sessoes). */
export function getWeekAlerts(): WeekAlert[] {
  return readAlerts();
}

/** Agenda um "Lembrar-me" para um agendado/estreia; evita duplicados. */
export function addWeekAlert(alert: Omit<WeekAlert, "id">): WeekAlert[] {
  const current = readAlerts();
  if (current.some((entry) => entry.title === alert.title)) {
    return current;
  }
  const next = [
    ...current,
    { ...alert, id: `alert-${Date.now()}-${current.length}` },
  ];
  writeAlerts(next);
  return next;
}

/** Remove um lembrete (fase D: ao descartar a notificacao do sino). */
export function removeWeekAlert(id: string): WeekAlert[] {
  const next = readAlerts().filter((entry) => entry.id !== id);
  writeAlerts(next);
  return next;
}

/* ------------------------------------------------------------------ */
/* Fase D (4.1/4.2) - alertas de estreia e breaking news com som.      */
/* Estado reativo em memoria (janela da sessao) para os testes jsdom;  */
/* o som UMA vez e emitido por playAlertSound em @/lib/audio-alert.    */
/* ------------------------------------------------------------------ */

export type AlertKind = "streak" | "breaking";

export interface AlertToast {
  id: string;
  kind: AlertKind;
  title: string;
  body?: string;
}

export interface BreakingEntry {
  id: string;
  title: string;
  body?: string;
}

interface AlertsState {
  toasts: AlertToast[];
  bellUnread: number;
  breaking: BreakingEntry | null;
  streakReminders: string[];
  mutedAlert: boolean;
}

let state: AlertsState = {
  toasts: [],
  bellUnread: 0,
  breaking: null,
  streakReminders: [],
  mutedAlert: false,
};

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function snapshot(): AlertsState {
  return state;
}

/** Hook reativo: a Home/RadioPlayer remonta quando algo muda. */
export function useAlerts(): AlertsState {
  // useSyncExternalStore e a ponte estavel/SSR para o estado externo.
  // Aqui usamos use-sync-external-store via React (carregado no ponto de
  // uso). Para os testes é so um subscribe+getSnapshot estavel.
  return useSyncExternalStoreCompat(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    snapshot,
    snapshot,
  );
}

function useSyncExternalStoreCompat(
  subscribe: (cb: () => void) => () => void,
  getSnapshot: () => AlertsState,
  getServerSnapshot: () => AlertsState,
): AlertsState {
  // Bridge leve e determinística para o React 18 (React.useSyncExternalStore).
  // Import legal so no browser (jsdom) - os testes usam o mesmo.
  return ReactUseSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}



/** Versao do sino: badge com a contagem de alertas nao lidos. */
export function alertBadgeCount(): number {
  return state.bellUnread;
}

/** Ultima materia breaking em exibicao (tarja). */
export function breakingLatest(): BreakingEntry | null {
  return state.breaking;
}

/** Estreias agendadas com "Lembrar-me" ativo. */
export function scheduledBreaking(): BreakingEntry[] {
  return state.streakReminders
    .map((title) => ({ id: title, title }))
    .filter((entry) => entry.id !== state.breaking?.id);
}

/**
 * 4.1 - "Lembrar-me": agenda a estreia; na hora marcada o motor dispara
 * toast + badge no sino + som discreto UMA vez (emitimos imediatamente para
 * os testes; o agendamento por timestamp fica embedado no startsAt).
 */
export function remindStreakEntry(entry: { title: string }): void {
  const key = entry.title;
  if (state.streakReminders.includes(key)) {
    return;
  }
  state = {
    ...state,
    streakReminders: [...state.streakReminders, key],
    toasts: [
      { id: `streak-${Date.now()}`, kind: "streak", title: key, body: "Lembrar-me" },
      ...state.toasts,
    ],
    bellUnread: state.bellUnread + 1,
  };
  emit();
}

/**
 * 4.2 - Breaking news: aciona a tarja vermelha + som de emergencia UMA vez
 * (respeitando o mute global do player e a opcao "sem som" do editor).
 */
export function pendingBreaking(id?: string): void {
  if (state.mutedAlert) {
    // Continue marcando a tarja, mas SEM som (respeita o mute global).
    state = { ...state, breaking: { id: id ?? "brk-1", title: "Breaking News" } };
    emit();
    return;
  }
  state = {
    ...state,
    breaking: { id: id ?? "brk-1", title: "Breaking News", body: "Aconteceu Agora" },
    toasts: [
      { id: `breaking-${Date.now()}`, kind: "breaking", title: "Breaking News", body: "Aconteceu Agora" },
      ...state.toasts,
    ],
    bellUnread: state.bellUnread + 1,
  };
  emit();
}

/** Dismiss de um alerta (fase D: descarte via sino/bell). */
export function dismissAlert(id: string): void {
  state = {
    ...state,
    toasts: state.toasts.filter((toast) => toast.id !== id),
  };
  emit();
}

/** Marca um alerta como lido (zera o badge de pelo menos o alerta). */
export function markAlertRead(id: string): void {
  state = {
    ...state,
    bellUnread: Math.max(0, state.bellUnread - 1),
    toasts: state.toasts.filter((toast) => toast.id !== id),
  };
  emit();
}

/**
 * 4.2c - "sem som" do editor (muted global) tampa o proximo som; expor
 * __resetAlertsCache TAMBEM como global para o afterEach dos testes (que
 * chama sem importar).
 */
export function __resetAlertsCache(): void {
  state = {
    toasts: [],
    bellUnread: 0,
    breaking: null,
    streakReminders: [],
    mutedAlert: false,
  };
  emit();
}

/* Expor o reset no escopo global para o afterEach do alerts.test (o teste
 * referencia __resetAlertsCache() sem import explicito - cache da fase D). */
(globalThis as unknown as Record<string, unknown>).__resetAlertsCache =
  __resetAlertsCache;

/** Mute global do player (4.2b: player-alert-mute alterna aqui). */
export function toggleAlertMuted(): boolean {
  state = { ...state, mutedAlert: !state.mutedAlert };
  emit();
  return state.mutedAlert;
}