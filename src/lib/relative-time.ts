/**
 * Formatação de data/hora para os metadados dos artigos (pt-BR).
 *
 * O portal usa tempo relativo ("há 20 min", "publicado ontem às 12:45")
 * no rodapé das matérias, seguindo o padrão de grandes redações.
 */

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

const pad = (n: number) => String(n).padStart(2, "0");

/** Horário local HH:mm a partir de uma data. */
export function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Data longa em pt-BR: "26 de março de 2026". */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Quando o conteúdo foi publicado, em formato de tempo relativo:
 *  - "há pouco" / "há 20 min"
 *  - "publicado hoje às 09:15"
 *  - "publicado ontem às 12:45"
 *  - "publicado em 26 de março de 2026 às 09:15"
 */
export function formatPublishedAt(iso: string, now: Date = new Date()): string {
  const published = new Date(iso);
  if (Number.isNaN(published.getTime())) {
    return "publicado em data desconhecida";
  }

  const diff = now.getTime() - published.getTime();
  if (diff < MINUTE) {
    return "há pouco";
  }
  if (diff < HOUR) {
    return `há ${Math.max(1, Math.round(diff / MINUTE))} min`;
  }

  const publishedDay = startOfDay(published).getTime();
  const today = startOfDay(now).getTime();
  const dayDiff = Math.round((today - publishedDay) / DAY);

  if (dayDiff === 0) {
    return `publicado hoje às ${formatTime(published)}`;
  }
  if (dayDiff === 1) {
    return `publicado ontem às ${formatTime(published)}`;
  }
  return `publicado em ${formatLongDate(published)} às ${formatTime(published)}`;
}

/**
 * Quando o conteúdo foi atualizado pela última vez:
 *  - "atualizado às 15:02" (mesmo dia)
 *  - "atualizado em 27 de março de 2026 às 10:40" (outro dia)
 *  - "" para data inválida/ausente
 */
export function formatUpdatedAt(iso: string, now: Date = new Date()): string {
  const updated = new Date(iso);
  if (Number.isNaN(updated.getTime())) {
    return "";
  }
  const updatedDay = startOfDay(updated).getTime();
  const today = startOfDay(now).getTime();
  if (updatedDay === today) {
    return `atualizado às ${formatTime(updated)}`;
  }
  return `atualizado em ${formatLongDate(updated)} às ${formatTime(updated)}`;
}

/** Local de apuração curto: "Vitória, ES" (vazio quando não informado). */
export function formatPlace(city?: string, state?: string): string {
  if (!city && !state) {
    return "";
  }
  if (city && state) {
    return `${city}, ${state}`;
  }
  return city ?? state ?? "";
}