import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RadioPlayerProvider } from "@/contexts/RadioPlayerContext";

interface RenderWithProvidersOptions {
  route?: string;
}

/**
 * Helper de teste: renderiza a UI com o contexto global (player de rádio)
 * e o roteador em memória, simulando a árvore real da aplicação.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderWithProvidersOptions = {},
) {
  const { route = "/" } = options;
  return render(
    <MemoryRouter initialEntries={[route]}>
      <RadioPlayerProvider>{ui}</RadioPlayerProvider>
    </MemoryRouter>,
  );
}