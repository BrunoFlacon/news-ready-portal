import { Link } from "react-router-dom";
import type { Article } from "@/data/articles";

export function NewsCard({ article }: { article: Article }) {
  return (
    <Link to={`/artigo/${article.id}`} className="group block">
      <article className="bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow">
        <div className="aspect-video overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <div className="p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-section-label">
            {article.category}
          </span>
          <h3 className="font-serif font-bold text-foreground mt-1 mb-2 leading-snug group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{article.author}</span>
            <span>•</span>
            <span>{new Date(article.date).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
