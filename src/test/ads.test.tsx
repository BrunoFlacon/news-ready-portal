import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AdSpot, type AdCampaign, DEFAULT_SKIP_AFTER_MS } from "@/components/AdSpot";

/*
 * Onda 6 (plano propagandas/grade/alertas), subentrega 1.1 — intersticial:
 * entre o fim de um video e o proximo, um anuncio em tela cheia com
 * contagem regressiva e botao "Pular anuncio" habilitado apos 5s. O player
 * nao trava e o rail continua acessivel (o AdSpot cobre SOMENTE a area do
 * video, nao o rail vertical de cards).
 */

const sampleAd: AdCampaign = {
  id: "ad-intersticial-1",
  brand: "Agencia Vitrine",
  tagline: "Patrocinado",
  headline: "Sua marca no ar para Tupa inteira",
  caption: "Campanha de patrocinio da grade da Web Radio Vitoria.",
  image:
    "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80",
  ctaLabel: "Conhecer a agencia",
  skipAfterMs: DEFAULT_SKIP_AFTER_MS,
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AdSpot - intersticial entre videos (item 1.1)", () => {
  it("exibe capa, tarja Patrocinado, manchete e contagem regressiva", () => {
    render(<AdSpot ad={sampleAd} onSkip={() => undefined} />);

    expect(screen.getByTestId("ad-interstitial")).toBeInTheDocument();
    expect(screen.getByTestId("ad-badge")).toHaveTextContent("Patrocinado");
    expect(screen.getByTestId("ad-image")).toHaveAttribute(
      "src",
      expect.stringContaining("images.unsplash.com"),
    );
    expect(screen.getByTestId("ad-headline")).toHaveTextContent("Sua marca no ar");
    expect(screen.getByTestId("ad-caption")).toHaveTextContent(
      "Campanha de patrocinio da grade",
    );
  });

  it("mantem 'Pular anuncio' desabilitado enquanto a contagem nao termina", () => {
    render(
      <AdSpot ad={{ ...sampleAd, skipAfterMs: 5000 }} onSkip={() => undefined} />,
    );

    const skip = screen.getByTestId("ad-skip-button");
    expect(skip).toBeDisabled();
    expect(screen.getByTestId("ad-countdown")).toBeInTheDocument();

    // Antes dos 5s continua bloqueado.
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.getByTestId("ad-skip-button")).toBeDisabled();
  });

  it("habilita 'Pular anuncio' apos os 5 segundos de contagem", () => {
    render(
      <AdSpot ad={{ ...sampleAd, skipAfterMs: 5000 }} onSkip={() => undefined} />,
    );

    act(() => {
      vi.advanceTimersByTime(5100);
    });

    const skip = screen.getByTestId("ad-skip-button");
    expect(skip).toBeEnabled();
    expect(skip).toHaveTextContent("Pular anuncio");
  });

  it("clicar em 'Pular anuncio' avanca para o proximo video (onSkip)", () => {
    const onSkip = vi.fn();
    render(<AdSpot ad={{ ...sampleAd, skipAfterMs: 5000 }} onSkip={onSkip} />);

    act(() => {
      vi.advanceTimersByTime(5100);
    });
    fireEvent.click(screen.getByTestId("ad-skip-button"));

    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("se ninguem pular, o intersticial fecha sozinho apos a contagem (onComplete)", () => {
    const onComplete = vi.fn();
    render(
      <AdSpot ad={{ ...sampleAd, skipAfterMs: 5000 }} onSkip={() => undefined} onComplete={onComplete} />,
    );

    act(() => {
      vi.advanceTimersByTime(6500);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("o CTA do anuncio e clicavel e dispara o onCta", () => {
    const onCta = vi.fn();
    render(
      <AdSpot ad={{ ...sampleAd }} onSkip={() => undefined} onCta={onCta} />,
    );

    const cta = screen.getByTestId("ad-cta");
    expect(cta).toHaveTextContent("Conhecer a agencia");
    fireEvent.click(cta);
    expect(onCta).toHaveBeenCalledTimes(1);
  });
});
