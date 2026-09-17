/**
 * Fase C (item 3.1) — painel do admin para administrar propagandas.
 *
 * Fluxo coberto: listagem com tipo/orientação/alvo/status, criação de campanha
 * com capa e alvo entrando imediatamente nos slots da Home (banner/intersticial),
 * pausar/reativar, remover com confirmação e métricas de impressão/clique.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { renderWithProviders } from "./utils";
import AdminAds from "@/pages/AdminAds";
import Home from "@/pages/Home";
import {
  __resetAdsCache,
  featuredAdCampaigns,
  getAdCampaigns,
  getAdMetric,
  getAdsTotals,
  pickAdCampaign,
  recordAdClick,
  recordAdImpression,
} from "@/lib/ads";

beforeEach(() => {
  window.localStorage.clear();
  __resetAdsCache();
});

describe("Admin — painel de anúncios (3.1)", () => {
  it("lista as campanhas com tipo, alvo, status e métricas", () => {
    renderWithProviders(<AdminAds />, { route: "/admin/ads" });

    expect(screen.getByTestId("admin-ads-page")).toBeInTheDocument();
    expect(screen.getAllByTestId(/^ad-row-/)).toHaveLength(3);

    // A campanha da grade é o banner "empurrado" para o hero, com alvo grade.
    const row = screen.getByTestId("ad-row-ad-grade-programacao-1");
    expect(within(row).getByText(/^Banner$/i)).toBeInTheDocument();
    expect(within(row).getByText(/Grade de programação/i)).toBeInTheDocument();
    expect(within(row).getByTestId("ad-status-ad-grade-programacao-1")).toHaveTextContent(/Ativo/i);

    // Métricas começam zeradas e são exibidas por campanha.
    expect(screen.getByTestId("ad-impressions-ad-grade-programacao-1")).toHaveTextContent("0");
    expect(screen.getByTestId("ad-clicks-ad-grade-programacao-1")).toHaveTextContent("0");
    expect(screen.getByTestId("ads-totals")).toHaveTextContent(/0 exibições/i);
  });

  it("cria um anúncio com capa e alvo: entra no topo da rotação e aparece na Home", () => {
    renderWithProviders(<AdminAds />, { route: "/admin/ads" });

    fireEvent.click(screen.getByTestId("ad-new-button"));
    fireEvent.change(screen.getByTestId("ad-form-headline"), {
      target: { value: "Campanha Relâmpago" },
    });
    fireEvent.change(screen.getByTestId("ad-form-brand"), {
      target: { value: "Marca Relâmpago" },
    });
    fireEvent.change(screen.getByTestId("ad-form-image"), {
      target: { value: "https://example.com/capa.jpg" },
    });
    fireEvent.change(screen.getByTestId("ad-form-caption"), {
      target: { value: "Oferta do dia" },
    });
    fireEvent.change(screen.getByTestId("ad-form-cta"), {
      target: { value: "Aproveitar" },
    });
    fireEvent.change(screen.getByTestId("ad-form-target"), {
      target: { value: "schedule" },
    });
    fireEvent.click(screen.getByTestId("ad-form-featured"));
    fireEvent.click(screen.getByTestId("ad-form-submit"));

    // O painel lista a campanha recém-criada.
    expect(screen.getByText("Campanha Relâmpago")).toBeInTheDocument();

    // Persistiu com capa, alvo e destaque; e é a primeira da rotação.
    const created = getAdCampaigns().find((ad) => ad.headline === "Campanha Relâmpago");
    expect(created).toBeTruthy();
    expect(created?.image).toBe("https://example.com/capa.jpg");
    expect(created?.target).toBe("schedule");
    expect(created?.featured).toBe(true);
    expect(getAdCampaigns()[0].id).toBe(created?.id);
    expect(featuredAdCampaigns().some((ad) => ad.id === created?.id)).toBe(true);

    // E aparece imediatamente no carrossel do banner gigante da Home.
    cleanup();
    renderWithProviders(<Home />);
    const dot = screen.getByRole("button", {
      name: /Ir para publicidade: Campanha Relâmpago/i,
    });
    fireEvent.click(dot);
    expect(screen.getByText("Campanha Relâmpago")).toBeInTheDocument();
    expect(screen.getByTestId("hero-sponsored-badge")).toBeInTheDocument();
  });

  it("pausar tira a campanha dos slots e reativar devolve", () => {
    renderWithProviders(<AdminAds />, { route: "/admin/ads" });

    fireEvent.click(screen.getByTestId("ad-toggle-ad-agencia-vitrine-1"));

    expect(screen.getByTestId("ad-status-ad-agencia-vitrine-1")).toHaveTextContent(/Pausado/i);
    expect(getAdCampaigns().find((ad) => ad.id === "ad-agencia-vitrine-1")?.status).toBe("paused");
    // Fora da rotação ativa do intersticial.
    expect(
      Array.from({ length: 8 }, (_, index) => pickAdCampaign(index)?.id).includes(
        "ad-agencia-vitrine-1",
      ),
    ).toBe(false);

    fireEvent.click(screen.getByTestId("ad-toggle-ad-agencia-vitrine-1"));

    expect(screen.getByTestId("ad-status-ad-agencia-vitrine-1")).toHaveTextContent(/Ativo/i);
    expect(getAdCampaigns().find((ad) => ad.id === "ad-agencia-vitrine-1")?.status).toBe("active");
    expect(
      Array.from({ length: 8 }, (_, index) => pickAdCampaign(index)?.id),
    ).toContain("ad-agencia-vitrine-1");
  });

  it("pausar o banner patrocinado remove o slide do carrossel da Home", () => {
    // O seed tem uma única campanha `featured` (banner patrocinado).
    renderWithProviders(<AdminAds />, { route: "/admin/ads" });
    fireEvent.click(screen.getByTestId("ad-toggle-ad-grade-programacao-1"));

    cleanup();
    renderWithProviders(<Home />);
    expect(
      screen.queryAllByRole("button", { name: /Ir para publicidade:/i }),
    ).toHaveLength(0);
    expect(screen.queryByTestId("hero-sponsored-badge")).not.toBeInTheDocument();
  });

  it("remove a campanha após confirmação", () => {
    renderWithProviders(<AdminAds />, { route: "/admin/ads" });
    expect(screen.getAllByTestId(/^ad-row-/)).toHaveLength(3);

    fireEvent.click(screen.getByTestId("ad-remove-ad-agencia-vitrine-1"));
    fireEvent.click(screen.getByTestId("ad-confirm-remove"));

    expect(screen.queryByTestId("ad-row-ad-agencia-vitrine-1")).not.toBeInTheDocument();
    expect(screen.getAllByTestId(/^ad-row-/)).toHaveLength(2);
    expect(getAdCampaigns().some((ad) => ad.id === "ad-agencia-vitrine-1")).toBe(false);
  });

  it("métricas de impressão e clique incrementam e aparecem no painel", () => {
    recordAdImpression("ad-vitoria-news-1");
    recordAdImpression("ad-vitoria-news-1");
    recordAdClick("ad-vitoria-news-1");

    expect(getAdMetric("ad-vitoria-news-1")).toEqual({ impressions: 2, clicks: 1 });
    expect(getAdsTotals()).toEqual({ impressions: 2, clicks: 1 });

    renderWithProviders(<AdminAds />, { route: "/admin/ads" });
    expect(screen.getByTestId("ad-impressions-ad-vitoria-news-1")).toHaveTextContent("2");
    expect(screen.getByTestId("ad-clicks-ad-vitoria-news-1")).toHaveTextContent("1");
    expect(screen.getByTestId("ads-totals")).toHaveTextContent(/2 exibições/i);
    expect(screen.getByTestId("ads-totals")).toHaveTextContent(/1 clique/i);
  });
});
