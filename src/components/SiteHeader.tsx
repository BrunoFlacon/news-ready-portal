import { Link, useLocation } from "react-router-dom";
import { Menu, X, Radio, Play, Headphones, Newspaper } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRadioPlayerContext } from "@/contexts/RadioPlayerContext";

const navItems = [
  { label: "Início", path: "/" },
  { label: "Vitória News", path: "/noticias" },
  { label: "Institucional", path: "/#institucional" },
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

  // O cabeçalho só oferece "Ouvir Agora" quando a transmissão está disponível
  // e nada está em reprodução — os controles de pause/retomada ficam nas
  // barras inferior e flutuante.
  const showListenButton =
    Boolean(player.streamUrl) && !player.liveOpen && !player.nowPlaying;
  const isLiveOnAir =
    Boolean(player.streamUrl) && player.liveOpen && player.livePlaying;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="container flex min-h-20 items-center justify-between gap-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-md bg-brand text-brand-foreground shadow-brand">
            <Radio className="h-5 w-5" /><span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-background bg-live" />
          </span>
          <span className="min-w-0"><strong className="block truncate font-serif text-lg text-foreground">Web Rádio Vitória</strong><small className="block truncate text-[10px] uppercase text-muted-foreground">Notícias • Informação • Fé</small></span>
        </Link>
        <div className="hidden items-center gap-3 lg:flex">
          {isLiveOnAir && (
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-live"><span className="h-2 w-2 animate-pulse rounded-full bg-live" />Ao vivo</span>
          )}
          {showListenButton && (
            <button
              type="button"
              onClick={player.openPlayer}
              className="btn-brand h-9 px-4"
            >
              <Play className="h-4 w-4 fill-current" />
              Ouvir Agora
            </button>
          )}
          <Button asChild size="sm"><Link to="/contato"><Headphones /> Fale conosco</Link></Button>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen}>
          {menuOpen ? <X /> : <Menu />}
        </Button>
      </div>
      <nav className="border-t border-border" aria-label="Navegação principal">
        <div className="container">
          <ul className={`${menuOpen ? "flex" : "hidden"} flex-col lg:flex lg:flex-row lg:items-center`}>
            {navItems.map((item) => {
              const isActive = isNavActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "block border-l-2 px-4 py-3 text-xs font-bold uppercase transition-colors lg:border-b-2 lg:border-l-0",
                      isActive
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label === "Vitória News" ? (
                      <span className="inline-flex items-center gap-1.5"><Newspaper className="h-3.5 w-3.5" />{item.label}</span>
                    ) : (
                      item.label
                    )}
                  </Link>
                </li>
              );
            })}
            <li className="lg:hidden">
              <Link
                to="/contato"
                onClick={() => setMenuOpen(false)}
                className="block border-l-2 border-transparent px-4 py-3 text-xs font-bold uppercase text-muted-foreground hover:text-foreground"
              >
                Fale conosco
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}