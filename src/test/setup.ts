import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// jsdom não implementa rolagem; evita "Not implemented" no console.
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});
Element.prototype.scrollIntoView = () => {};
