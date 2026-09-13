import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout><section className="container flex min-h-[60vh] items-center justify-center py-16 text-center"><div><p className="editorial-kicker">Erro 404</p><h1 className="mt-3 font-serif text-5xl font-bold">Página não encontrada</h1><p className="mx-auto mt-4 max-w-md text-muted-foreground">O endereço informado não existe ou foi removido do portal.</p><Button asChild className="mt-8"><Link to="/">Voltar ao início</Link></Button></div></section></Layout>
  );
};

export default NotFound;
