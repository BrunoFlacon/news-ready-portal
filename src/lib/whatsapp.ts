/**
 * Integração com o WhatsApp da Web Rádio Vitória.
 *
 * O número pode ser configurado via VITE_WHATSAPP_NUMBER no arquivo .env;
 * sem configuração, usa o número oficial da rádio como padrão.
 */

/** Número do WhatsApp da rádio — configure VITE_WHATSAPP_NUMBER no .env. */
export function getWhatsAppNumber(): string {
  return (
    (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ||
    "55149999256955"
  );
}

/** URL oficial do site (base para compartilhamentos). */
export const SITE_URL = "https://brunoflacon.github.io/news-ready-portal/";

/** Monta o link wa.me com a mensagem pré-preenchida. */
export function whatsAppLink(message: string): string {
  return `https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(message)}`;
}