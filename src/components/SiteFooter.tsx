import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="bg-nav text-nav-foreground">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-serif font-bold text-lg mb-3">Web Rádio Vitória</h3>
            <p className="text-sm opacity-80">
              Portal de notícias com cobertura completa sobre política, tecnologia, entretenimento e muito mais.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Links Importantes</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link to="/privacy-policy" className="hover:opacity-100 transition-opacity">Política de Privacidade</Link></li>
              <li><Link to="/terms-of-service" className="hover:opacity-100 transition-opacity">Termos de Serviço</Link></li>
              <li><Link to="/contato" className="hover:opacity-100 transition-opacity">Contato</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Redes Sociais</h4>
            <div className="flex gap-3">
              {["Facebook", "Instagram", "Twitter", "TikTok"].map((name) => (
                <span key={name} className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold opacity-80 hover:opacity-100 cursor-pointer transition-opacity">
                  {name[0]}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-nav-foreground/20 mt-8 pt-6 text-center text-sm opacity-60">
          © {new Date().getFullYear()} Web Rádio Vitória. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
