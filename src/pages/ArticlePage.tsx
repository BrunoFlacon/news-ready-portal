import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { articles } from "@/data/articles";
import { Facebook, Twitter, Linkedin, MessageCircle, Share2 } from "lucide-react";

function buildShareLinks(url: string, title: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return [
    {
      label: "Facebook",
      icon: <Facebook size={18} />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "Twitter / X",
      icon: <Twitter size={18} />,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: "LinkedIn",
      icon: <Linkedin size={18} />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: "WhatsApp",
      icon: <MessageCircle size={18} />,
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    },
  ];
}

const ArticlePage = () => {
  const { id } = useParams();
  const article = articles.find((a) => a.id === id);

  useEffect(() => {
    if (article) {
      document.title = `${article.title} — Web Rádio Vitória`;
    }
    return () => {
      document.title = "Web Rádio Vitória — Notícias, Política, Tecnologia e Entretenimento";
    };
  }, [article]);

  if (!article) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-serif text-2xl font-bold text-foreground">Artigo não encontrado</h1>
          <Link to="/noticias" className="text-primary mt-4 inline-block hover:underline">Voltar às notícias</Link>
        </div>
      </Layout>
    );
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareLinks = buildShareLinks(shareUrl, article.title);

  return (
    <Layout>
      <article className="container max-w-4xl py-12 md:py-16">
        <span className="text-xs font-bold uppercase tracking-wider text-section-label">{article.category}</span>
        <h1 className="mt-3 max-w-3xl font-serif text-3xl font-bold leading-tight text-foreground md:text-5xl">{article.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>

        <div className="mb-8 mt-6 flex flex-wrap items-center gap-3 border-y border-border py-4 text-sm text-muted-foreground">
          <span>Por <strong className="text-foreground">{article.author}</strong></span>
          <span>•</span>
          <time>{new Date(article.date).toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" })}</time>
        </div>

        <div className="mb-10 aspect-video overflow-hidden rounded-md border border-border">
          <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
        </div>

        <div className="mx-auto max-w-2xl text-lg text-foreground">
          {article.body.split("\n\n").map((p, i) => (
            <p key={i} className="mb-6 leading-8">{p}</p>
          ))}
        </div>

        {/* Share */}
        <div className="border-t border-border mt-10 pt-6">
          <p className="text-sm font-semibold text-foreground mb-3">Compartilhar:</p>
          <div className="flex gap-3">
            {shareLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Compartilhar no ${link.label}`}
                title={link.label}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {link.icon}
              </a>
            ))}
            <button
              type="button"
              aria-label="Copiar link"
              title="Copiar link"
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(shareUrl);
                }
              }}
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default ArticlePage;