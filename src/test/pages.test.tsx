import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RadioPlayerProvider } from "@/contexts/RadioPlayerContext";
import { renderWithProviders } from "./utils";
import { AppRoutes } from "@/App";
import Home from "@/pages/Home";
import Index from "@/pages/Index";
import Contact from "@/pages/Contact";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
  // jsdom não implementa scrollIntoView; limpa o mock aplicado no teste de âncora.
  delete (Element.prototype as unknown as Record<string, unknown>).scrollIntoView;
});

describe("Home (área da rádio — separada das notícias)", () => {
  it("renderiza as seções da rádio: hero, programação, podcasts e reels", () => {
    renderWithProviders(<Home />);

    // Hero da rádio (o rodapé repete a marca em heading próprio)
    expect(screen.getAllByRole("heading", { name: "Web Rádio Vitória" }).length).toBeGreaterThan(0);

    // Programação + podcasts
    expect(screen.getByRole("heading", { name: /Programação/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Podcasts" })).toBeInTheDocument();

    // Seção dividida de entretenimento: reels e stories lado a lado.
    expect(screen.getByRole("heading", { name: "Entretenimento" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reels da redação" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Stories em destaque" })).toBeInTheDocument();

    // A seção de vídeos e lives saiu: o conteúdo migrou para o banner gigante.
    expect(
      screen.queryByRole("heading", { name: /Vídeos e lives/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Vídeos" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Lives" })).not.toBeInTheDocument();

    // A área institucional não aparece na home sem o hash #institucional
    expect(screen.queryByText("Área institucional")).not.toBeInTheDocument();
  });

  it("exibe a grade dinâmica da programação com apresentadores e horários", () => {
    renderWithProviders(<Home />);

    const grid = screen.getByTestId("schedule-grid");
    expect(
      within(grid).getByRole("button", { name: /Culto de adoração ao vivo/i }),
    ).toBeInTheDocument();
    expect(
      within(grid).getByRole("button", { name: /Programa da manhã/i }),
    ).toBeInTheDocument();
    // Cada linha mostra o apresentador e o horário da grade.
    expect(within(grid).getAllByText(/Apresentador\(a\):/i).length).toBeGreaterThan(0);
    expect(within(grid).getByText(/19h/)).toBeInTheDocument();
  });

  it("renderiza a área institucional apenas ao acessar com o hash #institucional", () => {
    renderWithProviders(<Home />);
    expect(screen.queryByText("Área institucional")).not.toBeInTheDocument();

    renderWithProviders(<Home />, { route: "/#institucional" });
    expect(screen.getByText("Área institucional")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Uma voz que informa, acolhe e conecta/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tupã, SP — Brasil/i)).toBeInTheDocument();
  });

  it("não exibe conteúdo de notícias na home (breaking news, manchetes, listagens)", () => {
    renderWithProviders(<Home />);

    expect(screen.queryByText("Breaking news")).not.toBeInTheDocument();
    expect(screen.queryByText("Manchetes do dia")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Mais notícias/i })).not.toBeInTheDocument();
  });

  it("expõe no topo os acessos para o portal, institucional e assinatura, com contato só no rodapé", () => {
    renderWithProviders(<Home />);

    const header = screen.getByRole("banner");

    const vitoriaNewsLinks = within(header).getAllByRole("link", { name: "Vitória News" });
    expect(vitoriaNewsLinks.length).toBeGreaterThan(0);
    expect(vitoriaNewsLinks[0]).toHaveAttribute("href", "/noticias");

    expect(within(header).getByRole("link", { name: "Institucional" })).toHaveAttribute(
      "href",
      "/#institucional",
    );

    // O menu do topo não tem "Contato" nem "Fale conosco" — o contato vive
    // apenas no rodapé, e o CTA do topo agora é a assinatura.
    expect(within(header).queryByRole("link", { name: /Fale conosco/i })).not.toBeInTheDocument();
    expect(within(header).getByRole("link", { name: "Assine" })).toHaveAttribute(
      "href",
      "/#assinatura",
    );

    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByRole("link", { name: "Contato" })).toHaveAttribute(
      "href",
      "/contato",
    );
  });

  it("a rota '#assinatura' (botão Assine do topo) abre o painel premium na home", () => {
    renderWithProviders(<Home />, { route: "/#assinatura" });

    const panel = screen.getByTestId("premium-panel");
    expect(within(panel).getByRole("heading", { name: /Área Premium da Web Rádio Vitória/i })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: /Assinar a área premium/i })).toBeInTheDocument();
  });

  it("não expõe botão de pause no cabeçalho (controles ficam nas barras)", () => {
    vi.stubEnv("VITE_RADIO_STREAM_URL", "https://stream.example.com/live");
    renderWithProviders(<Home />);

    const header = screen.getByRole("banner");
    expect(within(header).queryByRole("button", { name: /Pausar/i })).not.toBeInTheDocument();
    // Idle + stream configurada: apenas o atalho "Ouvir Agora" é oferecido.
    expect(within(header).getByRole("button", { name: /Ouvir Agora/i })).toBeInTheDocument();
  });
});

describe("Index (portal de notícias — Vitória News)", () => {
  it("renderiza a listagem de notícias e os filtros de categoria", () => {
    renderWithProviders(<Index />);

    expect(screen.getByText("Últimas Notícias")).toBeInTheDocument();
    for (const category of ["Todas", "Política", "Tecnologia", "Entretenimento"]) {
      expect(screen.getByRole("button", { name: category })).toBeInTheDocument();
    }
  });

  it("filtra as notícias ao clicar em uma categoria", () => {
    renderWithProviders(<Index />);

    fireEvent.click(screen.getByRole("button", { name: "Tecnologia" }));

    // O herói passa a destacar artigo de Tecnologia
    expect(screen.getAllByText(/Inteligência artificial/i).length).toBeGreaterThan(0);
    // O título indica a categoria ativa
    expect(screen.getByText("— Tecnologia")).toBeInTheDocument();
  });

  it("sincroniza o filtro ao chegar com a categoria na URL (navegação do menu)", () => {
    renderWithProviders(<Index />, { route: "/noticias?categoria=Tecnologia" });
    expect(screen.getByText("— Tecnologia")).toBeInTheDocument();
  });
});

describe("Contact (página de contato unificada)", () => {
  it("renderiza o formulário completo e as informações reais de contato", () => {
    renderWithProviders(<Contact />);

    expect(screen.getByRole("heading", { name: /Fale com a Rádio/i })).toBeInTheDocument();
    expect(screen.getAllByText("@webradiovitoriaa").length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Nome completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Telefone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mensagem/i)).toBeInTheDocument();
  });
});

describe("Rotas — páginas legais e 404", () => {
  it("renderiza a Política de Privacidade em /privacy-policy", () => {
    renderWithProviders(<AppRoutes />, { route: "/privacy-policy" });
    expect(
      screen.getByRole("heading", { name: /Política de Privacidade/i }),
    ).toBeInTheDocument();
  });

  it("renderiza os Termos de Serviço em /terms-of-service", () => {
    renderWithProviders(<AppRoutes />, { route: "/terms-of-service" });
    expect(screen.getByRole("heading", { name: /Termos de Serviço/i })).toBeInTheDocument();
  });

  it("exibe a página 404 para rotas inexistentes", () => {
    renderWithProviders(<AppRoutes />, { route: "/rota-que-nao-existe" });
    expect(
      screen.getByRole("heading", { name: /Página não encontrada/i }),
    ).toBeInTheDocument();
  });
});

describe("ScrollManager — âncora institucional", () => {
  it("rola até a âncora #institucional ao navegar com hash", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    render(
      <MemoryRouter initialEntries={["/#institucional"]}>
        <RadioPlayerProvider>
          <AppRoutes />
        </RadioPlayerProvider>
      </MemoryRouter>,
    );

    expect(scrollIntoView).toHaveBeenCalled();
  });
});