/**
 * Testes dos formatadores de tempo relativo usados no rodapé dos artigos:
 *  - `formatPublishedAt`: "há 20 min", "publicado hoje/ontem às HH:mm",
 *    "publicado em 26 de março de 2026 às 09:15";
 *  - `formatUpdatedAt`: "atualizado às HH:mm" (mesmo dia) ou com data;
 *  - `formatPlace`: "Vitória, ES".
 */
import { describe, expect, it } from "vitest";
import {
  formatLongDate,
  formatPlace,
  formatPublishedAt,
  formatTime,
  formatUpdatedAt,
} from "@/lib/relative-time";

// Referência fixa: 14/09/2026 (segunda-feira) às 15:30 locais.
const NOW = new Date(2026, 8, 14, 15, 30, 0);

describe("formatTime e formatLongDate", () => {
  it("formata o horário local como HH:mm", () => {
    expect(formatTime(new Date(2026, 8, 14, 9, 5))).toBe("09:05");
  });

  it("formata a data longa em pt-BR", () => {
    expect(formatLongDate(new Date(2026, 2, 26))).toBe("26 de março de 2026");
  });
});

describe("formatPublishedAt", () => {
  it("mostra 'há pouco' para menos de um minuto", () => {
    expect(formatPublishedAt("2026-09-14T15:29:45", NOW)).toBe("há pouco");
  });

  it("mostra minutos para publicações recentes", () => {
    expect(formatPublishedAt("2026-09-14T15:10:00", NOW)).toBe("há 20 min");
  });

  it("mostra 'publicado hoje às HH:mm' para o mesmo dia", () => {
    expect(formatPublishedAt("2026-09-14T07:42:00", NOW)).toBe(
      "publicado hoje às 07:42",
    );
  });

  it("mostra 'publicado ontem às HH:mm' para o dia anterior", () => {
    expect(formatPublishedAt("2026-09-13T12:45:00", NOW)).toBe(
      "publicado ontem às 12:45",
    );
  });

  it("mostra a data completa para publicações antigas", () => {
    expect(formatPublishedAt("2026-03-26T09:15:00", NOW)).toBe(
      "publicado em 26 de março de 2026 às 09:15",
    );
  });

  it("tolera data inválida", () => {
    expect(formatPublishedAt("", NOW)).toBe("publicado em data desconhecida");
  });
});

describe("formatUpdatedAt", () => {
  it("mostra 'atualizado às HH:mm' para o mesmo dia", () => {
    expect(formatUpdatedAt("2026-09-14T12:00:00", NOW)).toBe(
      "atualizado às 12:00",
    );
  });

  it("mostra a data completa quando atualizado em outro dia", () => {
    expect(formatUpdatedAt("2026-03-27T10:40:00", NOW)).toBe(
      "atualizado em 27 de março de 2026 às 10:40",
    );
  });

  it("retorna vazio para data inválida/ausente", () => {
    expect(formatUpdatedAt("", NOW)).toBe("");
  });
});

describe("formatPlace", () => {
  it("combina cidade e estado", () => {
    expect(formatPlace("Vitória", "ES")).toBe("Vitória, ES");
  });

  it("aceita apenas estado quando só ele existe", () => {
    expect(formatPlace(undefined, "ES")).toBe("ES");
  });

  it("retorna vazio sem local", () => {
    expect(formatPlace()).toBe("");
  });
});