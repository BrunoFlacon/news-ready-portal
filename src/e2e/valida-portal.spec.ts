import { test, expect, type Page } from "@playwright/test";

// ===========================================================================
// VALIDACAO real desktop/celular + interacoes (Playwright chromium real).
// O que jsdom NAO mede e aqui mede de verdade:
//   * overflow horizontal (scrollWidth > clientWidth) em desktop e celular;
//   * rail de cards VISIVEL no layout real;
//   * interacoes reais: clicar o menu de um card (descricao + datetime),
//     live mostra o pico de audiencia.
// ASCII puro de proposito: o canal corrompe acento/pt-BR, entao nada de
// caractere especial aqui. Testids lidos do componente (disco):
//   visual-cards-rail | video-card-menu | video-card-menu-description
//   video-card-menu-datetime | live-card-menu | live-card-menu-peak
// ===========================================================================

async function gotoHomeReal(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return {
      docScroll: doc.scrollWidth,
      docClient: doc.clientWidth,
      bodyScroll: body.scrollWidth,
      bodyClient: body.clientWidth,
    };
  });
  expect(
    overflow.docScroll <= overflow.docClient + 1,
    `desktop/celular: o 'html' nao pode estourar o viewport (scroll=${overflow.docScroll} > client=${overflow.docClient})`,
  ).toBeTruthy();
  expect(
    overflow.bodyScroll <= overflow.bodyClient + 1,
    `desktop/celular: o 'body' nao pode estourar o viewport (scroll=${overflow.bodyScroll} > client=${overflow.bodyClient})`,
  ).toBeTruthy();
}

// ---------------------------------------------------------------------------
// DESKTOP Chrome (1280x800)
// ---------------------------------------------------------------------------
test.describe("VALIDACAO desktop 1280x800 - Home real", () => {
  test("carrega a Home sem overflow horizontal e com o rail de cards visivel", async ({ page }) => {
    await gotoHomeReal(page);
    await expect(page.getByTestId("visual-cards-rail")).toBeVisible({ timeout: 15_000 });
    await expectNoHorizontalOverflow(page);
  });

  test("desktop: abrir o menu de um card mostra descricao + data/hora pt-BR", async ({ page }) => {
    await gotoHomeReal(page);
    await page.getByTestId("video-card-menu").first().click();
    await expect(page.getByTestId("video-card-menu-description")).toBeVisible();
    await expect(page.getByTestId("video-card-menu-datetime")).toContainText(/\d{2}\/\d{2}\/\d{4}/);
    await expect(page.getByTestId("video-card-menu-datetime")).toContainText(/\d{2}:\d{2}/);
  });

  test("desktop: o menu de LIVE mostra o pico de audiencia", async ({ page }) => {
    await gotoHomeReal(page);
    await page.getByTestId("live-card-menu").first().click();
    await expect(page.getByTestId("live-card-menu-peak")).toBeVisible();
    await expect(page.getByTestId("live-card-menu-peak")).toContainText(/pico de audi[eê]ncia/i);
    await expect(page.getByTestId("live-card-menu-peak")).toContainText(/ouvinte/i);
  });
});

// ---------------------------------------------------------------------------
// MOBILE Chrome (Pixel 7 — 390x844, touch)
// ---------------------------------------------------------------------------
test.describe("VALIDACAO mobile 390x844 - Home real", () => {
  test("celular: carrega sem overflow horizontal e com o rail de cards visivel", async ({ page }) => {
    await gotoHomeReal(page);
    await expect(page.getByTestId("visual-cards-rail")).toBeVisible({ timeout: 15_000 });
    await expectNoHorizontalOverflow(page);
  });

  test("celular: rail com card-menu proprio por toque", async ({ page }) => {
    await gotoHomeReal(page);
    await expect(page.getByTestId("visual-cards-rail")).toBeVisible({ timeout: 15_000 });
    const menus = await page.getByTestId(/-(card-menu)$/).count();
    expect(menus).toBeGreaterThanOrEqual(4, `celular: espera cards com card-menu proprio (encontrados=${menus})`);
    await page.getByTestId("video-card-menu").first().click();
    await expect(page.getByTestId("video-card-menu-description")).toBeVisible();
  });

  test("celular: o card-menu de LIVE mostra o pico de audiencia", async ({ page }) => {
    await gotoHomeReal(page);
    await page.getByTestId("live-card-menu").first().click();
    await expect(page.getByTestId("live-card-menu-peak")).toBeVisible();
    await expect(page.getByTestId("live-card-menu-peak")).toContainText(/pico de audi[eê]ncia/i);
    await expect(page.getByTestId("live-card-menu-peak")).toContainText(/ouvinte/i);
  });
});
