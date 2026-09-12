import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "@/pages/Home";
import Index from "@/pages/Index";
import Contact from "@/pages/Contact";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("Home (landing da rádio)", () => {
  it("renderiza as seções principais da landing", () => {
    renderWithRouter(<Home />);

    expect(screen.getAllByText(/Web Rádio/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/24 hs Adorando a Deus/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /Nossos Serviços/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /O Que Dizem Nossos Ouvintes/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Enviar Mensagem/i).length).toBeGreaterThan(0);
  });

  it("expõe link para o portal de notícias", () => {
    renderWithRouter(<Home />);
    const noticias = screen.getAllByRole("link", { name: "Notícias" })[0];
    expect(noticias).toHaveAttribute("href", "/noticias");
  });
});

describe("Index (portal de notícias)", () => {
  it("renderiza a listagem de notícias e o filtro de categorias", () => {
    renderWithRouter(<Index />);

    expect(screen.getByText("Últimas Notícias")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Todas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Política" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tecnologia" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entretenimento" })).toBeInTheDocument();
  });

  it("filtra as notícias ao clicar em uma categoria", () => {
    renderWithRouter(<Index />);

    fireEvent.click(screen.getByRole("button", { name: "Tecnologia" }));

    // O herói passa a destacar artigo de Tecnologia
    expect(screen.getAllByText(/Inteligência artificial/i).length).toBeGreaterThan(0);
    // O título indica a categoria ativa
    expect(screen.getByText("— Tecnologia")).toBeInTheDocument();
  });
});

describe("Contact (página de contato unificada)", () => {
  it("renderiza o formulário completo e as informações reais de contato", () => {
    renderWithRouter(<Contact />);

    expect(screen.getByRole("heading", { name: /Fale com a Rádio/i })).toBeInTheDocument();
    expect(screen.getAllByText("@webradiovitoriaa").length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Nome completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Telefone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mensagem/i)).toBeInTheDocument();
  });
});