/**
 * Inicialização do Umami Analytics.
 *
 * O script só é injetado no <head> quando VITE_ANALYTICS_ENDPOINT e
 * VITE_ANALYTICS_WEBSITE_ID estão preenchidos no .env. Isso evita o 404
 * de um script vazio no index.html (a injeção é decidida em runtime, com
 * valores reais, em vez de depender da substituição de %VITE_% pelo Vite).
 */
export function initAnalytics() {
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

  if (!endpoint || !websiteId) {
    return;
  }

  if (document.querySelector(`script[data-website-id="${websiteId}"]`)) {
    return;
  }

  const script = document.createElement("script");
  script.defer = true;
  script.src = `${endpoint.replace(/\/+$/, "")}/umami`;
  script.setAttribute("data-website-id", websiteId);
  document.head.appendChild(script);
}