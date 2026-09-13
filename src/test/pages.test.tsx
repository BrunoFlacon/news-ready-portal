import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
  // jsdom não implementa scrollIntoView; limpa o mock aplicado no teste de âncora.
  delete (Element.prototype as unknown as Record<string, unknown>).scrollIntoView;
});

describe("Home (portal editorial unificado)", () => {
  it("renderiza as seções principais do layout editorial", () => {
    renderWithProviders(<Home />);

    // Banner de capa com carrossel
    expect(screen.getByText("Breaking news")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Próxima notícia/i })).toBeInTheDocument();

    // Overview editorial: programação + em alta + manchetes
    expect(screen.getByRole("heading", { name: /Programação/i })).toBeInTheDocument();
    expect(screen.getByText("O que está bombando")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Manchetes do dia/i })).toBeInTheDocument();

    // Faixas de mídia: reels, stories, vídeos
    expect(screen.getByRole("heading", { name: /Reels da redação/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Stories em destaque/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Mais notícias/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Vídeos e cortes de lives/i })).toBeInTheDocument();

    // Área institucional integrada
    expect(screen.getByText("Área institucional")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Uma voz que informa, acolhe e conecta/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tupã, SP — Brasil/i)).toBeInTheDocument();
  });

  it("expõe links de navegação para portal, contato e área institucional", () => {
    renderWithProviders(<Home />);

    expect(screen.getAllByRole("link", { name: "Notícias" })[0]).toHaveAttribute(
      "href",
      "/noticias",
    );
    expect(screen.getAllByRole("link", { name: "Institucional" })[0]).toHaveAttribute(
      "href",
      "/#institucional",
    );
    expect(screen.getAllByRole("link", { name: "Contato" })[0]).toHaveAttribute(
      "href",
      "/contato",
    );
  });
});

describe("Index (portal de notícias)", () => {
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

  it("sincroniza o filtro ao navegar pelo menu enquanto está em /noticias", () => {
    renderWithProviders(<Index />);

    // Nenhum filtro ativo inicialmente
    expect(screen.queryByText("— Tecnologia")).not.toBeInTheDocument();

    // Clicar no item "Tecnologia" do cabeçalho muda a URL (?categoria=Tecnologia)
    // e o filtro deve acompanhar mesmo sem clicar no botão da listagem.
    fireEvent.click(screen.getByRole("link", { name: "Tecnologia" }));

    expect(screen.getByText("— Tecnologia")).toBeInTheDocument();
  });

  it("respeita a categoria vinda da URL ao carregar", () => {
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