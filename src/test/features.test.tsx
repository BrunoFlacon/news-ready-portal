import { describe, it, expect, vi, afterEach } from "vitest";
import { createRef, act } from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RadioPlayerProvider } from "@/contexts/RadioPlayerContext";
import Home from "@/pages/Home";
import Contact from "@/pages/Contact";
import ArticlePage from "@/pages/ArticlePage";
import {
  RadioPlayerBar,
  ListenNowButton,
  useRadioPlayer,
} from "@/components/RadioPlayer";
import { podcasts } from "@/data/podcasts";
import { submitContact } from "@/lib/contact";
import { initAnalytics } from "@/lib/analytics";
import { renderWithProviders } from "./utils";

// jsdom não implementa reprodução de mídia; o mock evita exceções.
const mockMedia = () => {
  window.HTMLMediaElement.prototype.play = vi
    .fn()
    .mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.head.innerHTML = "";
});

describe("RadioPlayer — player global no cabeçalho", () => {
  it("sem VITE_RADIO_STREAM_URL mostra 'Em breve live' com o horário e não expõe botão de tocar", () => {
    vi.stubEnv("VITE_RADIO_STREAM_URL", "");
    renderWithProviders(<Home />);

    expect(screen.getByText("Em breve live")).toBeInTheDocument();
    expect(screen.getByText("Domingo, às 19h")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ouvir Agora/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Pausar/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId("radio-player-bar")).not.toBeInTheDocument();
  });

  it("com a URL do stream configurada, clicar em 'Ouvir Agora' abre a barra global com o elemento de áudio", async () => {
    vi.stubEnv("VITE_RADIO_STREAM_URL", "https://stream.example.com/live");
    mockMedia();

    renderWithProviders(<Home />);

    fireEvent.click(screen.getAllByRole("button", { name: /Ouvir Agora/i })[0]);

    const bar = await screen.findByTestId("radio-player-bar");
    expect(bar).toBeInTheDocument();
    const audio = bar.querySelector("audio");
    expect(audio).toHaveAttribute("src", "https://stream.example.com/live");
  });
});

describe("RadioPlayer — barra do player", () => {
  it("alterna entre reproduzir e pausar conforme o estado", () => {
    const togglePlay = vi.fn();
    const closePlayer = vi.fn();

    const { rerender } = render(
      <RadioPlayerBar
        url="https://stream.example.com/live"
        open
        playing={false}
        error={false}
        togglePlay={togglePlay}
        closePlayer={closePlayer}
        audioRef={createRef<HTMLAudioElement>()}
      />,
    );

    const playBtn = screen.getByRole("button", {
      name: /Reproduzir transmissão/i,
    });
    fireEvent.click(playBtn);
    expect(togglePlay).toHaveBeenCalled();

    rerender(
      <RadioPlayerBar
        url="https://stream.example.com/live"
        open
        playing
        error={false}
        togglePlay={togglePlay}
        closePlayer={closePlayer}
        audioRef={createRef<HTMLAudioElement>()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Pausar transmissão/i }),
    ).toBeInTheDocument();
  });

  it("exibe aviso de erro quando a reprodução falha", () => {
    const { rerender } = render(
      <RadioPlayerBar
        url="https://stream.example.com/live"
        open
        playing={false}
        error
        togglePlay={vi.fn()}
        closePlayer={vi.fn()}
        audioRef={createRef<HTMLAudioElement>()}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();

    rerender(
      <RadioPlayerBar
        url="https://stream.example.com/live"
        open
        playing={false}
        error={false}
        togglePlay={vi.fn()}
        closePlayer={vi.fn()}
        audioRef={createRef<HTMLAudioElement>()}
      />,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ListenNowButton sem URL é desabilitado e com URL abre o player", () => {
    const open = vi.fn();

    const { rerender } = render(
      <ListenNowButton streamUrl="" onOpen={open} />,
    );
    expect(screen.getByRole("button", { name: /Em breve/i })).toBeDisabled();

    rerender(<ListenNowButton streamUrl="https://s.example/live" onOpen={open} />);
    fireEvent.click(screen.getByRole("button", { name: /Ouvir Agora/i }));
    expect(open).toHaveBeenCalledTimes(1);
  });
});

describe("useRadioPlayer", () => {
  it("não abre o player sem URL configurada", () => {
    vi.stubEnv("VITE_RADIO_STREAM_URL", "");
    let api!: ReturnType<typeof useRadioPlayer>;
    function Probe() {
      api = useRadioPlayer();
      return null;
    }
    render(<Probe />);
    api.openPlayer();
    expect(api.liveOpen).toBe(false);
  });
});

describe("Podcast — barra estilo Spotify pausa a transmissão ao vivo", () => {
  it("ao tocar um podcast, a rádio ao vivo é pausada e a barra do episódio entra no lugar", () => {
    vi.stubEnv("VITE_RADIO_STREAM_URL", "https://stream.example.com/live");
    mockMedia();

    renderWithProviders(<Home />);

    // Abre a transmissão ao vivo pelo cabeçalho.
    fireEvent.click(screen.getAllByRole("button", { name: /Ouvir Agora/i })[0]);
    expect(screen.getByTestId("radio-player-bar")).toBeInTheDocument();

    // Toca o primeiro podcast da programação.
    fireEvent.click(
      screen.getAllByRole("button", { name: /Reproduzir podcast/i })[0],
    );

    // A ao vivo é pausada e a barra estilo Spotify assume o rodapé.
    expect(screen.queryByTestId("radio-player-bar")).not.toBeInTheDocument();
    const npBar = screen.getByTestId("now-playing-bar");
    expect(npBar).toBeInTheDocument();
    // O <audio> do episódio vive no provider (fora da barra) e segue montado.
    expect(screen.getByTestId("np-audio")).toHaveAttribute(
      "src",
      podcasts[0].audioUrl,
    );
  });

  it("minimiza a barra em um card flutuante no canto esquerdo", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /Reproduzir podcast/i })[0],
    );
    expect(screen.getByTestId("now-playing-bar")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Minimizar player/i }));

    expect(screen.queryByTestId("now-playing-bar")).not.toBeInTheDocument();
    const floating = screen.getByTestId("floating-player");
    expect(floating).toBeInTheDocument();
  });

  it("ao terminar o episódio, mostra sugestões e reproduz uma recomendação após 3 segundos", () => {
    vi.useFakeTimers();
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /Reproduzir podcast/i })[0],
    );

    // Simula o fim do áudio do episódio (o elemento permanente do provider).
    const audio = screen.getByTestId("np-audio") as HTMLAudioElement;
    fireEvent(audio, new Event("ended"));

    expect(screen.getByTestId("suggestions-panel")).toBeInTheDocument();

    // Nada escolhido: após 3 segundos, a recomendação começa automaticamente.
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId("video-bubble")).toBeInTheDocument();
  });

  it("dá play em um vídeo/reel/story escolhido no painel de sugestões", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /Reproduzir podcast/i })[0],
    );
    const audio = screen.getByTestId("np-audio") as HTMLAudioElement;
    fireEvent(audio, new Event("ended"));

    const suggest = screen.getByTestId("suggestions-panel");
    fireEvent.click(
      within(suggest).getAllByRole("button").find(
        (button) => button.textContent && /Assistir|Infraestrutura/i.test(button.textContent),
      ) as HTMLButtonElement,
    );

    expect(screen.queryByTestId("suggestions-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("video-bubble")).toBeInTheDocument();
  });
});

describe("Podcast — controles da barra inferior", () => {
  it("minimizar mantém o <audio> montado sem pausar a reprodução", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /Reproduzir podcast/i })[0],
    );
    const audio = screen.getByTestId("np-audio") as HTMLAudioElement;
    const pauseSpy = vi.spyOn(audio, "pause");

    fireEvent.click(screen.getByRole("button", { name: /Minimizar player/i }));

    expect(screen.queryByTestId("now-playing-bar")).not.toBeInTheDocument();
    expect(screen.getByTestId("floating-player")).toBeInTheDocument();
    // O <audio> segue vivo (provider) e a minimização não o pausou.
    expect(screen.getByTestId("np-audio")).toBeInTheDocument();
    expect(pauseSpy).not.toHaveBeenCalled();
  });

  it("pausa e retoma sincronizados com os eventos reais play/pause", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /Reproduzir podcast/i })[0],
    );

    const audio = screen.getByTestId("np-audio") as HTMLAudioElement;
    const playSpy = vi.spyOn(audio, "play").mockResolvedValue(undefined);
    const pauseSpy = vi.spyOn(audio, "pause").mockImplementation(() => {
      fireEvent(audio, new Event("pause"));
    });

    // Pausa: o botão reflete o evento "pause" da mídia e não fica travado.
    fireEvent.click(screen.getByRole("button", { name: /Pausar podcast/i }));
    expect(pauseSpy).toHaveBeenCalled();
    const npBar = screen.getByTestId("now-playing-bar");
    expect(
      within(npBar).getByRole("button", { name: /Reproduzir podcast/i }),
    ).toBeInTheDocument();

    // Retoma de onde parou: novo clique chama play() e o evento "play" sincroniza.
    fireEvent.click(within(npBar).getByRole("button", { name: /Reproduzir podcast/i }));
    expect(playSpy).toHaveBeenCalled();
    fireEvent(audio, new Event("play"));
    expect(screen.getByRole("button", { name: /Pausar podcast/i })).toBeInTheDocument();
  });

  it("silencia e restaura o volume pela barra", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /Reproduzir podcast/i })[0],
    );
    const audio = screen.getByTestId("np-audio") as HTMLAudioElement;

    fireEvent.click(screen.getByRole("button", { name: /Silenciar/i }));
    expect(audio.muted).toBe(true);
    expect(screen.getByRole("button", { name: /Ativar som/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Ativar som/i }));
    expect(audio.muted).toBe(false);
  });

  it("altera a velocidade de reprodução em ciclo e aplica na mídia", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /Reproduzir podcast/i })[0],
    );
    const audio = screen.getByTestId("np-audio") as HTMLAudioElement;

    const rateButton = screen.getByRole("button", {
      name: /Velocidade de reprodução/i,
    });
    expect(rateButton).toHaveTextContent("1×");

    fireEvent.click(rateButton);

    expect(
      screen.getByRole("button", { name: /Velocidade de reprodução/i }),
    ).toHaveTextContent("1.25×");
    expect(audio.playbackRate).toBe(1.25);
  });

  it("avança e volta 15 segundos no episódio", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /Reproduzir podcast/i })[0],
    );
    const audio = screen.getByTestId("np-audio") as HTMLAudioElement;
    audio.currentTime = 40;

    fireEvent.click(screen.getByRole("button", { name: /Avançar 15 segundos/i }));
    expect(audio.currentTime).toBe(55);

    fireEvent.click(screen.getByRole("button", { name: /Voltar 15 segundos/i }));
    expect(audio.currentTime).toBe(40);
  });
});

describe("ArticlePage — compartilhamento", () => {
  it("copia o link do artigo com o clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    // useParams exige que o componente seja renderizado dentro de uma <Route>.
    render(
      <MemoryRouter initialEntries={["/artigo/2"]}>
        <RadioPlayerProvider>
          <Routes>
            <Route path="/artigo/:id" element={<ArticlePage />} />
          </Routes>
        </RadioPlayerProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Copiar link/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalled());
  });
});

describe("submitContact — envio real do formulário", () => {
  it("valida campos obrigatórios antes de enviar", async () => {
    vi.stubEnv("VITE_CONTACT_ENDPOINT", "");
    const result = await submitContact({
      name: "",
      email: "",
      phone: "",
      message: "",
    });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/obrigatórios/i);
  });

  it("opera em modo demonstração sem endpoint configurado", async () => {
    vi.stubEnv("VITE_CONTACT_ENDPOINT", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await submitContact({
      name: "Ana",
      email: "ana@email.com",
      phone: "",
      message: "Olá rádio!",
    });
    expect(result.ok).toBe(true);
    expect(result.demo).toBe(true);
    expect(warn).toHaveBeenCalled();
  });

  it("envia POST JSON para o endpoint configurado", async () => {
    vi.stubEnv("VITE_CONTACT_ENDPOINT", "https://formspree.io/f/abc123");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 });
    vi.stubGlobal("fetch", fetchMock);

    const payload = {
      name: "Ana",
      email: "ana@email.com",
      phone: "14 99999-9999",
      message: "Teste de envio",
    };

    const result = await submitContact(payload);

    expect(result.ok).toBe(true);
    expect(result.demo).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://formspree.io/f/abc123",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      }),
    );
  });

  it("propaga falhas HTTP para o usuário", async () => {
    vi.stubEnv("VITE_CONTACT_ENDPOINT", "https://formspree.io/f/abc123");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    const result = await submitContact({
      name: "Ana",
      email: "ana@email.com",
      phone: "",
      message: "Teste",
    });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/HTTP 500/i);
  });
});

describe("initAnalytics — Umami", () => {
  it("não injeta script sem configuração", () => {
    vi.stubEnv("VITE_ANALYTICS_ENDPOINT", "");
    vi.stubEnv("VITE_ANALYTICS_WEBSITE_ID", "");
    initAnalytics();
    expect(
      document.querySelector("script[data-website-id]"),
    ).not.toBeInTheDocument();
  });

  it("injeta o script Umami quando configurado", () => {
    vi.stubEnv("VITE_ANALYTICS_ENDPOINT", "https://umami.example.com/");
    vi.stubEnv("VITE_ANALYTICS_WEBSITE_ID", "site-123");
    initAnalytics();

    const script = document.querySelector(
      'script[data-website-id="site-123"]',
    );
    expect(script).toBeInTheDocument();
    expect(script).toHaveAttribute(
      "src",
      "https://umami.example.com/umami",
    );
  });
});

describe("Contact — mapa com fallback", () => {
  it("exibe o fallback com link para o Google Maps quando não há API key", () => {
    vi.stubEnv("VITE_FRONTEND_FORGE_API_KEY", "");
    renderWithProviders(<Contact />);

    const mapLink = screen.getByText(/Ver no Google Maps/i);
    expect(mapLink).toBeInTheDocument();
    expect(mapLink.closest("a")).toHaveAttribute(
      "href",
      expect.stringContaining("google.com/maps"),
    );
  });
});