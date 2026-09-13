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
  it("renderiza as seções da rádio: hero, programação, podcasts, entretenimento e institucional", () => {
    renderWithProviders(<Home />);

    // Hero da rádio (o rodapé repete a marca em heading próprio)
    expect(screen.getAllByRole("heading", { name: "Web Rádio Vitória" }).length).toBeGreaterThan(0);

    // Programação + podcasts
    expect(screen.getByRole("heading", { name: /Programação/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Podcasts" })).toBeInTheDocument();

    // Entretenimento: reels + stories
    expect(screen.getByRole("heading", { name: /Reels e stories/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Reels da redação/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Stories em destaque/i })).toBeInTheDocument();

    // Vídeos
    expect(screen.getByRole("heading", { name: /Vídeos e cortes de lives/i })).toBeInTheDocument();

    // Área institucional integrada
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

  it("expõe os acessos para Vitória News, institucional e contato (sem item Contato no menu)", () => {
    renderWithProviders(<Home />);

    const vitoriaNewsLinks = screen.getAllByRole("link", { name: "Vitória News" });
    expect(vitoriaNewsLinks.length).toBeGreaterThan(0);
    expect(vitoriaNewsLinks[0]).toHaveAttribute("href", "/noticias");

    expect(screen.getByRole("link", { name: "Institucional" })).toHaveAttribute(
      "href",
      "/#institucional",
    );

    // O menu principal não tem mais o item "Contato" — ele foi substituído
    // pelo botão "Fale conosco" no topo do site.
    const navigation = screen.getByRole("navigation", { name: /Navegação principal/i });
    expect(within(navigation).queryByRole("link", { name: "Contato" })).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Fale conosco/i })[0],
    ).toHaveAttribute("href", "/contato");
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