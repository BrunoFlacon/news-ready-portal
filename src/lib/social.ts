/**
 * Web Rádio Vitória — Ferramentas sociais — estado v0 (sem banco de dados).
 *
 * Todas as ações sociais (curtir, comentar, compartilhar, convidar para
 * assinar, salvar) funcionam com persistência local no navegador
 * (localStorage) e registram eventos em uma fila (`social.events`) pronta
 * para sincronização futura com um banco (ex.: Supabase).
 *
 * Chaves de armazenamento (prefixo `social.`):
 *  - `social.liked.{publicationId}`  -> "1" | "0" (usuário curtiu)
 *  - `social.likes.total.{id}`       -> total local de curtidas
 *  - `social.saved.{id}`             -> "1" | "0" (publicação salva)
 *  - `social.comments.{id}`          -> JSON de SocialComment[]
 *  - `social.views.{id}`             -> segundos acumulados de visualização
 *  - `social.events`                 -> fila JSON de SocialEvent[]
 *
 * Para conectar ao banco no futuro: envie o payload de `flushEvents()` para
 * um endpoint/edge function (pedaço por `{ publicationId, action, value,
 * createdAt }`) e chame-o ao autenticar, em intervalos ou no
 * `visibilitychange`/`beforeunload`.
 */
import { useCallback, useEffect, useState } from "react";

const PREFIX = "social.";

/** Nome do evento disparado quando qualquer estado social muda. */
export const SOCIAL_CHANGE_EVENT = "social:change";

/** Avisa os hooks `useSocialItem` que os dados mudaram (mesma página). */
function notifyChange(): void {
  window.dispatchEvent(new Event(SOCIAL_CHANGE_EVENT));
}

export interface SocialComment {
  id: string;
  text: string;
  createdAt: string;
}

export type SocialAction =
  | "like"
  | "unlike"
  | "comment"
  | "share"
  | "invite"
  | "save"
  | "unsave"
  | "view";

export interface SocialEvent {
  publicationId: string;
  action: SocialAction;
  value: string | number;
  createdAt: string;
}

/** Leitura segura do localStorage (quota/privado lançam exceção). */
function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Escrita segura do localStorage (quota/privado lançam exceção). */
function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Sem armazenamento local, o estado segue apenas em memória (visual).
  }
}

/** Empilha um evento social na fila `social.events`. */
function recordEvent(event: Omit<SocialEvent, "createdAt">): void {
  const full: SocialEvent = { ...event, createdAt: new Date().toISOString() };
  const stored = readStored(`${PREFIX}events`);
  let queue: SocialEvent[] = [];
  try {
    queue = stored ? (JSON.parse(stored) as SocialEvent[]) : [];
  } catch {
    queue = [];
  }
  queue.push(full);
  // Mantém a fila enxuta (últimos 500 eventos) até a sincronização.
  writeStored(`${PREFIX}events`, JSON.stringify(queue.slice(-500)));
}

/* -------------------------------------------------------------------------- */
/* Curtidas                                                                    */
/* -------------------------------------------------------------------------- */

export function isLiked(id: string): boolean {
  return readStored(`${PREFIX}liked.${id}`) === "1";
}

export function likesCount(id: string): number {
  const raw = readStored(`${PREFIX}likes.total.${id}`);
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

/**
 * Alterna a curtida do usuário. Registra o evento (`like`/`unlike`) e a
 * métrica local de total de curtidas — valores prontos para o banco futuro.
 */
export function toggleLike(id: string): { liked: boolean; count: number } {
  const liked = !isLiked(id);
  writeStored(`${PREFIX}liked.${id}`, liked ? "1" : "0");
  const count = Math.max(0, likesCount(id) + (liked ? 1 : -1));
  writeStored(`${PREFIX}likes.total.${id}`, String(count));
  recordEvent({ publicationId: id, action: liked ? "like" : "unlike", value: 1 });
  notifyChange();
  return { liked, count };
}

/* -------------------------------------------------------------------------- */
/* Salvar (rail vertical — reels/stories)                                     */
/* -------------------------------------------------------------------------- */

export function isSaved(id: string): boolean {
  return readStored(`${PREFIX}saved.${id}`) === "1";
}

export function toggleSave(id: string): boolean {
  const saved = !isSaved(id);
  writeStored(`${PREFIX}saved.${id}`, saved ? "1" : "0");
  recordEvent({ publicationId: id, action: saved ? "save" : "unsave", value: 1 });
  notifyChange();
  return saved;
}

/* -------------------------------------------------------------------------- */
/* Comentários                                                                */
/* -------------------------------------------------------------------------- */

export function getComments(id: string): SocialComment[] {
  const stored = readStored(`${PREFIX}comments.${id}`);
  if (!stored) {
    return [];
  }
  try {
    const parsed = JSON.parse(stored) as SocialComment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Adiciona um comentário local e registra o evento para o banco futuro. */
export function addComment(id: string, text: string): SocialComment[] {
  const comment: SocialComment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    createdAt: new Date().toISOString(),
  };
  const updated = [...getComments(id), comment];
  writeStored(`${PREFIX}comments.${id}`, JSON.stringify(updated));
  recordEvent({ publicationId: id, action: "comment", value: text });
  notifyChange();
  return updated;
}

/* -------------------------------------------------------------------------- */
/* Tempo de visualização                                                      */
/* -------------------------------------------------------------------------- */

/** Acumula segundos visualizados na publicação (para métricas no banco). */
export function trackView(id: string, seconds: number): number {
  const total = getViewSeconds(id) + Math.max(0, seconds);
  writeStored(`${PREFIX}views.${id}`, String(total));
  recordEvent({ publicationId: id, action: "view", value: Math.max(0, seconds) });
  return total;
}

export function getViewSeconds(id: string): number {
  const raw = readStored(`${PREFIX}views.${id}`);
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/* -------------------------------------------------------------------------- */
/* Compartilhamentos e convites                                               */
/* -------------------------------------------------------------------------- */

/** Registra um compartilhamento da publicação em uma rede/meio específico. */
export function recordShare(id: string, network: string): void {
  recordEvent({ publicationId: id, action: "share", value: network });
}

/** Registra um convite para novos assinantes (a partir da publicação). */
export function recordInvite(id: string, network: string): void {
  recordEvent({ publicationId: id, action: "invite", value: network });
}

/* -------------------------------------------------------------------------- */
/* Sincronização com o banco futuro                                           */
/* -------------------------------------------------------------------------- */

/**
 * Devolve e limpa a fila de eventos acumulada localmente. Pronto para ser
 * enviado em um endpoint (ex.: Supabase edge function) e, em seguida, o
 * retorno garante que só eventos confirmados saem da fila.
 */
export function flushEvents(): SocialEvent[] {
  const stored = readStored(`${PREFIX}events`);
  let queue: SocialEvent[] = [];
  try {
    queue = stored ? (JSON.parse(stored) as SocialEvent[]) : [];
  } catch {
    queue = [];
  }
  if (queue.length > 0) {
    writeStored(`${PREFIX}events`, JSON.stringify([]));
  }
  return queue;
}

/**
 * Hook React que mantém os dados sociais de uma publicação em sincronia com o
 * localStorage. Reage a mudanças feitas por qualquer componente da página
 * (via `social:change`), então a barra, o rail e os diálogos exibem o mesmo
 * estado mesmo quando cada um dispara a própria ação.
 */
export function useSocialItem(id: string) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onSocialChange = () => setTick((value) => value + 1);
    window.addEventListener(SOCIAL_CHANGE_EVENT, onSocialChange);
    return () => window.removeEventListener(SOCIAL_CHANGE_EVENT, onSocialChange);
  }, []);

  void tick;

  return {
    liked: isLiked(id),
    likesCount: likesCount(id),
    saved: isSaved(id),
    comments: getComments(id),
    toggleLike: useCallback(() => toggleLike(id), [id]),
    toggleSave: useCallback(() => toggleSave(id), [id]),
    addComment: useCallback((text: string) => addComment(id, text), [id]),
  };
}