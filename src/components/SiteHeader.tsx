import { Link, NavLink } from "react-router-dom";
import { Menu, X, Radio } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Início", path: "/" },
  { label: "Notícias", path: "/noticias" },
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a227] to-[#f0c040] flex items-center justify-center shadow">
              <Radio className="w-5 h-5 text-[#0b1e3d]" />
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
          <ul className={`${menuOpen ? "flex" : "hidden"} md:flex flex-col md:flex-row items-stretch`}>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `block px-4 py-3 text-nav-foreground text-sm font-medium hover:bg-primary transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : ""
                    }`
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li className="md:ml-auto md:flex md:items-center md:py-2 py-3">
              <Link
                to="/contato"
                onClick={() => setMenuOpen(false)}
                className="inline-block bg-[#c9a227] hover:bg-[#f0c040] text-[#0b1e3d] font-bold text-sm px-5 py-2 rounded-full transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Fale Conosco
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}