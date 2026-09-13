/**
 * Integração com o WhatsApp da Web Rádio Vitória.
 *
 * O número pode ser configurado via VITE_WHATSAPP_NUMBER no arquivo .env;
 * sem configuração, usa o número padrão de demonstração.
 */

/** Número do WhatsApp da rádio — configure VITE_WHATSAPP_NUMBER no .env. */
export function getWhatsAppNumber(): string {
  return (
    (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ||
    "5518999999999"
  );
}

/** URL oficial do site (base para compartilhamentos). */
export const SITE_URL = "https://brunoflacon.github.io/news-ready-portal/";

/** Monta o link wa.me com a mensagem pré-preenchida. */
export function whatsAppLink(message: string): string {
  return `https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(message)}`;
}