import { Link, NavLink } from "react-router-dom";
import { Menu, X, Radio, Play, Pause, Headphones, Newspaper } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRadioPlayerContext } from "@/contexts/RadioPlayerContext";

const navItems = [
  { label: "Início", path: "/" },
  { label: "Vitória News", path: "/noticias" },
  { label: "Institucional", path: "/#institucional" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const player = useRadioPlayerContext();

  const hasNowPlaying = player.nowPlaying !== null;
  const isRadioLive = Boolean(player.streamUrl) && !hasNowPlaying;

  const handlePlayerClick = () => {
    if (hasNowPlaying) {
      player.togglePlayback();
    } else if (player.liveOpen) {
      player.toggleLivePlay();
    } else {
      player.openPlayer();
    }
  };

  const playerLabel = hasNowPlaying
    ? player.playbackPlaying
      ? "Pausar"
      : "Tocar"
    : player.streamUrl
      ? player.playing || player.liveOpen
        ? player.livePlaying
          ? "Pausar"
          : "Retomar"
        : "Ouvir Agora"
      : "Em breve";

  const playerDisabled = !hasNowPlaying && !player.streamUrl;

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
          {isRadioLive && (
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-live"><span className="h-2 w-2 animate-pulse rounded-full bg-live" />Ao vivo</span>
          )}
          {hasNowPlaying && (
            <span className="inline-flex max-w-40 items-center gap-2 text-xs font-semibold uppercase text-brand">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
              <span className="truncate">{player.nowPlaying?.kind === "podcast" ? "Podcast" : "Vídeo"}</span>
            </span>
          )}
          <button
            type="button"
            onClick={handlePlayerClick}
            disabled={playerDisabled}
            className={playerDisabled ? "inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-md bg-secondary px-4 text-sm font-medium text-secondary-foreground opacity-60" : "btn-brand h-9 px-4"}
          >
            {playerLabel === "Pausar" ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
            {playerLabel}
          </button>
          <Button asChild size="sm"><Link to="/contato"><Headphones /> Fale conosco</Link></Button>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen}>
          {menuOpen ? <X /> : <Menu />}
        </Button>
      </div>
      <nav className="border-t border-border" aria-label="Navegação principal">
        <div className="container">
          <ul className={`${menuOpen ? "flex" : "hidden"} flex-col lg:flex lg:flex-row lg:items-center`}>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `block border-l-2 px-4 py-3 text-xs font-bold uppercase transition-colors lg:border-b-2 lg:border-l-0 ${
                      isActive ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label === "Vitória News" ? (
                    <span className="inline-flex items-center gap-1.5"><Newspaper className="h-3.5 w-3.5" />{item.label}</span>
                  ) : (
                    item.label
                  )}
                </NavLink>
              </li>
            ))}
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