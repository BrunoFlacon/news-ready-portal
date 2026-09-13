import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Mic2, Newspaper, Play, Radio, Users } from "lucide-react";
import { Layout } from "@/components/Layout";
import { MediaRail } from "@/components/MediaRail";
import { NewsCard } from "@/components/NewsCard";
import { Button } from "@/components/ui/button";
import { useRadioPlayerContext } from "@/contexts/RadioPlayerContext";
import { articles, trendingTopics } from "@/data/articles";
import { institutionalServices, socialMedia, stories, videoCuts } from "@/data/media";

const featureArticles = articles.slice(0, 3);
const institutionalImage = "https://d2xsxph8kpxj0f.cloudfront.net/310519663537524925/WyaUbNtmjegzP69poquyFv/about_section-GzvJS3t4GNMqHFnJjuDTRq.webp";

function LeadCarousel({ hasStream, onOpenPlayer }: { hasStream: boolean; onOpenPlayer: () => void }) {
  const [active, setActive] = useState(0);
  const article = featureArticles[active];
  const move = (direction: number) => setActive((active + direction + featureArticles.length) % featureArticles.length);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % featureArticles.length), 7000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[520px] overflow-hidden border-b border-border md:min-h-[620px]" aria-label="Notícias de capa">
      <img src={article.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-hero-overlay" />
      <div className="container relative flex min-h-[520px] items-end py-12 md:min-h-[620px] md:py-16">
        <div className="max-w-4xl">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-sm bg-live px-3 py-1.5 text-[10px] font-bold uppercase text-live-foreground"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live-foreground" />Breaking news</span>
            <span className="rounded-sm border border-overlay-foreground/20 bg-background/30 px-3 py-1.5 text-[10px] font-bold uppercase text-overlay-foreground backdrop-blur-md">{article.category}</span>
          </div>
          <h1 className="max-w-4xl font-serif text-4xl font-bold leading-tight text-overlay-foreground md:text-6xl">{article.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-overlay-muted md:text-lg">{article.excerpt}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg"><Link to={`/artigo/${article.id}`}>Ler reportagem <ArrowRight /></Link></Button>
            {hasStream ? (
              <Button variant="outline" size="lg" onClick={onOpenPlayer}><Play /> Ouvir Agora</Button>
            ) : (
              <Button variant="outline" size="lg" disabled><Play /> Live em breve</Button>
            )}
          </div>
        </div>
        <div className="absolute bottom-6 right-4 flex gap-2 md:right-8">
          <Button variant="outline" size="icon" onClick={() => move(-1)} aria-label="Notícia anterior"><ChevronLeft /></Button>
          <Button variant="outline" size="icon" onClick={() => move(1)} aria-label="Próxima notícia"><ChevronRight /></Button>
        </div>
        <div className="absolute bottom-6 left-4 flex gap-2 md:left-8">
          {featureArticles.map((item, index) => <button key={item.id} onClick={() => setActive(index)} aria-label={`Mostrar notícia ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === active ? "w-8 bg-brand" : "w-3 bg-overlay-foreground/40"}`} />)}
        </div>
      </div>
    </section>
  );
}

function EditorialOverview() {
  return (
    <section className="page-band">
      <div className="container grid gap-10 lg:grid-cols-[17rem_1fr]">
        <aside className="space-y-10">
          <div>
            <p className="editorial-kicker">Web Rádio</p>
            <h2 className="mt-2 font-serif text-2xl font-bold">Programação</h2>
            <div className="mt-5 space-y-3">
              {[{ time: "Agora", name: "Web Rádio Vitória", detail: "24 hs adorando a Deus" }, { time: "Conteúdo", name: "Notícias e informação", detail: "Verdade, fé e comunidade" }, { time: "Participação", name: "Fale com a rádio", detail: "Envie sua sugestão de pauta" }].map((item, index) => (
                <div key={item.time} className={`border-l-2 p-4 ${index === 0 ? "border-brand bg-card" : "border-border"}`}>
                  <span className="text-[10px] font-bold uppercase text-brand">{item.time}</span>
                  <h3 className="mt-1 text-sm font-bold text-foreground">{item.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="editorial-kicker text-primary">O que está bombando</p>
            <ol className="mt-5 space-y-5">
              {trendingTopics.slice(0, 4).map((topic, index) => <li key={topic} className="flex gap-4"><span className="font-serif text-3xl font-bold text-border">0{index + 1}</span><Link to="/noticias" className="text-sm font-semibold leading-snug hover:text-brand">{topic}</Link></li>)}
            </ol>
          </div>
        </aside>
        <div>
          <div className="mb-6 flex items-end justify-between border-b border-border pb-4"><div><p className="editorial-kicker">Agora no portal</p><h2 className="mt-2 font-serif text-3xl font-bold">Manchetes do dia</h2></div><Link to="/noticias" className="link-arrow">Ver todas <ArrowRight /></Link></div>
          <div className="grid gap-6 md:grid-cols-2">{articles.slice(1, 5).map((article) => <NewsCard key={article.id} article={article} />)}</div>
        </div>
      </div>
    </section>
  );
}

function InstitutionalBand() {
  return (
    <section id="institucional" className="border-y border-border bg-card py-16 md:py-24">
      <div className="container">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="editorial-kicker">Área institucional</p>
            <h2 className="mt-3 max-w-2xl font-serif text-4xl font-bold md:text-5xl">Uma voz que informa, acolhe e conecta.</h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">A Web Rádio Vitória nasceu para zelar pela verdade dos fatos e levar fé, esperança e informação de qualidade. De Tupã, São Paulo, transmitimos para todo o Brasil.</p>
            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-4">
              {[{ icon: Heart, value: "Fé", label: "e esperança" }, { icon: Newspaper, value: "Verdade", label: "no jornalismo" }, { icon: Users, value: "29K+", label: "seguidores" }, { icon: Radio, value: "24h", label: "no ar" }].map(({ icon: Icon, value, label }) => <div key={value} className="bg-background p-5"><Icon className="mb-3 h-5 w-5 text-brand" /><strong className="block font-serif text-xl">{value}</strong><span className="text-xs text-muted-foreground">{label}</span></div>)}
            </div>
            <div className="mt-8 flex flex-wrap gap-3"><Button asChild><Link to="/contato">Fale com a rádio</Link></Button><Button asChild variant="outline"><Link to="/noticias">Conheça o portal</Link></Button></div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-border"><img src={institutionalImage} alt="Estúdio da Web Rádio Vitória" loading="lazy" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-media-overlay" /><div className="absolute bottom-0 p-6"><Mic2 className="mb-3 h-8 w-8 text-brand" /><p className="font-serif text-2xl font-bold text-overlay-foreground">Tupã, SP — Brasil</p><p className="text-sm text-overlay-muted">Notícias, informação e conteúdo para toda a comunidade.</p></div></div>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{institutionalServices.map((service) => <article key={service.title} className="border-t-2 border-brand pt-5"><h3 className="font-serif text-lg font-bold">{service.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.description}</p></article>)}</div>
      </div>
    </section>
  );
}

export default function Home() {
  const player = useRadioPlayerContext();

  return (
    <Layout>
      <LeadCarousel hasStream={Boolean(player.streamUrl)} onOpenPlayer={player.openPlayer} />
      <EditorialOverview />
      <section className="page-band border-y border-border bg-card"><div className="container grid gap-12 lg:grid-cols-2"><MediaRail title="Reels da redação" eyebrow="Reels" items={socialMedia} portrait /><MediaRail title="Stories em destaque" eyebrow="Stories" items={stories} portrait /></div></section>
      <section className="page-band"><div className="container"><div className="mb-7 flex items-end justify-between border-b border-border pb-4"><div><p className="editorial-kicker">Cobertura completa</p><h2 className="mt-2 font-serif text-3xl font-bold">Mais notícias</h2></div><Link to="/noticias" className="link-arrow">Acessar portal <ArrowRight /></Link></div><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{articles.slice(0, 6).map((article) => <NewsCard key={article.id} article={article} />)}</div></div></section>
      <section className="page-band border-y border-border bg-card"><div className="container"><MediaRail title="Vídeos e cortes de lives" eyebrow="Assista" items={videoCuts} /></div></section>
      <InstitutionalBand />
    </Layout>
  );
}
