import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { articles } from "@/data/articles";
import {
  ArrowLeft,
  Facebook,
  Linkedin,
  MessageCircle,
  Radio,
  Send,
  Share2,
  Twitter,
} from "lucide-react";
import {
  formatPlace,
  formatPublishedAt,
  formatUpdatedAt,
} from "@/lib/relative-time";

// Links de adesão da redação — troque pelas URLs reais do grupo e do canal.
const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/SEU-GRUPO-VITORIA-NEWS";
const TELEGRAM_CHANNEL_URL = "https://t.me/seu_canal_vitorianews";

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
      document.title = `${article.title} — Vitória News`;
    }
    return () => {
      document.title = "Vitória News — Notícias, Política, Tecnologia e Entretenimento";
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

  // No rodapé da matéria: jornalista, tempo relativo da publicação (e da
  // atualização, quando houver) e o local de apuração (cidade/UF).
  const published = formatPublishedAt(article.publishedAt);
  const updated = article.updatedAt ? formatUpdatedAt(article.updatedAt) : "";
  const place = formatPlace(article.city, article.state);

  return (
    <Layout>
      <article className="container max-w-4xl py-12 md:py-16">
        {/* Marca do portal (padrão Globo/Metrópoles): nome com logo à esquerda. */}
        <div className="mb-8 flex items-center gap-3 border-b border-border pb-4">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-brand text-brand-foreground shadow-brand">
              <Radio className="h-5 w-5" />
            </span>
            <span>
              <strong className="block font-serif text-lg leading-none text-foreground">Vitória News</strong>
              <small className="block text-[10px] uppercase tracking-widest text-muted-foreground">Notícias com apuração</small>
            </span>
          </Link>
        </div>

        <Link
          to="/noticias"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Notícias
        </Link>

        <span className="mt-6 block text-xs font-bold uppercase tracking-wider text-section-label">{article.category}</span>
        <h1 className="mt-3 max-w-3xl font-serif text-3xl font-bold leading-tight text-foreground md:text-5xl">{article.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>

        <div className="mb-8 mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 border-y border-border py-4 text-sm text-muted-foreground">
          <span>Por <strong className="text-foreground">{article.author}</strong></span>
          <span aria-hidden="true">•</span>
          <time>{published}</time>
          {updated && (
            <>
              <span aria-hidden="true">•</span>
              <time>{updated}</time>
            </>
          )}
          {place && (
            <>
              <span aria-hidden="true">•</span>
              <span>{place}</span>
            </>
          )}
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
              onClick={async () => {
                if (!navigator.clipboard) {
                  return;
                }
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  toast.success("Link copiado!");
                } catch {
                  toast.error("Não foi possível copiar o link.");
                }
              }}
            >
              <Share2 size={18} />
            </button>
          </div>

          {/* Mini banner de adesão: grupo do WhatsApp e canal do Telegram. */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a
              href={WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-[#25D366]/40 bg-[#25D366]/10 p-4 transition-colors hover:bg-[#25D366]/20"
            >
              <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-[#25D366] text-white">
                <MessageCircle className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-foreground">Grupo no WhatsApp</span>
                <span className="block truncate text-xs text-muted-foreground">Receba as notícias em primeira mão.</span>
              </span>
            </a>
            <a
              href={TELEGRAM_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-[#229ED9]/40 bg-[#229ED9]/10 p-4 transition-colors hover:bg-[#229ED9]/20"
            >
              <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-[#229ED9] text-white">
                <Send className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-foreground">Canal no Telegram</span>
                <span className="block truncate text-xs text-muted-foreground">Participe das conversas da redação.</span>
              </span>
            </a>
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default ArticlePage;