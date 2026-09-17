/**
 * Fase C (item 3.2) — painel do admin para administrar a grade de programação.
 *
 * Fluxo coberto: listagem da grade (título, tipo, horário, apresentador,
 * premium), criação/edição refletindo imediatamente na Home (seção de
 * programação + card "A seguir"), reordenação por setas e persistência.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { renderWithProviders } from "./utils";
import AdminSchedule from "@/pages/AdminSchedule";
import Home from "@/pages/Home";
import { __resetScheduleCache, getSchedule } from "@/lib/schedule";
import { nextUpcoming } from "@/data/media";

beforeEach(() => {
  window.localStorage.clear();
  __resetScheduleCache();
});

describe("Admin — painel da grade de programação (3.2)", () => {
  it("lista a grade com tipo, horário, apresentador e premium", () => {
    renderWithProviders(<AdminSchedule />, { route: "/admin/schedule" });

    expect(screen.getByTestId("admin-schedule-page")).toBeInTheDocument();
    expect(screen.getAllByTestId(/^schedule-row-/)).toHaveLength(6);

    const first = screen.getByTestId("schedule-row-sch-1");
    expect(within(first).getByText("Culto de adoração ao vivo")).toBeInTheDocument();
    // O badge de tipo usa âncora para não casar o "ao vivo" do título acima.
    expect(within(first).getByText(/^Ao vivo$/i)).toBeInTheDocument();
    expect(within(first).getByText(/Domingo • 19h/)).toBeInTheDocument();

    // Linhas premium são marcadas no painel.
    expect(screen.getByTestId("schedule-premium-sch-5")).toHaveTextContent(/Premium/i);
  });

  it("editar o horário de um programa reflete na grade e no card 'A seguir' da Home", () => {
    renderWithProviders(<AdminSchedule />, { route: "/admin/schedule" });

    fireEvent.click(screen.getByTestId("schedule-edit-sch-2"));
    fireEvent.change(screen.getByTestId("schedule-form-time"), { target: { value: "6h30" } });
    fireEvent.change(screen.getByTestId("schedule-form-day"), {
      target: { value: "Segunda a sábado" },
    });
    fireEvent.click(screen.getByTestId("schedule-form-submit"));

    expect(within(screen.getByTestId("schedule-row-sch-2")).getByText(/6h30/)).toBeInTheDocument();
    expect(getSchedule().find((entry) => entry.id === "sch-2")?.time).toBe("6h30");

    // Na Home, a seção de programação mostra o horário atualizado.
    cleanup();
    renderWithProviders(<Home />);
    const grid = screen.getByTestId("schedule-grid");
    expect(within(grid).getByText(/6h30/)).toBeInTheDocument();
  });

  it("adicionar um programa novo mostra na seção de programação e no card 'A seguir'", () => {
    renderWithProviders(<AdminSchedule />, { route: "/admin/schedule" });

    fireEvent.click(screen.getByTestId("schedule-new-button"));
    fireEvent.change(screen.getByTestId("schedule-form-title"), {
      target: { value: "Madrugada de louvor" },
    });
    fireEvent.change(screen.getByTestId("schedule-form-host"), {
      target: { value: "Padre João" },
    });
    fireEvent.change(screen.getByTestId("schedule-form-day"), { target: { value: "Sexta" } });
    fireEvent.change(screen.getByTestId("schedule-form-time"), { target: { value: "23h" } });
    fireEvent.change(screen.getByTestId("schedule-form-kind"), { target: { value: "program" } });
    fireEvent.click(screen.getByTestId("schedule-form-submit"));

    // Painel: o novo programa entra no topo da grade.
    expect(screen.getByText("Madrugada de louvor")).toBeInTheDocument();
    expect(getSchedule()[0].title).toBe("Madrugada de louvor");

    // Home: aparece na grade de programação e é o próximo do card "A seguir".
    cleanup();
    renderWithProviders(<Home />);
    const grid = screen.getByTestId("schedule-grid");
    expect(within(grid).getByRole("button", { name: /Madrugada de louvor/i })).toBeInTheDocument();
    expect(nextUpcoming(null, getSchedule())?.title).toBe("Madrugada de louvor");
  });

  it("persiste a grade editada ao recarregar e permite restaurar o seed", () => {
    renderWithProviders(<AdminSchedule />, { route: "/admin/schedule" });

    fireEvent.click(screen.getByTestId("schedule-edit-sch-3"));
    fireEvent.change(screen.getByTestId("schedule-form-title"), {
      target: { value: "Podcast: Fé e informação" },
    });
    fireEvent.click(screen.getByTestId("schedule-form-submit"));

    // Recarrega o painel: a edição persiste no localStorage.
    cleanup();
    __resetScheduleCache();
    renderWithProviders(<AdminSchedule />, { route: "/admin/schedule" });
    expect(screen.getByText("Podcast: Fé e informação")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("schedule-reset"));
    expect(screen.getByText("Podcast: Fé e informação (prévia)")).toBeInTheDocument();
    expect(getSchedule().find((entry) => entry.id === "sch-3")?.title).toBe(
      "Podcast: Fé e informação (prévia)",
    );
  });

  it("reordena a grade pelas setas, refletindo na lista do painel", () => {
    renderWithProviders(<AdminSchedule />, { route: "/admin/schedule" });

    // A seta "subir" da segunda linha troca com a primeira.
    expect(screen.getByTestId("schedule-move-up-sch-1")).toBeDisabled();
    fireEvent.click(screen.getByTestId("schedule-move-up-sch-2"));

    expect(getSchedule().map((entry) => entry.id).slice(0, 2)).toEqual(["sch-2", "sch-1"]);
    const rows = screen.getAllByTestId(/^schedule-row-/);
    expect(within(rows[0]).getByText("Programa da manhã")).toBeInTheDocument();
    expect(screen.getByTestId("schedule-move-up-sch-2")).toBeDisabled();

    // E descer devolve à posição original.
    fireEvent.click(screen.getByTestId("schedule-move-down-sch-2"));
    expect(getSchedule().map((entry) => entry.id).slice(0, 2)).toEqual(["sch-1", "sch-2"]);
  });
});
