/**
 * Fase C — hub do painel administrativo (itens 3.1 e 3.2).
 *
 * `/admin` é o ponto de entrada: navega entre Anúncios (`/admin/ads`) e Grade de
 * programação (`/admin/schedule`). v0 sem autenticação/banco — a persistência é
 * local (`localStorage`) e o mapeamento para o banco está em
 * `docs/PLANO-BANCO-DADOS-BACKEND.md`.
 */
import { NavLink, Outlet } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/admin/ads", label: "Anúncios" },
  { to: "/admin/schedule", label: "Grade de programação" },
];

export default function Admin() {
  return (
    <Layout>
      <div data-testid="admin-hub" className="border-b border-border bg-card">
        <nav className="container flex flex-wrap items-center gap-1 py-3" aria-label="Seções do painel">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </Layout>
  );
}
