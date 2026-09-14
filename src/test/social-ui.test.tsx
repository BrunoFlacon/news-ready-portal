/**
 * Testes das ferramentas sociais na UI:
 *  - barra horizontal no player do banner (lives/vídeos/imagens horizontais);
 *  - rail vertical (reels/stories/imagens verticais);
 *  - ações sociais estilo Spotify na barra de podcast.
 *
 * O estado é local (localStorage) e o `flushEvents()` devolve a fila pronta
 * para o banco — ambos cobertos por `social.test.ts`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "@/pages/Home";
import { renderWithProviders } from "@/test/utils";
import { watchFeed } from "@/data/media";
import { podcasts } from "@/data/podcasts";
import { flushEvents } from "@/lib/social";

// jsdom não implementa reprodução de mídia; o mock evita exceções.
const mockMedia = () => {
  window.HTMLMediaElement.prototype.play = vi
    .fn()
    .mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
};

const videoItem = watchFeed.find((item) => item.kind === "video" && item.orientation === "horizontal");
const reelItem = watchFeed.find((item) => item.kind === "reel" && item.orientation === "vertical");

/** Abre um reels/story pelo rail de entretenimento (padrão dos testes da Home). */
const openReel = (title: string) => {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`Assistir ${title}`) }));
};

// Todos os testes abrem mídia (vídeo/reel/podcast) no player do banner.
beforeEach(() => {
  window.localStorage.clear();
  mockMedia();
});

describe("Ferramentas sociais — barra horizontal (YouTube fullscreen)", () => {
  it("exibe a barra social ao tocar um vídeo horizontal", async () => {
    renderWithProviders(<Home />);
    const video = videoItem ?? watchFeed[0];
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`Reproduzir ${video.title}`) }));
    await waitFor(() => {
      expect(screen.getByTestId("watch-overlay")).toBeInTheDocument();
    });
    expect(screen.getByTestId("social-bar")).toBeInTheDocument();
    // As barras sociais ficam sempre visíveis (não somem com o auto-hide dos
    // controles estilo YouTube após 10s de inatividade).
    expect(screen.getByTestId("social-bar").className).not.toContain("pointer-events-none");
    expect(screen.getByRole("button", { name: "Curtir publicação" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Comentar publicação" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compartilhar publicação" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Convidar amigos para assinar" })).toBeInTheDocument();
  });

  it("curtir na barra alterna o estado e persiste (localStorage)", async () => {
    renderWithProviders(<Home />);
    const video = videoItem ?? watchFeed[0];
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`Reproduzir ${video.title}`) }));
    await waitFor(() => {
      expect(screen.getByTestId("watch-overlay")).toBeInTheDocument();
    });

    // Clica em curtir → a barra some (hideSocialBar) e a curtida persiste no localStorage.
    fireEvent.click(screen.getByRole("button", { name: "Curtir publicação" }));
    // A barra social some porque o usuário já curtiu.
    await waitFor(() => {
      expect(screen.queryByTestId("social-bar")).not.toBeInTheDocument();
    });
    // Estado persistido no localStorage.
    expect(window.localStorage.getItem(`social.liked.${video.id}`)).toBe("1");
    expect(window.localStorage.getItem(`social.likes.total.${video.id}`)).toBe("1");
  });
});

describe("Ferramentas sociais — rail vertical (Instagram)", () => {
  it("troca para o rail vertical ao exibir um reel e oferece salvar", async () => {
    renderWithProviders(<Home />);
    const reel = reelItem ?? watchFeed.find((item) => item.orientation === "vertical")!;
    openReel(reel.title);
    await waitFor(() => {
      expect(screen.getByTestId("watch-overlay")).toBeInTheDocument();
    });
    expect(screen.getByTestId("social-rail")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar publicação" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Convidar amigos para assinar" })).toBeInTheDocument();
  });

  it("salvar marca o bookmark como ativo", async () => {
    renderWithProviders(<Home />);
    const reel = reelItem ?? watchFeed.find((item) => item.orientation === "vertical")!;
    openReel(reel.title);
    await waitFor(() => {
      expect(screen.getByTestId("watch-overlay")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Salvar publicação" }));
    expect(screen.getByRole("button", { name: "Remover dos salvos" })).toBeInTheDocument();
  });
});

describe("Ferramentas sociais — conversas e convites", () => {
  it("abre o diálogo de comentários e publica um comentário", async () => {
    renderWithProviders(<Home />);
    const video = videoItem ?? watchFeed[0];
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`Reproduzir ${video.title}`) }));
    await waitFor(() => {
      expect(screen.getByTestId("watch-overlay")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Comentar publicação" }));
    await waitFor(() => {
      expect(screen.getByTestId("comment-dialog")).toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByRole("textbox", { name: "Escreva um comentário" }),
      { target: { value: "Que conteúdo incrível!" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Publicar comentário" }));
    // O diálogo permanece aberto mesmo depois que a barra some (hidden).
    // Aguarda a re-renderização assíncrona do hook useSocialItem.
    await waitFor(() => {
      expect(screen.getByText("Que conteúdo incrível!")).toBeInTheDocument();
    });
  });

  it("abre o diálogo de convite; cada convite vira evento na fila", async () => {
    renderWithProviders(<Home />);
    const video = videoItem ?? watchFeed[0];
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`Reproduzir ${video.title}`) }));
    await waitFor(() => {
      expect(screen.getByTestId("watch-overlay")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Convidar amigos para assinar" }));
    await waitFor(() => {
      expect(screen.getByTestId("invite-dialog")).toBeInTheDocument();
    });

    const whatsappInvite = screen.getByRole("link", { name: /Convidar via WhatsApp/i });
    fireEvent.click(whatsappInvite);

    const events = flushEvents();
    const invites = events.filter((event) => event.action === "invite");
    expect(invites.length).toBe(1);
    expect(invites[0].publicationId).toBe(video.id);
    expect(invites[0].value).toBe("whatsapp");
  });
});

describe("Ferramentas sociais — barra de podcast (estilo Spotify)", () => {
  it("exibe curtir/comentar/compartilhar/convidar na barra de podcast", async () => {
    renderWithProviders(<Home />);
    const free = podcasts.find((item) => !item.premium);
    if (!free) {
      throw new Error("Nenhum podcast gratuito para os testes");
    }
    // O card "Ouvir" do primeiro podcast gratuito fica na seção de programação.
    const cards = screen.getAllByRole("button", { name: /Reproduzir podcast/i });
    expect(cards.length).toBeGreaterThan(0);
    fireEvent.click(cards[0]);

    await waitFor(() => {
      expect(screen.getByTestId("now-playing-bar")).toBeInTheDocument();
    });
    expect(screen.getByTestId("podcast-social-actions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Curtir podcast" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Comentar podcast" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compartilhar podcast" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Convidar amigos para assinar" })).toBeInTheDocument();
  });

  it("curte um podcast pela barra inferior registrando métrica local", async () => {
    renderWithProviders(<Home />);
    const cards = screen.getAllByRole("button", { name: /Reproduzir podcast/i });
    fireEvent.click(cards[0]);
    await waitFor(() => {
      expect(screen.getByTestId("now-playing-bar")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Curtir podcast" }));
    expect(screen.getByRole("button", { name: "Descurtir podcast" })).toBeInTheDocument();
  });
});