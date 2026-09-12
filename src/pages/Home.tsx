/**
 * Web Rádio Vitória — Landing Page
 * Design: "Celestial Signal" — Spiritual Tech
 * Colors: Deep Royal Blue (#0b1e3d) + Luminous Gold (#c9a227)
 * Typography: Playfair Display (headings) + Lato (body)
 * Sections: Hero, About, Services, Testimonials, Contact, Footer
 *
 * Portado de BrunoFlacon/landpagewebradiovitoria (fonte única: news-ready-portal).
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Radio,
  Newspaper,
  Heart,
  Globe,
  Mic,
  Users,
  Clock,
  MapPin,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  ChevronDown,
  Star,
  Play,
  Volume2,
  Send,
  Menu,
  X,
} from "lucide-react";
import {
  useRadioPlayer,
  RadioPlayerBar,
  ListenNowButton,
} from "@/components/RadioPlayer";
import { submitContact } from "@/lib/contact";

// ─── Asset URLs ────────────────────────────────────────────────────────────────
const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663537524925/WyaUbNtmjegzP69poquyFv/hero_bg-iKvXxxDN2aszo5gF663RwH.webp";
const ABOUT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663537524925/WyaUbNtmjegzP69poquyFv/about_section-GzvJS3t4GNMqHFnJjuDTRq.webp";
const NEWS_CARD_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663537524925/WyaUbNtmjegzP69poquyFv/news_card-EbDLF88BcG3YS3rBS9y4vF.webp";
const FAITH_CARD_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663537524925/WyaUbNtmjegzP69poquyFv/faith_card-YBnqtCzd9y5E5eabuMsJHT.webp";
const CONTACT_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663537524925/WyaUbNtmjegzP69poquyFv/contact_bg-guoSwTzDBxScSGbHS9FZtk.webp";

// ─── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Início", href: "#hero" },
    { label: "Sobre", href: "#sobre" },
    { label: "Serviços", href: "#servicos" },
    { label: "Depoimentos", href: "#depoimentos" },
    { label: "Contato", href: "#contato" },
  ];

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0b1e3d]/95 backdrop-blur-md shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <button
          onClick={() => scrollTo("#hero")}
          className="flex items-center gap-3 group"
        >
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a227] to-[#f0c040] flex items-center justify-center shadow-lg">
            <Radio className="w-5 h-5 text-[#0b1e3d]" />
          </div>
          <div className="text-left">
            <div
              className="text-white font-bold text-sm leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Web Rádio
            </div>
            <div className="text-[#c9a227] font-bold text-lg leading-tight tracking-wide"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Vitória
            </div>
          </div>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="text-white/80 hover:text-[#c9a227] text-sm font-medium transition-colors duration-200 relative group"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#c9a227] transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
          <a
            href="/noticias"
            className="text-white/80 hover:text-[#c9a227] text-sm font-medium transition-colors duration-200 relative group"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            Notícias
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#c9a227] transition-all duration-300 group-hover:w-full" />
          </a>
          <a
            href="/contato"
            className="bg-[#c9a227] hover:bg-[#f0c040] text-[#0b1e3d] font-bold text-sm px-5 py-2 rounded-full transition-all duration-200 shadow-md hover:shadow-lg"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            Fale Conosco
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0b1e3d]/98 backdrop-blur-md border-t border-white/10">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="text-white/80 hover:text-[#c9a227] text-base font-medium py-2 text-left transition-colors"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                {link.label}
              </button>
            ))}
            <a
              href="/noticias"
              className="text-white/80 hover:text-[#c9a227] text-base font-medium py-2 text-left transition-colors"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              Notícias
            </a>
            <a
              href="/contato"
              className="bg-[#c9a227] text-[#0b1e3d] font-bold text-sm px-5 py-3 rounded-full mt-2 text-center"
            >
              Fale Conosco
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero Section ──────────────────────────────────────────────────────────────
interface HeroSectionProps {
  streamUrl: string;
  onListen: () => void;
}

function HeroSection({ streamUrl, onListen }: HeroSectionProps) {
  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        backgroundImage: `url(${HERO_BG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b1e3d]/90 via-[#0b1e3d]/75 to-[#0b1e3d]/40" />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 pt-20">
        <div className="max-w-2xl">
          {/* Live Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white/90 text-sm font-semibold tracking-wide" style={{ fontFamily: "'Lato', sans-serif" }}>
              AO VIVO — 24 HORAS NO AR
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-5xl md:text-7xl font-bold text-white leading-tight mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Web Rádio{" "}
            <span className="text-[#c9a227] italic">Vitória</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-xl md:text-2xl text-white/80 font-light mb-3 italic"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            24 hs Adorando a Deus
          </p>

          {/* Description */}
          <p
            className="text-base md:text-lg text-white/70 mb-8 leading-relaxed max-w-xl"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            Site de notícias e informação que zela pela verdade dos fatos.
            Transmitindo fé, esperança e informação de qualidade para todo o Brasil.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mb-10">
            {[
              { value: "29K", label: "Seguidores" },
              { value: "24h", label: "No ar" },
              { value: "Tupã", label: "SP, Brasil" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div
                  className="text-2xl font-bold text-[#c9a227]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-white/60 text-xs uppercase tracking-widest"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            <ListenNowButton streamUrl={streamUrl} onOpen={onListen} />
            <button
              onClick={() => scrollTo("#sobre")}
              className="flex items-center gap-2 border-2 border-white/40 hover:border-[#c9a227] text-white hover:text-[#c9a227] font-semibold px-8 py-4 rounded-full transition-all duration-200 backdrop-blur-sm"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              <ChevronDown className="w-4 h-4" />
              Conheça a Rádio
            </button>
            <a
              href="/contato"
              className="flex items-center gap-2 border-2 border-white/40 hover:border-[#c9a227] text-white hover:text-[#c9a227] font-semibold px-8 py-4 rounded-full transition-all duration-200 backdrop-blur-sm"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              <Send className="w-4 h-4" />
              Fale Conosco
            </a>
          </div>
        </div>
      </div>

      {/* Wave Visualizer Decoration */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1 pb-8 opacity-30">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="wave-bar bg-[#c9a227] rounded-full"
            style={{
              width: "3px",
              height: `${Math.random() * 40 + 10}px`,
              animationDelay: `${i * 0.05}s`,
              animationDuration: `${0.8 + Math.random() * 0.8}s`,
            }}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={() => scrollTo("#sobre")}
        className="absolute bottom-8 right-8 text-white/50 hover:text-[#c9a227] transition-colors animate-bounce"
      >
        <ChevronDown className="w-8 h-8" />
      </button>
    </section>
  );
}

// ─── About Section ─────────────────────────────────────────────────────────────
function AboutSection() {
  return (
    <section id="sobre" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="relative order-2 md:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={ABOUT_IMG}
                alt="Estúdio da Web Rádio Vitória"
                className="w-full h-[450px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1e3d]/60 to-transparent" />
              {/* Floating card */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0b1e3d] flex items-center justify-center flex-shrink-0">
                    <Volume2 className="w-5 h-5 text-[#c9a227]" />
                  </div>
                  <div>
                    <div className="text-[#0b1e3d] font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Transmissão ao Vivo
                    </div>
                    <div className="text-gray-500 text-xs" style={{ fontFamily: "'Lato', sans-serif" }}>
                      24 horas por dia, 7 dias por semana
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="wave-bar bg-[#c9a227] rounded-full"
                        style={{
                          width: "3px",
                          height: `${8 + i * 3}px`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative element */}
            <div className="absolute -top-4 -left-4 w-24 h-24 border-4 border-[#c9a227] rounded-2xl opacity-30" />
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-[#c9a227] rounded-xl opacity-20" />
          </div>

          {/* Content */}
          <div className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 text-[#c9a227] text-sm font-semibold uppercase tracking-widest mb-4" style={{ fontFamily: "'Lato', sans-serif" }}>
              <div className="w-8 h-0.5 bg-[#c9a227]" />
              Nossa História
            </div>
            <h2
              className="text-4xl md:text-5xl font-bold text-[#0b1e3d] leading-tight mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Uma Voz que{" "}
              <span className="text-[#c9a227] italic">Transforma</span>
            </h2>
            <div className="section-divider mb-8" />
            <p
              className="text-gray-600 text-lg leading-relaxed mb-6"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              A <strong>Web Rádio Vitória</strong> nasceu com um propósito claro: ser um canal de notícias e informação que zela pela verdade dos fatos, unindo jornalismo responsável com uma mensagem de fé e esperança.
            </p>
            <p
              className="text-gray-600 leading-relaxed mb-8"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              Sediada em <strong>Tupã, SP</strong>, nossa rádio transmite 24 horas por dia, adorando a Deus e levando conteúdo de qualidade para mais de <strong>29 mil seguidores</strong> em todo o Brasil. Somos um veículo independente, comprometido com a verdade e com o bem-estar da nossa comunidade.
            </p>

            {/* Values */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Heart className="w-5 h-5" />, label: "Fé e Esperança" },
                { icon: <Newspaper className="w-5 h-5" />, label: "Jornalismo Verdadeiro" },
                { icon: <Globe className="w-5 h-5" />, label: "Alcance Nacional" },
                { icon: <Clock className="w-5 h-5" />, label: "24h no Ar" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#f8f9ff] border border-[#e8eaf6]"
                >
                  <div className="text-[#c9a227]">{item.icon}</div>
                  <span className="text-[#0b1e3d] font-semibold text-sm" style={{ fontFamily: "'Lato', sans-serif" }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Services Section ──────────────────────────────────────────────────────────
function ServicesSection() {
  const services = [
    {
      icon: <Radio className="w-8 h-8" />,
      title: "Rádio Online 24h",
      description:
        "Transmissão ao vivo ininterrupta com música, adoração e programação especial. Acesse de qualquer dispositivo, a qualquer hora.",
      image: null,
      color: "from-[#0b1e3d] to-[#1a3a6b]",
    },
    {
      icon: <Newspaper className="w-8 h-8" />,
      title: "Notícias & Informação",
      description:
        "Cobertura jornalística independente com foco na verdade dos fatos. Política, esportes, cultura e muito mais.",
      image: NEWS_CARD_IMG,
      color: "from-[#1a3a6b] to-[#0b1e3d]",
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Conteúdo Espiritual",
      description:
        "Mensagens de fé, esperança e adoração que transformam vidas. Programação cristã de qualidade para toda a família.",
      image: FAITH_CARD_IMG,
      color: "from-[#0b1e3d] to-[#0d2240]",
    },
    {
      icon: <Mic className="w-8 h-8" />,
      title: "Programas ao Vivo",
      description:
        "Debates, entrevistas e programas especiais com apresentadores experientes e convidados de destaque.",
      image: null,
      color: "from-[#0d2240] to-[#0b1e3d]",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Alcance Nacional",
      description:
        "Presente em todo o Brasil através da internet, com mais de 29 mil seguidores e crescendo a cada dia.",
      image: null,
      color: "from-[#1a3a6b] to-[#0b1e3d]",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Comunidade Ativa",
      description:
        "Uma comunidade engajada nas redes sociais, com interação constante e participação do público nas transmissões.",
      image: null,
      color: "from-[#0b1e3d] to-[#1a3a6b]",
    },
  ];

  return (
    <section id="servicos" className="py-24 bg-[#f8f9ff]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-[#c9a227] text-sm font-semibold uppercase tracking-widest mb-4" style={{ fontFamily: "'Lato', sans-serif" }}>
            <div className="w-8 h-0.5 bg-[#c9a227]" />
            O Que Fazemos
            <div className="w-8 h-0.5 bg-[#c9a227]" />
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-[#0b1e3d] mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Nossos <span className="text-[#c9a227] italic">Serviços</span>
          </h2>
          <div className="section-divider mx-auto mb-6" />
          <p
            className="text-gray-600 max-w-2xl mx-auto text-lg"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            Muito além de uma rádio — somos um veículo de comunicação completo,
            unindo fé, informação e entretenimento de qualidade.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <div
              key={service.title}
              className="service-card bg-white rounded-2xl overflow-hidden shadow-sm"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {service.image ? (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-b ${service.color} opacity-70`} />
                  <div className="absolute top-4 left-4 text-[#c9a227]">
                    {service.icon}
                  </div>
                </div>
              ) : (
                <div className={`h-32 bg-gradient-to-br ${service.color} flex items-center justify-center`}>
                  <div className="text-[#c9a227] opacity-80">{service.icon}</div>
                </div>
              )}
              <div className="p-6">
                <h3
                  className="text-xl font-bold text-[#0b1e3d] mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {service.title}
                </h3>
                <p
                  className="text-gray-600 text-sm leading-relaxed"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  {service.description}
                </p>
                <a href="/noticias" className="mt-4 flex items-center gap-2 text-[#c9a227] text-sm font-semibold group cursor-pointer" style={{ fontFamily: "'Lato', sans-serif" }}>
                  Saiba mais
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials Section ──────────────────────────────────────────────────────
function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sardinha Carvalho",
      role: "Ouvinte fiel",
      comment:
        "A Web Rádio Vitória é uma fonte confiável de informação. Sempre atualizada e com conteúdo de qualidade. Recomendo a todos!",
      rating: 5,
      avatar: "SC",
    },
    {
      name: "Maria das Graças",
      role: "Seguidora desde 2020",
      comment:
        "Que bênção ter uma rádio que alia notícias verdadeiras com mensagens de fé. Ouço todos os dias e me sinto mais informada e espiritualmente fortalecida.",
      rating: 5,
      avatar: "MG",
    },
    {
      name: "João Paulo Silva",
      role: "Ouvinte de Tupã, SP",
      comment:
        "A rádio local que representa nossa cidade com orgulho. Sempre trazendo o que acontece em Tupã e na região com seriedade e comprometimento.",
      rating: 5,
      avatar: "JP",
    },
    {
      name: "Ana Beatriz Costa",
      role: "Fã da programação",
      comment:
        "Os programas ao vivo são incríveis! A interação com os ouvintes é muito boa. Sinto que faço parte de uma comunidade especial.",
      rating: 5,
      avatar: "AB",
    },
  ];

  return (
    <section id="depoimentos" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-[#c9a227] text-sm font-semibold uppercase tracking-widest mb-4" style={{ fontFamily: "'Lato', sans-serif" }}>
            <div className="w-8 h-0.5 bg-[#c9a227]" />
            Prova Social
            <div className="w-8 h-0.5 bg-[#c9a227]" />
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-[#0b1e3d] mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            O Que Dizem Nossos{" "}
            <span className="text-[#c9a227] italic">Ouvintes</span>
          </h2>
          <div className="section-divider mx-auto mb-6" />
          <p
            className="text-gray-600 max-w-xl mx-auto"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            A opinião de quem nos acompanha todos os dias é o que nos motiva a continuar.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-16 max-w-2xl mx-auto">
          {[
            { value: "29K+", label: "Seguidores" },
            { value: "5★", label: "Avaliação" },
            { value: "24h", label: "No ar" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-6 bg-[#0b1e3d] rounded-2xl"
            >
              <div
                className="text-3xl font-bold text-[#c9a227]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {stat.value}
              </div>
              <div
                className="text-white/60 text-xs uppercase tracking-widest mt-1"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="testimonial-card bg-[#f8f9ff] rounded-2xl p-6 border border-[#e8eaf6]"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-[#c9a227] text-[#c9a227]" />
                ))}
              </div>
              {/* Quote */}
              <p
                className="text-gray-700 leading-relaxed mb-6 italic"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                "{t.comment}"
              </p>
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0b1e3d] flex items-center justify-center text-[#c9a227] font-bold text-sm flex-shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <div
                    className="text-[#0b1e3d] font-bold text-sm"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  >
                    {t.name}
                  </div>
                  <div
                    className="text-gray-500 text-xs"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  >
                    {t.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Contact Section ───────────────────────────────────────────────────────────
function ContactSection() {
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
    <section
      id="contato"
      className="py-24 relative overflow-hidden"
      style={{
        backgroundImage: `url(${CONTACT_BG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[#0b1e3d]/92" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-[#c9a227] text-sm font-semibold uppercase tracking-widest mb-4" style={{ fontFamily: "'Lato', sans-serif" }}>
            <div className="w-8 h-0.5 bg-[#c9a227]" />
            Entre em Contato
            <div className="w-8 h-0.5 bg-[#c9a227]" />
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Fale com a{" "}
            <span className="text-[#c9a227] italic">Rádio</span>
          </h2>
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
            <h3
              className="text-2xl font-bold text-white mb-8"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Informações de Contato
            </h3>

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
          </div>

          {/* Form */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  className="block text-white/70 text-sm mb-2"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  Nome completo <span className="text-[#c9a227]">*</span>
                </label>
                <input
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
                  className="block text-white/70 text-sm mb-2"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  E-mail <span className="text-[#c9a227]">*</span>
                </label>
                <input
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
                  className="block text-white/70 text-sm mb-2"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  Telefone (opcional)
                </label>
                <input
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
                  className="block text-white/70 text-sm mb-2"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  Mensagem <span className="text-[#c9a227]">*</span>
                </label>
                <textarea
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
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-[#060f1e] py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a227] to-[#f0c040] flex items-center justify-center">
                <Radio className="w-5 h-5 text-[#0b1e3d]" />
              </div>
              <div>
                <div className="text-white font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Web Rádio
                </div>
                <div className="text-[#c9a227] font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Vitória
                </div>
              </div>
            </div>
            <p className="text-white/50 text-sm leading-relaxed" style={{ fontFamily: "'Lato', sans-serif" }}>
              Site de notícias e informação que zela pela verdade dos fatos. Tupã, SP — Brasil.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest" style={{ fontFamily: "'Lato', sans-serif" }}>
              Navegação
            </h4>
            <div className="space-y-2">
              {[
                { label: "Início", href: "#hero" },
                { label: "Sobre", href: "#sobre" },
                { label: "Serviços", href: "#servicos" },
                { label: "Depoimentos", href: "#depoimentos" },
                { label: "Contato", href: "#contato" },
              ].map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="block text-white/50 hover:text-[#c9a227] text-sm transition-colors"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  {link.label}
                </button>
              ))}
            </div>
            <div className="space-y-2 mt-4">
              <a href="/noticias" className="block text-white/50 hover:text-[#c9a227] text-sm transition-colors" style={{ fontFamily: "'Lato', sans-serif" }}>
                Notícias
              </a>
              <a href="/privacy-policy" className="block text-white/50 hover:text-[#c9a227] text-sm transition-colors" style={{ fontFamily: "'Lato', sans-serif" }}>
                Política de Privacidade
              </a>
              <a href="/terms-of-service" className="block text-white/50 hover:text-[#c9a227] text-sm transition-colors" style={{ fontFamily: "'Lato', sans-serif" }}>
                Termos de Serviço
              </a>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest" style={{ fontFamily: "'Lato', sans-serif" }}>
              Redes Sociais
            </h4>
            <div className="space-y-3">
              {[
                { icon: <Facebook className="w-4 h-4" />, label: "Facebook", href: "https://facebook.com/webradiovitoria" },
                { icon: <Instagram className="w-4 h-4" />, label: "@webradiovitoriaa", href: "https://instagram.com/webradiovitoriaa" },
                { icon: <Youtube className="w-4 h-4" />, label: "YouTube", href: "https://youtube.com/@webradiovitoria" },
                { icon: <Twitter className="w-4 h-4" />, label: "@WebRadi0Vitoria", href: "https://x.com/WebRadi0Vitoria" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-white/50 hover:text-[#c9a227] text-sm transition-colors group"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  <span className="text-[#c9a227]/50 group-hover:text-[#c9a227]">{social.icon}</span>
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs" style={{ fontFamily: "'Lato', sans-serif" }}>
            © 2024 Web Rádio Vitória. Todos os direitos reservados.
          </p>
          <p className="text-white/30 text-xs" style={{ fontFamily: "'Lato', sans-serif" }}>
            Tupã, SP — Brasil · 24 hs Adorando a Deus
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const radio = useRadioPlayer();

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection streamUrl={radio.streamUrl} onListen={radio.openPlayer} />
      <AboutSection />
      <ServicesSection />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
      <RadioPlayerBar
        url={radio.streamUrl}
        open={radio.open}
        playing={radio.playing}
        error={radio.error}
        togglePlay={radio.togglePlay}
        closePlayer={radio.closePlayer}
        audioRef={radio.audioRef}
      />
    </div>
  );
}