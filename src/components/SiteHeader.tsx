import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Política", path: "/#politica" },
  { label: "Tecnologia", path: "/#tecnologia" },
  { label: "Entretenimento", path: "/#entretenimento" },
  { label: "Contato", path: "/contato" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header>
      {/* Top bar */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-serif font-bold text-lg">V</span>
            </div>
            <div>
              <h1 className="font-serif font-bold text-xl leading-tight text-foreground">
                Web Rádio Vitória
              </h1>
              <p className="text-xs text-muted-foreground">Notícias • Informação • Conteúdo</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <span>{new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          </div>

          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-nav">
        <div className="container mx-auto px-4">
          <ul className={`${menuOpen ? "flex" : "hidden"} md:flex flex-col md:flex-row`}>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className="block px-4 py-3 text-nav-foreground text-sm font-medium hover:bg-primary transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
