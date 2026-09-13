import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Twitter, Radio } from "lucide-react";

const socialLinks = [
  { icon: <Facebook className="w-4 h-4" />, label: "Facebook", href: "https://facebook.com/webradiovitoria" },
  { icon: <Instagram className="w-4 h-4" />, label: "@webradiovitoriaa", href: "https://instagram.com/webradiovitoriaa" },
  { icon: <Youtube className="w-4 h-4" />, label: "YouTube", href: "https://youtube.com/@webradiovitoria" },
  { icon: <Twitter className="w-4 h-4" />, label: "@WebRadi0Vitoria", href: "https://x.com/WebRadi0Vitoria" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-brand text-brand-foreground">
                <Radio className="h-4 w-4" />
              </div>
              <h3 className="font-serif font-bold text-lg">Web Rádio Vitória</h3>
            </div>
              <p className="text-sm text-muted-foreground">
              Portal de notícias com cobertura completa sobre política, tecnologia,
              entretenimento e muito mais. 24 hs adorando a Deus — Tupã, SP, Brasil.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Links Importantes</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/noticias" className="hover:opacity-100 transition-opacity">Notícias</Link></li>
              <li><Link to="/contato" className="hover:opacity-100 transition-opacity">Contato</Link></li>
              <li><Link to="/privacy-policy" className="hover:opacity-100 transition-opacity">Política de Privacidade</Link></li>
              <li><Link to="/terms-of-service" className="hover:opacity-100 transition-opacity">Termos de Serviço</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Redes Sociais</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                   className="flex items-center gap-2 hover:text-brand transition-colors"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-sm bg-secondary">
                    {social.icon}
                  </span>
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Web Rádio Vitória. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}