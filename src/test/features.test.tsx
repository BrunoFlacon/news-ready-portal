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
  // Preferências persistidas pelo player (ex.: legendas on/off).
  window.localStorage.clear();
});

describe("RadioPlayer — player global no cabeçalho", () => {
  it("sem VITE_RADIO_STREAM_URL o carrossel não exibe tarjas fixas e não expõe botão de tocar", () => {
    vi.stubEnv("VITE_RADIO_STREAM_URL", "");
    renderWithProviders(<Home />);

    // As tarjas fixas ("Ao vivo • De Tupã para todo o Brasil") foram
    // removidas do topo das manchetes por pedido editorial.
    expect(screen.queryByText("Em breve live")).not.toBeInTheDocument();
    expect(screen.queryByText("De Tupã para todo o Brasil")).not.toBeInTheDocument();
    // A próxima live continua documentada na grade de programação.
    expect(screen.getAllByText("Domingo • 19h").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Ouvir Agora/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Pausar/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId("radio-player-bar")).not.toBeInTheDocument();
  });

  it("com a URL do stream configurada, clicar em 'Ouça a Rádio' abre a barra global com o elemento de áudio", async () => {
    vi.stubEnv("VITE_RADIO_STREAM_URL", "https://stream.example.com/live");
    mockMedia();

    renderWithProviders(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /Ouça a Rádio/i }));

    const bar = await screen.findByTestId("radio-player-bar");
    expect(bar).toBeInTheDocument();
    // O <audio> do stream vive no provider (persistente ao minimizar).
    expect(screen.getByTestId("live-audio")).toHaveAttribute(
      "src",
      "https://stream.example.com/live",
    );
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
        onMinimize={vi.fn()}
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
        onMinimize={vi.fn()}
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
        onMinimize={vi.fn()}
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
        onMinimize={vi.fn()}
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

describe("RadioPlayer — barra ao vivo compacta (estilo Spotify)", () => {
  const renderBar = () =>
    render(
      <RadioPlayerBar
        url="https://stream.example.com/live"
        open
        playing={false}
        error={false}
        togglePlay={vi.fn()}
        closePlayer={vi.fn()}
        audioRef={createRef<HTMLAudioElement>()}
        onMinimize={vi.fn()}
      />,
    );

  it("mostra programa no ar, apresentador, horário e cidade/estado", () => {
    renderBar();

    const bar = screen.getByTestId("radio-player-bar");
    expect(within(bar).getByText(/Culto de adoração ao vivo/)).toBeInTheDocument();
    expect(within(bar).getByText(/Equipe Web Rádio Vitória/)).toBeInTheDocument();
    expect(within(bar).getByText(/Domingo • 19h/)).toBeInTheDocument();
    expect(within(bar).getByText(/Tupã, SP/)).toBeInTheDocument();
  });

  it("o coração curte/descurte o programa e registra a métrica no navegador", () => {
    renderBar();

    fireEvent.click(screen.getByRole("button", { name: /Curtir programa/i }));
    expect(
      screen.getByRole("button", { name: /Descurtir programa/i }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem("radio.likes.total")).toBe("1");

    fireEvent.click(screen.getByRole("button", { name: /Descurtir programa/i }));
    expect(
      screen.getByRole("button", { name: /Curtir programa/i }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem("radio.likes.total")).toBe("0");
  });

  it("mostra a quantidade de curtidas ao lado do coração e atualiza ao curtir", () => {
    window.localStorage.setItem("radio.likes.total", "42");
    renderBar();

    expect(screen.getByTestId("likes-count")).toHaveTextContent("42");

    fireEvent.click(screen.getByRole("button", { name: /Curtir programa/i }));
    expect(screen.getByTestId("likes-count")).toHaveTextContent("43");

    fireEvent.click(screen.getByRole("button", { name: /Descurtir programa/i }));
    expect(screen.getByTestId("likes-count")).toHaveTextContent("42");
  });

  it("o equalizador se anima na cor da marca enquanto a transmissão toca", () => {
    const { rerender } = render(
      <RadioPlayerBar
        url="https://stream.example.com/live"
        open
        playing={false}
        error={false}
        togglePlay={vi.fn()}
        closePlayer={vi.fn()}
        audioRef={createRef<HTMLAudioElement>()}
        onMinimize={vi.fn()}
      />,
    );

    const eq = screen.getByTestId("live-equalizer");
    const bars = within(eq).getAllByTestId("equalizer-bar");
    expect(bars.length).toBeGreaterThan(10);
    // Sem sinal: barras neutras e paradas.
    expect(bars.every((bar) => bar.className.includes("bg-neutral-700"))).toBe(true);

    rerender(
      <RadioPlayerBar
        url="https://stream.example.com/live"
        open
        playing
        error={false}
        togglePlay={vi.fn()}
        closePlayer={vi.fn()}
        audioRef={createRef<HTMLAudioElement>()}
        onMinimize={vi.fn()}
      />,
    );

    // Tocando: o equalizador ganha a cor da marca e a animação de onda
    // (fallback visual quando o ambiente não expõe Web Audio API).
    const animated = within(screen.getByTestId("live-equalizer")).getAllByTestId(
      "equalizer-bar",
    );
    expect(animated[0]).toHaveClass("wave-bar");
  });

  it("o volume é vertical acima do alto-falante e só aparece ao interagir", () => {
    renderBar();

    const group = screen.getByTestId("live-volume");
    expect(group).toHaveClass("group/vol");

    const slider = within(group).getByRole("slider", { name: /Volume da rádio/i });
    // Vai de baixo para cima (vertical) e não mais ao lado do ícone.
    expect(slider).toHaveClass("volume-slider");
    expect(slider.closest(".absolute")).not.toBeNull();

    // Escondido por padrão; o grupo revela no hover ou no foco do teclado.
    const popover = slider.closest(".absolute") as HTMLElement;
    expect(popover).toHaveClass("invisible");
    expect(popover).toHaveClass("group-hover/vol:visible");
  });

  it("o menu de três pontos reúne pedir música, WhatsApp e compartilhar", () => {
    renderBar();

    fireEvent.click(screen.getByRole("button", { name: /Mais opções/i }));
    const menu = screen.getByTestId("live-player-menu");
    expect(within(menu).getByRole("menuitem", { name: "Pedir música" })).toBeInTheDocument();
    expect(
      within(menu).getByRole("menuitem", { name: /Enviar mensagem no WhatsApp/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("menuitem", { name: /Compartilhar nas redes sociais/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("menuitem", { name: /Enviar o link da rádio no WhatsApp/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("menuitem", { name: "Pedir música por áudio" }),
    ).toBeInTheDocument();
  });

  it("'Pedir música' abre o diálogo e enviar o pedido abre o WhatsApp", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    renderBar();

    fireEvent.click(screen.getByRole("button", { name: /Mais opções/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Pedir música" }));

    const dialog = screen.getByTestId("request-music-dialog");
    expect(dialog).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Seu nome"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Música e artista"), {
      target: { value: "Louvor no altar" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /Enviar pedido/i }));

    expect(open).toHaveBeenCalledWith(expect.stringContaining("wa.me/"), "_blank");
    expect(screen.queryByTestId("request-music-dialog")).not.toBeInTheDocument();
  });

  it("'Compartilhar nas redes sociais' abre diálogo com os links", () => {
    renderBar();

    fireEvent.click(screen.getByRole("button", { name: /Mais opções/i }));
    fireEvent.click(
      screen.getByRole("menuitem", { name: /Compartilhar nas redes sociais/i }),
    );

    const dialog = screen.getByTestId("share-dialog");
    expect(within(dialog).getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
      "href",
      expect.stringContaining("wa.me"),
    );
    expect(within(dialog).getByRole("link", { name: "Facebook" })).toHaveAttribute(
      "href",
      expect.stringContaining("facebook.com"),
    );
    expect(within(dialog).getByRole("link", { name: "Telegram" })).toHaveAttribute(
      "href",
      expect.stringContaining("t.me"),
    );
    expect(within(dialog).getByRole("link", { name: "X (Twitter)" })).toHaveAttribute(
      "href",
      expect.stringContaining("twitter.com"),
    );
  });

  it("enviar o link da rádio no WhatsApp abre o wa.me com a mensagem", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    renderBar();

    fireEvent.click(screen.getByRole("button", { name: /Mais opções/i }));
    fireEvent.click(
      screen.getByRole("menuitem", { name: /Enviar o link da rádio no WhatsApp/i }),
    );

    expect(open).toHaveBeenCalledWith(expect.stringContaining("wa.me/"), "_blank");
    const openedUrl = open.mock.calls[0][0] as string;
    expect(decodeURIComponent(openedUrl)).toContain(
      "Ouça a Web Rádio Vitória ao vivo",
    );
  });

  it("'Pedir música por áudio' abre o WhatsApp direto", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    renderBar();

    fireEvent.click(screen.getByRole("button", { name: /Mais opções/i }));
    fireEvent.click(
      screen.getByRole("menuitem", { name: /Pedir música por áudio/i }),
    );

    expect(open).toHaveBeenCalledWith(expect.stringContaining("wa.me/"), "_blank");
    const openedUrl = open.mock.calls[0][0] as string;
    expect(decodeURIComponent(openedUrl)).toContain("pedir uma música por áudio");
  });
});

describe("RadioPlayer — 'Ouça a Rádio' no cabeçalho", () => {
  it("sem stream configurada o atalho fica indisponível", () => {
    vi.stubEnv("VITE_RADIO_STREAM_URL", "");
    renderWithProviders(<Home />);

    const header = screen.getByRole("banner");
    expect(
      within(header).getByRole("button", { name: /Ouça a Rádio/i }),
    ).toBeDisabled();
  });

  it("com stream, clicar em 'Ouça a Rádio' abre a transmissão ao vivo no rodapé", async () => {
    vi.stubEnv("VITE_RADIO_STREAM_URL", "https://stream.example.com/live");
    mockMedia();
    renderWithProviders(<Home />);

    const header = screen.getByRole("banner");
    fireEvent.click(
      within(header).getByRole("button", { name: /Ouça a Rádio/i }),
    );

    const bar = await screen.findByTestId("radio-player-bar");
    expect(bar).toBeInTheDocument();

    // O estado "tocando" vem do evento real do <audio> — simula para validar
    // que o cabeçalho passa a indicar "Ao vivo".
    const audio = screen.getByTestId("live-audio");
    fireEvent(audio, new Event("play"));
    expect(within(header).getByText("Ao vivo")).toBeInTheDocument();
  });
});

describe("RadioPlayer — minimizar a transmissão ao vivo", () => {
  it("minimiza a barra em um card compacto no canto inferior esquerdo mantendo o áudio montado", async () => {
    vi.stubEnv("VITE_RADIO_STREAM_URL", "https://stream.example.com/live");
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /Ouça a Rádio/i }));
    await screen.findByTestId("radio-player-bar");

    const audio = screen.getByTestId("live-audio");
    const pauseSpy = vi.spyOn(audio, "pause");

    fireEvent.click(screen.getByRole("button", { name: /Minimizar player/i }));

    // A barra cede lugar ao card fixo no canto inferior esquerdo.
    expect(screen.queryByTestId("radio-player-bar")).not.toBeInTheDocument();
    const card = screen.getByTestId("live-mini-card");
    expect(card.className).toContain("bottom-4");
    expect(card.className).toContain("left-4");

    // O <audio> segue vivo no provider e a minimização não pausou a rádio.
    expect(screen.getByTestId("live-audio")).toBeInTheDocument();
    expect(pauseSpy).not.toHaveBeenCalled();

    // Expandir restaura a barra completa.
    fireEvent.click(screen.getByRole("button", { name: /Expandir player/i }));
    expect(screen.getByTestId("radio-player-bar")).toBeInTheDocument();
    expect(screen.queryByTestId("live-mini-card")).not.toBeInTheDocument();
  });
});

describe("Podcast — barra estilo Spotify pausa a transmissão ao vivo", () => {
  it("ao tocar um podcast, a rádio ao vivo é pausada e a barra do episódio entra no lugar", () => {
    vi.stubEnv("VITE_RADIO_STREAM_URL", "https://stream.example.com/live");
    mockMedia();

    renderWithProviders(<Home />);

    // Abre a transmissão ao vivo pelo cabeçalho.
    fireEvent.click(screen.getByRole("button", { name: /Ouça a Rádio/i }));
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

    // Clicar no alto-falante abre o painel vertical de volume (não muta direto).
    fireEvent.click(screen.getByRole("button", { name: /Silenciar/i }));
    expect(screen.getByTestId("podcast-volume-popover")).toBeInTheDocument();

    // Deslizar até 0% silencia a mídia.
    const slider = screen.getByRole("slider", { name: /Volume do podcast/i });
    fireEvent.change(slider, { target: { value: "0" } });
    expect(audio.muted).toBe(true);
    expect(screen.getByRole("button", { name: /Ativar som/i })).toBeInTheDocument();

    // Subir o volume restaura o som e o rótulo volta a ser "Silenciar".
    fireEvent.change(slider, { target: { value: "50" } });
    expect(audio.muted).toBe(false);
    expect(screen.getByRole("button", { name: /Silenciar/i })).toBeInTheDocument();
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

describe("Home — player imersivo no banner gigante", () => {
  it("abre o overlay no banner ao escolher um reel e exibe o vídeo vertical com legenda", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Assistir Inteligência artificial na saúde/i,
      }),
    );

    expect(screen.getByTestId("watch-overlay")).toBeInTheDocument();
    const media = screen.getByTestId("watch-media");
    expect(media).toBeInTheDocument();
    expect(media).toHaveAttribute("src", expect.stringContaining("?v=reel-1"));
    // Reels/stories entram centralizados em 9:16.
    expect(media.parentElement).toHaveClass("aspect-[9/16]");
    // Legenda (CC) sobre o vídeo, como no YouTube.
    expect(screen.getByTestId("watch-caption")).toHaveTextContent(/Legenda do áudio/i);
  });

  it("reproduz a live no banner ao clicar na linha da programação", () => {
    mockMedia();
    renderWithProviders(<Home />);

    const grid = screen.getByTestId("schedule-grid");
    fireEvent.click(
      within(grid).getByRole("button", { name: /Culto de adoração ao vivo/i }),
    );

    expect(screen.getByTestId("watch-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("watch-media")).toHaveAttribute(
      "src",
      expect.stringContaining("?v=live-now-1"),
    );
    // Tarja "AO VIVO" fixa no canto superior esquerdo do player.
    expect(screen.getByTestId("watch-live-badge")).toBeInTheDocument();
  });

  it("ao terminar, alterna próximo/anúncio premium/grade e reproduz automaticamente em 3 segundos", () => {
    vi.useFakeTimers();
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Assistir Inteligência artificial na saúde/i,
      }),
    );
    const media = screen.getByTestId("watch-media") as HTMLVideoElement;
    fireEvent(media, new Event("ended"));

    // Transição: manchete + capa do próximo vídeo recomendado (story-3).
    expect(screen.getByTestId("watch-transition")).toBeInTheDocument();
    expect(screen.getByTestId("watch-next-card")).toBeInTheDocument();
    expect(screen.getByText(/Cultura em destaque/i)).toBeInTheDocument();

    // Depois de 4s: anúncio da assinatura premium (rotação lenta).
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByTestId("watch-premium-ad")).toBeInTheDocument();

    // Passados mais 4s: grade com a próxima live e o próximo programa.
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByTestId("watch-schedule-ad")).toBeInTheDocument();
    expect(screen.getByText(/Próxima live/i)).toBeInTheDocument();
    expect(screen.getByText(/Domingo às 19h/i)).toBeInTheDocument();

    // No 12º segundo o próximo da recomendação (story-3) começa sozinho.
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByTestId("watch-media")).toHaveAttribute(
      "src",
      expect.stringContaining("?v=story-3"),
    );
  });

  it("fecha o overlay ao clicar em fechar", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Assistir Inteligência artificial na saúde/i,
      }),
    );
    expect(screen.getByTestId("watch-overlay")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Fechar player/i }));
    expect(screen.queryByTestId("watch-overlay")).not.toBeInTheDocument();
  });

  it("silencia e restaura o volume do vídeo pelo alto-falante e pela barra", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Assistir Inteligência artificial na saúde/i,
      }),
    );
    const media = screen.getByTestId("watch-media") as HTMLVideoElement;

    // Barra de volume: desliza até 40% e aplica na mídia.
    const slider = screen.getByRole("slider", { name: /Volume do vídeo/i });
    fireEvent.change(slider, { target: { value: "0.4" } });
    expect(media.volume).toBeCloseTo(0.4);

    // No zero, a barra silencia a mídia.
    fireEvent.change(slider, { target: { value: "0" } });
    expect(media.muted).toBe(true);

    // Clicar no alto-falante restaura o som com um volume útil.
    fireEvent.click(screen.getByRole("button", { name: /Ativar som do vídeo/i }));
    expect(media.muted).toBe(false);
    expect(media.volume).toBeCloseTo(0.85);
  });

  it("alterna as legendas (CC) sobre o vídeo", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Assistir Inteligência artificial na saúde/i,
      }),
    );
    expect(screen.getByTestId("watch-caption")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Legendas do vídeo/i }));
    expect(screen.queryByTestId("watch-caption")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Legendas do vídeo/i }));
    expect(screen.getByTestId("watch-caption")).toBeInTheDocument();
  });

  it("lembra a escolha das legendas ao fechar e reabrir o player", () => {
    mockMedia();
    renderWithProviders(<Home />);

    const openReel = () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: /Assistir Inteligência artificial na saúde/i,
        }),
      );
    };

    openReel();
    expect(screen.getByTestId("watch-caption")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Legendas do vídeo/i }));
    expect(screen.queryByTestId("watch-caption")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Fechar player/i }));
    openReel();
    // Fechar e reabrir mantém as legendas desligadas.
    expect(screen.queryByTestId("watch-caption")).not.toBeInTheDocument();
  });

  it("clicar no botão central do banner reproduz com o áudio ativado", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Reproduzir Entenda o novo pacote de infraestrutura digital/i,
      }),
    );

    expect(screen.getByTestId("watch-overlay")).toBeInTheDocument();
    const media = screen.getByTestId("watch-media") as HTMLVideoElement;
    expect(media).toHaveAttribute("src", expect.stringContaining("?v=video-1"));
    // Vídeo/live entram com o áudio ativado.
    expect(media.muted).toBe(false);
  });

  it("no hero em repouso mostra o título e a descrição do vídeo em destaque", () => {
    renderWithProviders(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Entenda o novo pacote de infraestrutura digital/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Matéria e cortes produzidos pela redação/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /Acessar Vitória News/i }),
    ).toBeInTheDocument();
  });

  it("a capa da manchete abre a matéria vinculada e o play fica oculto até o hover", () => {
    mockMedia();
    renderWithProviders(<Home />);

    // Com matéria vinculada (video-1 → /artigo/1), a capa vira um link de
    // leitura — sem botão fixo sobre a imagem.
    const coverLink = screen.getByRole("link", {
      name: /Abrir matéria: Entenda o novo pacote de infraestrutura digital/i,
    });
    expect(coverLink).toHaveAttribute("href", "/artigo/1");

    // O play central existe, mas surge só no hover/foco (marcado por CSS).
    const group = coverLink.closest(".group") as HTMLElement;
    const centralPlay = within(group).getByRole("button", {
      name: /Reproduzir Entenda o novo pacote de infraestrutura digital/i,
    });
    const playWrapper = centralPlay.closest("span.absolute") as HTMLElement;
    expect(playWrapper.className).toContain("opacity-0");
    expect(playWrapper.className).toContain("group-hover:opacity-100");
    expect(playWrapper.className).toContain("group-focus-within:opacity-100");
    expect(playWrapper.className).toContain("pointer-events-none");

    // O botão "Ler matéria" foi removido; "Acessar Vitória News" é o único
    // atalho e aponta para o link correto da matéria vinculada.
    expect(screen.queryByRole("link", { name: "Ler matéria" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Acessar Vitória News/i }),
    ).toHaveAttribute("href", "/artigo/1");
  });

  it("os pontos do carrossel trocam a manchete e a capa em destaque", () => {
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Ir para manchete: Como a IA está transformando os diagnósticos/i,
      }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Como a IA está transformando os diagnósticos/i,
      }),
    ).toBeInTheDocument();
    // A nova manchete também tem matéria vinculada (/artigo/2).
    expect(
      screen.getByRole("link", {
        name: /Abrir matéria: Como a IA está transformando os diagnósticos/i,
      }),
    ).toHaveAttribute("href", "/artigo/2");
  });

  it("manchete sem matéria vinculada mantém a capa clicável para reproduzir", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Ir para manchete: Culto de adoração ao vivo/i,
      }),
    );

    // Live não tem matéria: a capa continua sendo o botão de play.
    expect(
      screen
        .getAllByRole("button", {
          name: /Reproduzir Culto de adoração ao vivo/i,
        })
        .length,
    ).toBeGreaterThan(0);
  });

  it("no carrossel de reels o badge mostra só a duração e o play aparece no hover", () => {
    renderWithProviders(<Home />);

    const reelCard = screen.getByRole("button", {
      name: /Assistir Inteligência artificial na saúde/i,
    });
    // Badge informativo (duração), sem ícone de play fixo.
    expect(within(reelCard).getByTestId("rail-duration")).toHaveTextContent(
      "0:42",
    );
    // Círculo de play presente, mas oculto até o hover (via CSS).
    const hoverPlay = within(reelCard).getByTestId("rail-play-hover");
    expect(hoverPlay).toHaveClass("opacity-0");
    expect(hoverPlay).toHaveClass("group-hover:opacity-100");
    expect(hoverPlay).toHaveClass("pointer-events-none");
  });

  it("mostra o botão central de play apenas ao passar o dedo sobre a capa (estilo YouTube)", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Reproduzir Entenda o novo pacote de infraestrutura digital/i,
      }),
    );
    const player = screen.getByTestId("youtube-player");
    const centerPlay = screen.getByTestId("player-center-play");

    // O vídeo inicia tocando (autoplay mockado) e o botão fica oculto até
    // o dedo/mouse passar sobre a imagem — como o play da capa do YouTube.
    expect(centerPlay).toHaveClass("opacity-0");

    // Passar o dedo sobre a imagem revela o botão central.
    fireEvent.pointerEnter(player);
    expect(centerPlay).not.toHaveClass("opacity-0");

    // O botão central alterna play/pause ao ser tocado (o vídeo pausa).
    fireEvent.click(centerPlay);
    expect(screen.getByRole("button", { name: /Reproduzir vídeo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reproduzir conteúdo" })).toBeInTheDocument();
  });

  it("pausa e reproduz o vídeo pelo botão central do player (estilo YouTube)", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Reproduzir Entenda o novo pacote de infraestrutura digital/i,
      }),
    );

    const playPause = screen.getByRole("button", { name: /Pausar vídeo/i });
    fireEvent.click(playPause);
    expect(screen.getByRole("button", { name: /Reproduzir vídeo/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Reproduzir vídeo/i }));
    expect(screen.getByRole("button", { name: /Pausar vídeo/i })).toBeInTheDocument();
  });

  it("seleciona a velocidade de reprodução no menu de configurações e aplica na mídia", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Reproduzir Entenda o novo pacote de infraestrutura digital/i,
      }),
    );
    const media = screen.getByTestId("watch-media") as HTMLVideoElement;

    fireEvent.click(screen.getByRole("button", { name: /Configurações do vídeo/i }));
    expect(screen.getByTestId("settings-menu")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("menuitem", { name: /Velocidade de reprodução/i }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: /1\.25x/i }));
    expect(media.playbackRate).toBe(1.25);

    // Reabre o menu e confere a opção marcada.
    fireEvent.click(screen.getByRole("button", { name: /Configurações do vídeo/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Velocidade de reprodução/i }));
    expect(screen.getByRole("menuitemradio", { name: /1\.25x/i })).toHaveAttribute("aria-checked", "true");
  });

  it("abre o menu de qualidade dentro das configurações (padrão Auto 1080p) e seleciona 480p", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Reproduzir Entenda o novo pacote de infraestrutura digital/i,
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: /Configurações do vídeo/i }));
    expect(screen.getByRole("menuitem", { name: /Qualidade do vídeo/i })).toHaveTextContent("Auto (1080p)");
    fireEvent.click(screen.getByRole("menuitem", { name: /Qualidade do vídeo/i }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: /480p/i }));
    expect(screen.queryByTestId("settings-menu")).not.toBeInTheDocument();

    // Reabre e confere a qualidade escolhida no item e no submenu.
    fireEvent.click(screen.getByRole("button", { name: /Configurações do vídeo/i }));
    expect(screen.getByRole("menuitem", { name: /Qualidade do vídeo/i })).toHaveTextContent("480p");
    fireEvent.click(screen.getByRole("menuitem", { name: /Qualidade do vídeo/i }));
    expect(screen.getByRole("menuitemradio", { name: /480p/i })).toHaveAttribute("aria-checked", "true");
  });

  it("arrasta a timeline para buscar (scrub) e mostra a capa como pré-visualização", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Reproduzir Entenda o novo pacote de infraestrutura digital/i,
      }),
    );
    const media = screen.getByTestId("watch-media") as HTMLVideoElement;
    const timeline = screen.getByTestId("player-timeline");
    vi.spyOn(timeline, "getBoundingClientRect").mockReturnValue({
      left: 0,
      right: 200,
      top: 0,
      bottom: 8,
      width: 200,
      height: 8,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    let seeked = 0;
    Object.defineProperty(media, "duration", { configurable: true, get: () => 100 });
    Object.defineProperty(media, "currentTime", {
      configurable: true,
      get: () => seeked,
      set: (value: number) => {
        seeked = value;
      },
    });

    fireEvent(timeline, new MouseEvent("pointerdown", { bubbles: true, clientX: 100 }));
    expect(screen.getByTestId("youtube-player")).toHaveClass("scrubbing");

    fireEvent(window, new MouseEvent("pointerup", { bubbles: true, clientX: 100 }));
    expect(screen.getByTestId("youtube-player")).not.toHaveClass("scrubbing");
    expect(seeked).toBeCloseTo(50);
  });

  it("ao tocar no vídeo, o player dá play/pause", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Reproduzir Entenda o novo pacote de infraestrutura digital/i,
      }),
    );

    const player = screen.getByTestId("youtube-player");
    fireEvent.click(player);
    expect(screen.getByRole("button", { name: /Reproduzir vídeo/i })).toBeInTheDocument();

    fireEvent.click(player);
    expect(screen.getByRole("button", { name: /Pausar vídeo/i })).toBeInTheDocument();
  });

  it("lembra o volume escolhido ao fechar e reabrir o player", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Reproduzir Entenda o novo pacote de infraestrutura digital/i,
      }),
    );
    const slider = screen.getByRole("slider", { name: /Volume do vídeo/i }) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "0.4" } });

    fireEvent.click(screen.getByRole("button", { name: /Fechar player/i }));
    fireEvent.click(
      screen.getByRole("button", {
        name: /Reproduzir Entenda o novo pacote de infraestrutura digital/i,
      }),
    );

    const media = screen.getByTestId("watch-media") as HTMLVideoElement;
    expect(media.volume).toBeCloseTo(0.4);
    expect(screen.getByRole("slider", { name: /Volume do vídeo/i })).toHaveValue("0.4");
  });

  it("esconde o campo de volume automaticamente depois de usar", () => {
    vi.useFakeTimers();
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Reproduzir Entenda o novo pacote de infraestrutura digital/i,
      }),
    );
    const popover = screen.getByTestId("volume-popover");
    expect(popover.className).not.toContain("sm:opacity-100");

    fireEvent.change(screen.getByRole("slider", { name: /Volume do vídeo/i }), {
      target: { value: "0.6" },
    });
    expect(popover.className).toContain("sm:opacity-100");

    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(popover.className).not.toContain("sm:opacity-100");
  });

  it("reúne teatro, mini player e tela cheia no menu de exibição das configurações", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Reproduzir Entenda o novo pacote de infraestrutura digital/i,
      }),
    );
    const media = screen.getByTestId("watch-media") as HTMLVideoElement;

    fireEvent.click(screen.getByRole("button", { name: /Configurações do vídeo/i }));
    expect(screen.getByTestId("settings-menu")).toBeInTheDocument();
    const viewItem = screen.getByRole("menuitem", { name: /Exibição/i });
    expect(viewItem).toBeInTheDocument();
    fireEvent.click(viewItem);
    expect(screen.getByRole("menuitemradio", { name: /Teatro/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: /Mini player/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: /Tela cheia/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitemradio", { name: /Teatro/i }));
    expect(screen.queryByTestId("settings-menu")).not.toBeInTheDocument();
    expect(media.className).toContain("object-contain");
  });
});

describe("Home — área premium", () => {
  it("abre o painel ao escolher um podcast na íntegra (só data, hora, nome e apresentador)", () => {
    mockMedia();
    renderWithProviders(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Assinar para ouvir Boletim de notícias da semana/i,
      }),
    );

    const panel = screen.getByTestId("premium-panel");
    expect(panel).toBeInTheDocument();
    expect(
      within(panel).getByText(/Boletim de notícias da semana/i),
    ).toBeInTheDocument();
    expect(within(panel).getByText(/Rodrigo Alves/i)).toBeInTheDocument();
    expect(within(panel).getByText(/Quinta feira • 7h/i)).toBeInTheDocument();
    expect(
      within(panel).getByRole("button", { name: /Assinar a área premium/i }),
    ).toBeInTheDocument();
  });

  it("reapresentações de lives na grade mostram dados básicos com a marca premium", () => {
    renderWithProviders(<Home />);

    const grid = screen.getByTestId("schedule-grid");
    const replay = within(grid).getByRole("button", {
      name: /Reapresentação — Culto da semana/i,
    });
    expect(replay).toHaveTextContent("Sábado");
    expect(replay).toHaveTextContent("9h");
    expect(replay).toHaveTextContent("Equipe Web Rádio Vitória");
    expect(within(replay).getByText("Premium")).toBeInTheDocument();
  });
});

describe("Menu — borda ativa apenas no item clicado", () => {
  it("na home sem hash, Início está ativo e Institucional não", () => {
    renderWithProviders(<Home />);

    const nav = screen.getByRole("navigation", { name: /Navegação principal/i });
    expect(
      within(nav).getByRole("link", { name: "Início" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(nav).getByRole("link", { name: "Institucional" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("com #institucional, Institucional está ativo e Início não", () => {
    renderWithProviders(<Home />, { route: "/#institucional" });

    const nav = screen.getByRole("navigation", { name: /Navegação principal/i });
    expect(
      within(nav).getByRole("link", { name: "Institucional" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(nav).getByRole("link", { name: "Início" }),
    ).not.toHaveAttribute("aria-current");
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