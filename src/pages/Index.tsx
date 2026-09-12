import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { NewsCard } from "@/components/NewsCard";
import { articles, trendingTopics, type Article } from "@/data/articles";

const categories = ["Todas", "Política", "Tecnologia", "Entretenimento"] as const;

type Category = (typeof categories)[number];

function filterByCategory(list: Article[], category: Category): Article[] {
  if (category === "Todas") return list;
  return list.filter((a) => a.category === category);
}

const Index = () => {
  const [category, setCategory] = useState<Category>("Todas");

  const filtered = useMemo(() => filterByCategory(articles, category), [category]);
  const hero = filtered[0];
  const rest = filtered.slice(1);

  return (
    <Layout>
      {/* Category filter */}
      <div className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                category === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Hero */}
      {hero && (
        <section className="container mx-auto px-4 py-6">
          <Link to={`/artigo/${hero.id}`} className="group block">
            <div className="relative rounded-xl overflow-hidden aspect-[21/9] md:aspect-[3/1]">
              <img src={hero.imageUrl} alt={hero.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                <span className="inline-block bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-3 py-1 rounded mb-3">
                  {hero.category}
                </span>
                <h2 className="font-serif font-bold text-2xl md:text-4xl leading-tight text-white max-w-3xl">
                  {hero.title}
                </h2>
                <p className="text-white/80 mt-2 max-w-2xl text-sm md:text-base">{hero.excerpt}</p>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Content grid */}
      <section className="container mx-auto px-4 pb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Articles */}
          <div className="flex-1">
            <h2 className="font-serif font-bold text-xl mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full inline-block" />
              Últimas Notícias
              {category !== "Todas" && (
                <span className="text-sm font-normal text-muted-foreground">— {category}</span>
              )}
            </h2>
            {rest.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {rest.map((a) => (
                  <NewsCard key={a.id} article={a} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Nenhuma notícia nesta categoria por enquanto.
              </p>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-72 shrink-0 space-y-6">
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="font-serif font-bold text-lg mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-primary rounded-full inline-block" />
                Em Alta
              </h3>
              <ul className="space-y-2">
                {trendingTopics.map((topic, i) => (
                  <li key={topic} className="flex items-center gap-3 text-sm">
                    <span className="text-primary font-bold">{i + 1}</span>
                    <span className="text-foreground">{topic}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="font-serif font-bold text-lg mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-primary rounded-full inline-block" />
                Recentes
              </h3>
              <ul className="space-y-3">
                {articles.slice(0, 4).map((a) => (
                  <li key={a.id}>
                    <Link to={`/artigo/${a.id}`} className="text-sm text-foreground hover:text-primary transition-colors font-medium leading-snug block">
                      {a.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString("pt-BR")}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
};

export default Index;