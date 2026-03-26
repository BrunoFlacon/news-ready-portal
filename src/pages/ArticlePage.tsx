import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { articles } from "@/data/articles";
import { Facebook, Twitter, Linkedin, Share2 } from "lucide-react";

const ArticlePage = () => {
  const { id } = useParams();
  const article = articles.find((a) => a.id === id);

  if (!article) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-serif text-2xl font-bold text-foreground">Artigo não encontrado</h1>
          <Link to="/" className="text-primary mt-4 inline-block hover:underline">Voltar ao início</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="container mx-auto px-4 py-8 max-w-3xl">
        <span className="text-xs font-bold uppercase tracking-wider text-section-label">{article.category}</span>
        <h1 className="font-serif font-bold text-2xl md:text-4xl leading-tight text-foreground mt-2 mb-4">{article.title}</h1>

        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
          <span>Por <strong className="text-foreground">{article.author}</strong></span>
          <span>•</span>
          <time>{new Date(article.date).toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" })}</time>
        </div>

        <div className="rounded-xl overflow-hidden mb-8 aspect-video">
          <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
        </div>

        <div className="prose prose-lg max-w-none text-foreground">
          {article.body.split("\n\n").map((p, i) => (
            <p key={i} className="mb-4 leading-relaxed">{p}</p>
          ))}
        </div>

        {/* Share */}
        <div className="border-t border-border mt-10 pt-6">
          <p className="text-sm font-semibold text-foreground mb-3">Compartilhar:</p>
          <div className="flex gap-3">
            {[Facebook, Twitter, Linkedin, Share2].map((Icon, i) => (
              <button key={i} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default ArticlePage;
