import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "./utils";
import { Home } from "@/pages/Home";
import { RadioPlayer } from "@/components/RadioPlayer";
import { breakingVisuals, schedule, type ScheduleEntry } from "@/data/media";
import {
  breakingLatest,
  dismissAlert,
  markAlertRead,
  pendingBreaking,
  remindStreakEntry,
  scheduledBreaking,
  useAlerts,
} from "@/lib/alerts";
import {
  __resetAudioAlertCache,
  playAlertSound,
} from "@/lib/audio-alert";

/**
 * Fase D — alertas de estreia com som discreto (4.1) e breaking news com som
 * de emergencia e tarja (4.2). Contrato em
 * docs/PLANO-PROPAGANDAS-GRADE-ALERTAS.md, itens 4.1/4.2:
 * - 4.1: agendar o "Lembrar-me" de uma estreia agendada -> na hora marcada
 *   aparece o alerta (toast + sino com badge) e toca o som discreto UMA vez;
 *   tocar no alerta abre a materia/player.
 * - 4.2: conteudo marcado `breaking: true` -> tarja vermelha pulsante no topo
 *   do banner (desktop) e na borda inferior da barra do player (mobile) com
 *   "Urgente / Aconteceu Agora / Breaking News", som de emergencia UMA vez
 *   respeitando mute/volume e a opcao "sem som" do editor; clicar abre a
 *   materia/player.
 */

/** Espiona o construtor global `Audio` para registrar os sons (web radio). */
const audioSpies: ReturnType<typeof vi.spyOn>[] = [];
const playedUrls: string[] = [];

function mockAlertAudio() {
  const play = vi.fn().mockResolvedValue(undefined);
  const ctor = vi.fn(function Audio(this: HTMLAudioElement, url?: string) {
    if (url) {
      playedUrls.push(url);
    }
    Object.defineProperty(this, "play", {
      value: () => play(),
    });
    Object.defineProperty(this, "volume", { writable: true, value: 1 });
    Object.defineProperty(this, "muted", { writable: true, value: false });
    return this;
  });
  const spy = vi.spyOn(window, "Audio").mockImplementation(
    ctor as unknown as typeof Audio,
  );
  audioSpies.push(spy);
  return { play, ctor };
}

describe("Fase D — alertas de estreia e breaking news com som (4.1/4.2)", () => {
  afterEach(() => {
    for (const spy of audioSpies) {
      spy.mockRestore();
    }
    audioSpies.length = 0;
    playedUrls.length = 0;
    __resetAlertsCache();
    __resetAudioAlertCache();
  });

  it("4.1 — 'Lembrar-me' de uma estreia agendada dispara o alerta na hora marcada (toast + sino com badge + som discreto UMA vez) e tocar no alerta abre a materia/player", () => {
    const { play } = mockAlertAudio();
    const estreia = (schedule as ScheduleEntry[]).find(
      (entry) => entry.kind === "live",
    );
    expect(estreia).toBeDefined();

    renderWithProviders(<Home />, { route: "/" });

    // O sino de alerta existe na Home.
    expect(screen.getByTestId("home-alert-bell")).toBeInTheDocument();

    // Agenda o "Lembrar-me" da primeira estreia da grade.
    act(() => {
      remindStreakEntry(estreia as ScheduleEntry);
    });

    // Alerta disparou: toast + badge no sino + som discreto tocou UMA vez.
    expect(screen.getByTestId("home-alert-toast")).toBeInTheDocument();
    expect(screen.getByTestId("home-alert-badge")).toHaveTextContent(/\d+/);
    expect(play).toHaveBeenCalledTimes(1);

    // Tocar no alerta abre a materia/player.
    fireEvent.click(screen.getByTestId("home-alert-toast"));
    expect(screen.getByTestId("home-alert-player")).toBeInTheDocument();
  });

  it("4.2 — conteudo breaking mostra tarja vermelha pulsante no topo do banner (desktop) com som de emergencia UMA vez e clique abre a materia/player", () => {
    const { play } = mockAlertAudio();
    const breaking = (breakingVisuals as unknown[]).find(
      (item: { breaking?: boolean }) => item?.breaking,
    );
    // Se o seed ainda nao tem breaking, o editor aciona via pendingBreaking.
    act(() => {
      pendingBreaking(breaking?.id ?? "brk-1");
    });

    renderWithProviders(<Home />, { route: "/" });

    // Tarja vermelha pulsante no topo do banner gigante (desktop).
    expect(screen.getByTestId("home-breaking-ticker")).toBeInTheDocument();
    expect(screen.getByTestId("home-breaking-ticker")).toHaveTextContent(
      /Urgente|Aconteceu Agora|Breaking News/i,
    );
    // Som de emergencia tocou UMA vez.
    expect(play).toHaveBeenCalledTimes(1);

    // Clicar na tarja abre a materia/player.
    fireEvent.click(screen.getByTestId("home-breaking-ticker"));
    expect(screen.getByTestId("home-alert-player")).toBeInTheDocument();
  });

  it("4.2b — em mobile, a tarja de breaking fica na borda inferior da barra do player e o som respeita o mute global", () => {
    const { play } = mockAlertAudio();
    renderWithProviders(<RadioPlayer />, { route: "/" });

    act(() => {
      pendingBreaking("brk-2");
    });

    // Tarja na borda inferior da barra principal (mobile).
    expect(screen.getByTestId("player-breaking-bar")).toBeInTheDocument();
    expect(screen.getByTestId("player-breaking-bar")).toHaveTextContent(
      /Urgente|Aconteceu Agora|Breaking News/i,
    );
    expect(play).toHaveBeenCalledTimes(1);

    // Com mute global ligado, um novo breaking NAO toca de novo.
    fireEvent.click(screen.getByTestId("player-alert-mute"));
    act(() => {
      pendingBreaking("brk-3");
    });
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("4.2c — playAlertSound respeita o volume e a opcao 'sem som' do editor (muted) e __resetAudioAlertCache limpa o cache", () => {
    const { play } = mockAlertAudio();

    // Som de emergencia com volume.
    playAlertSound({ kind: "breaking", volume: 0.8 });
    expect(play).toHaveBeenCalledTimes(1);

    // Editor desligou o som (muted) -> nao toca de novo.
    playAlertSound({ kind: "breaking", volume: 0.8, muted: true });
    expect(play).toHaveBeenCalledTimes(1);
    expect(playedUrls).toHaveLength(1);

    // Cache limpo -> volta a tocar.
    __resetAudioAlertCache();
    playAlertSound({ kind: "breaking", volume: 0.8 });
    expect(play).toHaveBeenCalledTimes(2);
  });
});