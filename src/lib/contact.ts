/**
 * Envio real do formulário de contato.
 *
 * - Se `VITE_CONTACT_ENDPOINT` estiver configurado (Formspree, Webhook,
 *   WhatsApp API, etc.), faz um POST JSON com timeout de 10s e retorna o
 *   resultado da chamada.
 * - Caso contrário, opera em "modo demonstração": simula a latência da rede
 *   e retorna sucesso, avisando no console que o endpoint deve ser configurado.
 *
 * Payload enviado: { name, email, phone, message }
 */

export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface ContactResult {
  ok: boolean;
  demo: boolean;
  message: string;
}

const REQUEST_TIMEOUT_MS = 10_000;

export async function submitContact(
  payload: ContactPayload,
): Promise<ContactResult> {
  const isValid =
    payload.name.trim() &&
    payload.email.trim() &&
    payload.message.trim();

  if (!isValid) {
    return {
      ok: false,
      demo: false,
      message: "Por favor, preencha todos os campos obrigatórios.",
    };
  }

  // Lido em runtime para permitir configuração/teste por ambiente.
  const endpoint = import.meta.env.VITE_CONTACT_ENDPOINT;

  if (!endpoint) {
    console.warn(
      "[contact] VITE_CONTACT_ENDPOINT não configurado — modo demonstração ativo. " +
        "Configure a variável no arquivo .env para ativar o envio real.",
    );
    await new Promise((resolve) => setTimeout(resolve, 900));
    return {
      ok: true,
      demo: true,
      message: "Mensagem enviada com sucesso! Entraremos em contato em breve.",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (response.ok) {
      return {
        ok: true,
        demo: false,
        message: "Mensagem enviada com sucesso! Entraremos em contato em breve.",
      };
    }

    return {
      ok: false,
      demo: false,
      message: `Não foi possível enviar a mensagem agora (HTTP ${response.status}). Tente novamente em instantes.`,
    };
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return {
      ok: false,
      demo: false,
      message: aborted
        ? "A conexão demorou demais. Verifique sua internet e tente novamente."
        : "Falha de conexão. Verifique sua internet e tente novamente.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}