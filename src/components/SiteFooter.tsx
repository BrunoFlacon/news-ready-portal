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
    <footer className="bg-nav text-nav-foreground">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a227] to-[#f0c040] flex items-center justify-center">
                <Radio className="w-4 h-4 text-[#0b1e3d]" />
              </div>
              <h3 className="font-serif font-bold text-lg">Web Rádio Vitória</h3>
            </div>
            <p className="text-sm opacity-80">
              Portal de notícias com cobertura completa sobre política, tecnologia,
              entretenimento e muito mais. 24 hs adorando a Deus — Tupã, SP, Brasil.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Links Importantes</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link to="/noticias" className="hover:opacity-100 transition-opacity">Notícias</Link></li>
              <li><Link to="/contato" className="hover:opacity-100 transition-opacity">Contato</Link></li>
              <li><Link to="/privacy-policy" className="hover:opacity-100 transition-opacity">Política de Privacidade</Link></li>
              <li><Link to="/terms-of-service" className="hover:opacity-100 transition-opacity">Termos de Serviço</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Redes Sociais</h4>
            <div className="space-y-2 text-sm">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity"
                >
                  <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                    {social.icon}
                  </span>
                  {social.label}
                </a>
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