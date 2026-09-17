/*
 * Onda 6 (plano propagandas/grade/alertas, item 2.1/4.1) — lembretes de
 * estreia/programa e fila de alertas in-app. v0 persiste tudo em localStorage
 * (mesmo padrao dos comentarios/curtidas); o disparo com som chega na fase D
 * (4.1/4.2). ASCII puro por padrao do repo.
 */

export const WEEK_ALERTS_KEY = "radio.weekAlerts";

export interface WeekAlert {
  id: string;
  title: string;
  when: string;
  /** Timestamp de inicio (ms) — quando presente, alimenta o motor 4.1. */
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