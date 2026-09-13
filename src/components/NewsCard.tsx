import { Link } from "react-router-dom";
import type { Article } from "@/data/articles";

export function NewsCard({ article }: { article: Article }) {
  return (
    <Link to={`/artigo/${article.id}`} className="group block h-full">
      <article className="h-full overflow-hidden rounded-md border border-border bg-card transition-colors hover:border-brand/50">
        <div className="aspect-video overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="p-4">
          <span className="text-[10px] font-bold uppercase text-primary">
            {article.category}
          </span>
          <h3 className="mb-2 mt-2 font-serif font-bold leading-snug text-foreground transition-colors group-hover:text-brand">
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
