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

const CONTACT_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663537524925/WyaUbNtmjegzP69poquyFv/contact_bg-guoSwTzDBxScSGbHS9FZtk.webp";

const TUPÃ_COORDS = { lat: -21.9333, lng: -50.5167 } as const;
const GOOGLE_MAPS_LINK =
  "https://www.google.com/maps/search/?api=1&query=Av.+Tamoios%2C+Tup%C3%A3%2C+SP%2C+Brasil";
const HAS_MAPS_API_KEY = Boolean(import.meta.env.VITE_FRONTEND_FORGE_API_KEY);

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
      <section
        id="contato"
        className="py-16 md:py-20 relative overflow-hidden"
        style={{
          backgroundImage: `url(${CONTACT_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[#0b1e3d]/92" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-[#c9a227] text-sm font-semibold uppercase tracking-widest mb-4" style={{ fontFamily: "'Lato', sans-serif" }}>
              <div className="w-8 h-0.5 bg-[#c9a227]" />
              Entre em Contato
              <div className="w-8 h-0.5 bg-[#c9a227]" />
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Fale com a{" "}
              <span className="text-[#c9a227] italic">Rádio</span>
            </h1>
            <div className="section-divider mx-auto mb-6" />
            <p
              className="text-white/70 max-w-xl mx-auto"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              Tem alguma sugestão, dúvida ou quer participar da nossa programação?
              Envie uma mensagem e nossa equipe responderá em breve.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
            {/* Contact Info */}
            <div>
              <h2
                className="text-2xl font-bold text-white mb-8"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Informações de Contato
              </h2>

              <div className="space-y-6">
                {[
                  {
                    icon: <MapPin className="w-5 h-5" />,
                    label: "Endereço",
                    value: "Av. Tamoios, Tupã, SP, Brasil",
                  },
                  {
                    icon: <Instagram className="w-5 h-5" />,
                    label: "Instagram",
                    value: "@webradiovitoriaa",
                  },
                  {
                    icon: <Youtube className="w-5 h-5" />,
                    label: "YouTube",
                    value: "webradiovitoria",
                  },
                  {
                    icon: <Twitter className="w-5 h-5" />,
                    label: "Twitter / X",
                    value: "@WebRadi0Vitoria",
                  },
                  {
                    icon: <Facebook className="w-5 h-5" />,
                    label: "Facebook",
                    value: "facebook.com/webradiovitoria",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#c9a227]/20 border border-[#c9a227]/40 flex items-center justify-center text-[#c9a227] flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <div
                        className="text-white/50 text-xs uppercase tracking-widest mb-1"
                        style={{ fontFamily: "'Lato', sans-serif" }}
                      >
                        {item.label}
                      </div>
                      <div
                        className="text-white font-medium"
                        style={{ fontFamily: "'Lato', sans-serif" }}
                      >
                        {item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Links */}
              <div className="mt-10">
                <p
                  className="text-white/50 text-sm mb-4 uppercase tracking-widest"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  Siga-nos nas redes
                </p>
                <div className="flex gap-3">
                  {[
                    { icon: <Facebook className="w-5 h-5" />, href: "https://facebook.com/webradiovitoria", label: "Facebook" },
                    { icon: <Instagram className="w-5 h-5" />, href: "https://instagram.com/webradiovitoriaa", label: "Instagram" },
                    { icon: <Youtube className="w-5 h-5" />, href: "https://youtube.com/@webradiovitoria", label: "YouTube" },
                    { icon: <Twitter className="w-5 h-5" />, href: "https://x.com/WebRadi0Vitoria", label: "Twitter / X" },
                  ].map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#c9a227] border border-white/20 hover:border-[#c9a227] flex items-center justify-center text-white hover:text-[#0b1e3d] transition-all duration-200"
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>

              {/* Map */}
              <div className="mt-10">
                <p
                  className="text-white/50 text-sm mb-4 uppercase tracking-widest"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  Onde estamos
                </p>
                {HAS_MAPS_API_KEY ? (
                  <div className="rounded-2xl overflow-hidden border border-white/15 shadow-lg">
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
                    className="flex flex-col items-center gap-3 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm p-8 text-center hover:bg-white/10 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#c9a227]/20 border border-[#c9a227]/40 flex items-center justify-center text-[#c9a227]">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p
                        className="text-white font-medium"
                        style={{ fontFamily: "'Lato', sans-serif" }}
                      >
                        Av. Tamoios, Tupã — SP
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-[#c9a227] text-sm font-semibold mt-1" style={{ fontFamily: "'Lato', sans-serif" }}>
                        Ver no Google Maps
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </a>
                )}
              </div>
            </div>

            {/* Form */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-white/70 text-sm mb-2"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  >
                    Nome completo <span className="text-[#c9a227]">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Seu nome"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a227] transition-colors"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-white/70 text-sm mb-2"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  >
                    E-mail <span className="text-[#c9a227]">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a227] transition-colors"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-phone"
                    className="block text-white/70 text-sm mb-2"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  >
                    Telefone (opcional)
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(14) 99999-9999"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a227] transition-colors"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-white/70 text-sm mb-2"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  >
                    Mensagem <span className="text-[#c9a227]">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Escreva sua mensagem aqui..."
                    rows={5}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a227] transition-colors resize-none"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 bg-[#c9a227] hover:bg-[#f0c040] disabled:opacity-50 text-[#0b1e3d] font-bold py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0b1e3d]/30 border-t-[#0b1e3d] rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
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