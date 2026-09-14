/**
 * Testes das ferramentas sociais — estado v0 sem banco de dados.
 *
 * Valida o comportamento do módulo de baixo nível (`src/lib/social.ts`):
 * curtidas, salvos, comentários, tempo de visualização, compartilhamentos,
 * convites e a fila de eventos pronta para sincronização com o banco.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addComment,
  flushEvents,
  getComments,
  getViewSeconds,
  isLiked,
  isSaved,
  likesCount,
  recordInvite,
  recordShare,
  toggleLike,
  toggleSave,
  trackView,
} from "@/lib/social";

describe("social — curtidas (estado local)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("começa sem curtidas e alterna o estado do usuário", () => {
    expect(isLiked("video-1")).toBe(false);
    expect(likesCount("video-1")).toBe(0);

    const first = toggleLike("video-1");
    expect(first.liked).toBe(true);
    expect(first.count).toBe(1);
    expect(isLiked("video-1")).toBe(true);
    expect(likesCount("video-1")).toBe(1);

    const second = toggleLike("video-1");
    expect(second.liked).toBe(false);
    expect(second.count).toBe(0);
    expect(isLiked("video-1")).toBe(false);
  });

  it("persiste entre sessões (mesmo navegador)", () => {
    toggleLike("reel-1");
    expect(isLiked("reel-1")).toBe(true);
  });
});

describe("social — salvar (rail vertical)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("alterna o estado de salvo por publicação", () => {
    expect(isSaved("reel-2")).toBe(false);
    expect(toggleSave("reel-2")).toBe(true);
    expect(isSaved("reel-2")).toBe(true);
    expect(toggleSave("reel-2")).toBe(false);
    expect(isSaved("reel-2")).toBe(false);
  });
});

describe("social — comentários", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("adiciona comentários e os devolve em ordem", () => {
    expect(getComments("video-2")).toEqual([]);
    addComment("video-2", "Excelente matéria!");
    addComment("video-2", "Compartilhando com a família");
    const comments = getComments("video-2");
    expect(comments).toHaveLength(2);
    expect(comments[0].text).toBe("Excelente matéria!");
    expect(comments[1].text).toBe("Compartilhando com a família");
  });
});

describe("social — tempo de visualização", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("acumula os segundos visualizados por publicação", () => {
    expect(getViewSeconds("live-now-1")).toBe(0);
    trackView("live-now-1", 5);
    trackView("live-now-1", 10);
    expect(getViewSeconds("live-now-1")).toBe(15);
  });
});

describe("social — fila de eventos para o banco futuro", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("registra curtida, comentário, compartilhamento, convite e visualização", () => {
    toggleLike("video-3");
    addComment("video-3", "Adorei o conteúdo");
    recordShare("video-3", "whatsapp");
    recordInvite("video-3", "telegram");
    trackView("video-3", 30);

    const events = flushEvents();
    const actions = events.map((event) => event.action);
    expect(actions).toContain("like");
    expect(actions).toContain("comment");
    expect(actions).toContain("share");
    expect(actions).toContain("invite");
    expect(actions).toContain("view");

    // Todos os eventos carregam a publicação de origem e o momento.
    for (const event of events) {
      expect(event.publicationId).toBe("video-3");
      expect(Number.isNaN(Date.parse(event.createdAt))).toBe(false);
    }
  });

  it("flushEvents() limpa a fila após devolver os eventos", () => {
    recordShare("video-3", "whatsapp");
    expect(flushEvents()).toHaveLength(1);
    expect(flushEvents()).toHaveLength(0);
  });
});