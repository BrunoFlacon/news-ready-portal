import { Link, useLocation } from "react-router-dom";
import { Building2, Crown, Home, Menu, Play, Radio, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRadioPlayerContext } from "@/contexts/RadioPlayerContext";

const navItems = [
  { label: "Início", path: "/", icon: Home },
  { label: "Institucional", path: "/#institucional", icon: Building2 },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname, hash } = useLocation();
  const player = useRadioPlayerContext();

  // Item ativo por rota real: "Início" só sem hash; "Institucional" só com o
  // hash #institucional; a borda inferior vermelha aparece apenas no item
  // clicado/ativo — os demais ficam sem borda (transparente).
  const isNavActive = (path: string) => {
    if (path === "/#institucional") {
      return hash === "#institucional";
    }
    if (path === "/") {
      return pathname === "/" && !hash;
    }
    return pathname === path;
  };

  // "Ouça a Rádio" abre a transmissão ao vivo e o player do rodapé; sem URL
  // configurada o atalho fica indisponível (como o botão do banner).
  const canListen = Boolean(player.streamUrl);
  const isLiveOnAir =
    Boolean(player.streamUrl) && player.liveOpen && player.livePlaying;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="container flex items-center justify-between gap-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-md bg-brand text-brand-foreground shadow-brand">
            <Radio className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-background bg-live" />
          </span>
          <span className="min-w-0">
            <strong className="block truncate font-serif text-lg text-foreground">Web Rádio Vitória</strong>
            <small className="block truncate text-[10px] uppercase text-muted-foreground">DE TUPÃ PARA TODO O BRASIL</small>
          </span>
        </Link>

        <div className="relative flex items-center gap-2 lg:gap-6">
          {isLiveOnAir && (
            <span className="hidden items-center gap-2 text-xs font-semibold uppercase text-live lg:inline-flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-live" />Ao vivo
            </span>
          )}

          {/* Navegação na mesma linha do topo: menu compacto à direita no
              desktop e menu expansível no mobile — a barra separada foi
              removida para liberar espaço para o banner gigante. */}
          <nav
            aria-label="Navegação principal"
            className={cn(
              "absolute right-0 top-full z-50 mt-2 w-56 rounded-md border border-border bg-card p-2 shadow-xl lg:static lg:mt-0 lg:flex lg:w-auto lg:items-center lg:gap-6 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none",
              menuOpen ? "block" : "hidden lg:flex",
            )}
          >
            <ul className="flex flex-col lg:flex-row lg:items-center lg:gap-6">
              {navItems.map((item) => {
                const isActive = isNavActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-1.5 border-l-2 px-4 py-3 text-xs font-bold uppercase transition-colors lg:border-b-2 lg:border-l-0 lg:px-0 lg:py-1.5",
                        isActive
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground",
                      )}
                      onClick={() => setMenuOpen(false)}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              {/* "Ouça a Rádio": abre a transmissão ao vivo e o player do rodapé. */}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    player.openPlayer();
                  }}
                  disabled={!canListen}
                  aria-disabled={!canListen}
                  title={
                    canListen
                      ? "Ouvir a rádio ao vivo"
                      : "Configure VITE_RADIO_STREAM_URL no arquivo .env para liberar a transmissão"
                  }
                  className={cn(
                    "flex items-center gap-1.5 border-l-2 px-4 py-3 text-xs font-bold uppercase transition-colors lg:border-b-2 lg:border-l-0 lg:px-0 lg:py-1.5",
                    canListen
                      ? "border-transparent text-muted-foreground hover:text-foreground"
                      : "cursor-not-allowed border-transparent text-muted-foreground/50",
                  )}
                >
                  <Play className="h-3.5 w-3.5" />
                  Ouça a Rádio
                </button>
              </li>
            </ul>
          </nav>

          {/* CTA de assinatura no lugar do antigo botão "Fale conosco" — o
              contato agora vive somente no rodapé. */}
          <Button asChild size="sm">
            <Link to="/#assinatura">
              <Crown className="h-3.5 w-3.5" />
              Assine
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
    </header>
  );
}