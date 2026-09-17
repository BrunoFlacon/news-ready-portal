import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { RadioPlayerProvider } from "./contexts/RadioPlayerContext";
import Home from "./pages/Home";
import Index from "./pages/Index";
import ArticlePage from "./pages/ArticlePage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";
import AdminAds from "./pages/AdminAds";
import AdminSchedule from "./pages/AdminSchedule";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// No GitHub Pages o site vive em /news-ready-portal/; o react-router precisa
// do basename correspondente para resolver as rotas. Em produção local e no
// preview do Lovable a base é "/" (sem subpath).
const basename =
  import.meta.env.BASE_URL && import.meta.env.BASE_URL !== "/"
    ? import.meta.env.BASE_URL.replace(/\/+$/, "")
    : undefined;

/**
 * Gerencia o scroll entre rotas: âncoras (#institucional) são alcançadas com
 * scroll suave e qualquer outra navegação rola para o topo.
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ block: "start" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

export function AppRoutes() {
  return (
    <>
      <ScrollManager />
      <Routes>
        {/* Portal editorial (unificação da landing e do portal de notícias) */}
        <Route path="/" element={<Home />} />
        <Route path="/noticias" element={<Index />} />
        <Route path="/artigo/:id" element={<ArticlePage />} />
        <Route path="/contato" element={<Contact />} />
        {/* Painel administrativo (Onda 6, fase C): anúncios e grade de programação */}
        <Route path="/admin" element={<Admin />}>
          <Route index element={<Navigate to="/admin/ads" replace />} />
          <Route path="ads" element={<AdminAds />} />
          <Route path="schedule" element={<AdminSchedule />} />
        </Route>
        {/* Páginas legais para aprovação de APIs */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <ErrorBoundary>
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RadioPlayerProvider>
            <BrowserRouter basename={basename}>
              <AppRoutes />
            </BrowserRouter>
          </RadioPlayerProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;