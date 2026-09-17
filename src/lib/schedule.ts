/**
 * Web Rádio Vitória — grade de programação editável (Onda 6, item 3.2).
 *
 * v0 persiste a grade no localStorage (`radio.schedule`) com o seed de
 * `src/data/media.ts` como padrão. Todas as operações avisam os hooks
 * (`useSchedule`) via evento `schedule:change`, então o painel admin reflete
 * imediatamente na Home, no card "A seguir" e na barra do player.
 *
 * Para o banco futuro (PLANO-BANCO-DADOS-BACKEND.md): mapear 1:1 para a tabela
 * `schedule` (id, kind, title, host, day, time, startsAt, premium).
 */
import { useEffect, useState } from "react";
import { schedule as seedSchedule, type ScheduleEntry } from "@/data/media";

export const SCHEDULE_CHANGE_EVENT = "schedule:change";
export const SCHEDULE_STORAGE_KEY = "radio.schedule";

/** Cópia cacheada: uma referência estável por mudança (evita loops em hooks). */
let cache: ScheduleEntry[] | null = null;

function cloneSeed(): ScheduleEntry[] {
  return seedSchedule.map((entry) => ({ ...entry }));
}

/** Leitura segura do localStorage (quota/privado lançam exceção). */
function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Sem armazenamento local a grade segue apenas em memória (visual).
  }
}

function notifyChange(): void {
  window.dispatchEvent(new Event(SCHEDULE_CHANGE_EVENT));
}

/** Grade efetiva: localStorage quando o editor já salvou, senão o seed. */
export function getSchedule(): ScheduleEntry[] {
  if (cache) {
    return cache;
  }
  const raw = readStored(SCHEDULE_STORAGE_KEY);
  if (!raw) {
    cache = cloneSeed();
    return cache;
  }
  try {
    const parsed = JSON.parse(raw) as ScheduleEntry[];
    cache = Array.isArray(parsed) && parsed.length > 0 ? parsed : cloneSeed();
  } catch {
    cache = cloneSeed();
  }
  return cache;
}

function saveSchedule(entries: ScheduleEntry[]): ScheduleEntry[] {
  cache = entries;
  writeStored(SCHEDULE_STORAGE_KEY, JSON.stringify(entries));
  notifyChange();
  return cache;
}

function makeId(): string {
  return `sch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Cria um programa/estreia no topo da grade (aparece imediatamente). */
export function createScheduleEntry(
  input: Omit<ScheduleEntry, "id"> & { id?: string },
): ScheduleEntry {
  const entry: ScheduleEntry = { ...input, id: input.id ?? makeId() };
  saveSchedule([entry, ...getSchedule()]);
  return entry;
}

export function updateScheduleEntry(
  id: string,
  patch: Partial<Omit<ScheduleEntry, "id">>,
): ScheduleEntry[] {
  return saveSchedule(
    getSchedule().map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
  );
}

export function removeScheduleEntry(id: string): ScheduleEntry[] {
  return saveSchedule(getSchedule().filter((entry) => entry.id !== id));
}

/** Move um programa para cima/baixo na grade (setas do painel). */
export function moveScheduleEntry(
  id: string,
  direction: "up" | "down",
): ScheduleEntry[] {
  const entries = [...getSchedule()];
  const index = entries.findIndex((entry) => entry.id === id);
  if (index < 0) {
    return entries;
  }
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= entries.length) {
    return entries;
  }
  const [moved] = entries.splice(index, 1);
  entries.splice(target, 0, moved);
  return saveSchedule(entries);
}

/** Restaura o seed original (útil para testes e para o botão "Restaurar"). */
export function resetSchedule(): ScheduleEntry[] {
  try {
    window.localStorage.removeItem(SCHEDULE_STORAGE_KEY);
  } catch {
    // Ignora ambientes sem armazenamento.
  }
  cache = null;
  const entries = getSchedule();
  notifyChange();
  return entries;
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === SCHEDULE_STORAGE_KEY) {
      cache = null;
      onChange();
    }
  };
  window.addEventListener(SCHEDULE_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SCHEDULE_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Hook reativo: a grade em edição pelo painel admin. */
export function useSchedule(): ScheduleEntry[] {
  const [entries, setEntries] = useState<ScheduleEntry[]>(getSchedule);
  useEffect(() => {
    const onChange = () => setEntries(getSchedule());
    return subscribe(onChange);
  }, []);
  return entries;
}

/** Próxima live não-premium dentro da grade informada (pode não existir). */
export function upcomingLiveFrom(
  entries: ScheduleEntry[],
): ScheduleEntry | null {
  return entries.find((entry) => entry.kind === "live" && !entry.premium) ?? null;
}

/** Hook reativo: a próxima live não-premium da grade (barra do player). */
export function useUpcomingLive(): ScheduleEntry | null {
  return upcomingLiveFrom(useSchedule());
}

/** Zera o cache em memória (testes e restauração do seed). */
export const __resetScheduleCache = (): void => {
  cache = null;
};