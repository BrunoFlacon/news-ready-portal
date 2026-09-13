import { Layout } from "@/components/Layout";
import { useState } from "react";
import { toast } from "sonner";
import {
  MapPin,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Send,
  ExternalLink,
} from "lucide-react";
import { MapView } from "@/components/Map";
import { submitContact } from "@/lib/contact";

const TUPÃ_COORDS = { lat: -21.9333, lng: -50.5167 } as const;
const GOOGLE_MAPS_LINK =
  "https://www.google.com/maps/search/?api=1&query=Av.+Tamoios%2C+Tup%C3%A3%2C+SP%2C+Brasil";
const HAS_MAPS_API_KEY = Boolean(import.meta.env.VITE_FRONTEND_FORGE_API_KEY);

const channels = [
  { icon: MapPin, label: "Endereço", value: "Av. Tamoios, Tupã, SP, Brasil" },
  {
    icon: Instagram,
    label: "Instagram",
    value: "@webradiovitoriaa",
    href: "https://instagram.com/webradiovitoriaa",
  },
  {
    icon: Youtube,
    label: "YouTube",
    value: "webradiovitoria",
    href: "https://youtube.com/@webradiovitoria",
  },
  {
    icon: Twitter,
    label: "Twitter / X",
    value: "@WebRadi0Vitoria",
    href: "https://x.com/WebRadi0Vitoria",
  },
  {
    icon: Facebook,
    label: "Facebook",
    value: "facebook.com/webradiovitoria",
    href: "https://facebook.com/webradiovitoria",
  },
];

const socials = [
  { icon: Facebook, href: "https://facebook.com/webradiovitoria", label: "Facebook" },
  { icon: Instagram, href: "https://instagram.com/webradiovitoriaa", label: "Instagram" },
  { icon: Youtube, href: "https://youtube.com/@webradiovitoria", label: "YouTube" },
  { icon: Twitter, href: "https://x.com/WebRadi0Vitoria", label: "Twitter / X" },
];

const inputClassName =
  "w-full rounded-md border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-colors";

const labelClassName = "mb-2 block text-sm font-semibold text-foreground";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    setSending(true);
    const result = await submitContact(form);
    setSending(false);
    if (result.ok) {
      toast.success(result.message);
      setForm({ name: "", email: "", phone: "", message: "" });
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Layout>
      <section className="page-band">
        <div className="container">
          {/* Cabeçalho editorial */}
          <div className="max-w-2xl">
            <p className="editorial-kicker">Contato</p>
            <h1 className="mt-3 font-serif text-4xl font-bold md:text-5xl">
              Fale com a <span className="text-brand">Rádio</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Tem alguma sugestão, dúvida ou quer participar da nossa programação?
              Envie uma mensagem e nossa equipe responderá em breve.
            </p>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            {/* Informações de contato */}
            <div className="space-y-10">
              <div>
                <h2 className="font-serif text-2xl font-bold">Informações de Contato</h2>
                <div className="mt-6 space-y-4">
                  {channels.map(({ icon: Icon, label, value, href }) => (
                    <div key={label} className="flex items-start gap-4 rounded-md border border-border bg-card p-5">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 block font-medium text-foreground transition-colors hover:text-brand"
                          >
                            {value}
                          </a>
                        ) : (
                          <p className="mt-1 font-medium text-foreground">{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Redes sociais */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Siga-nos nas redes
                </p>
                <div className="mt-4 flex gap-3">
                  {socials.map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="grid h-10 w-10 place-items-center rounded-full border border-border bg-secondary text-muted-foreground transition-colors hover:border-brand hover:bg-brand hover:text-brand-foreground"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Mapa */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Onde estamos
                </p>
                {HAS_MAPS_API_KEY ? (
                  <div className="mt-4 overflow-hidden rounded-md border border-border">
                    <MapView
                      className="h-[300px] w-full"
                      initialCenter={TUPÃ_COORDS}
                      initialZoom={15}
                    />
                  </div>
                ) : (
                  <a
                    href={GOOGLE_MAPS_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex flex-col items-center gap-3 rounded-md border border-border bg-card p-8 text-center transition-colors hover:border-brand"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-brand/15 text-brand">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-medium text-foreground">
                        Av. Tamoios, Tupã — SP
                      </span>
                      <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                        Ver no Google Maps
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </span>
                  </a>
                )}
              </div>
            </div>

            {/* Formulário */}
            <div className="rounded-md border border-border bg-card p-8">
              <h2 className="font-serif text-2xl font-bold">Envie sua mensagem</h2>
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="contact-name" className={labelClassName}>
                    Nome completo <span className="text-brand">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Seu nome"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className={labelClassName}>
                    E-mail <span className="text-brand">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="seu@email.com"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label htmlFor="contact-phone" className={labelClassName}>
                    Telefone (opcional)
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(14) 99999-9999"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className={labelClassName}>
                    Mensagem <span className="text-brand">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Escreva sua mensagem aqui..."
                    rows={5}
                    className={`${inputClassName} resize-none`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-3.5 text-sm font-bold text-brand-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-foreground/30 border-t-brand-foreground" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar Mensagem
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;