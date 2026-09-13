import { Link } from "react-router-dom";
import { ArrowRight, Heart, Mic2, Newspaper, Pause, Play, Radio, Users } from "lucide-react";
import { Layout } from "@/components/Layout";
import { MediaRail } from "@/components/MediaRail";
import { Button } from "@/components/ui/button";
import { useRadioPlayerContext } from "@/contexts/RadioPlayerContext";
import { podcasts } from "@/data/podcasts";
import { institutionalServices, socialMedia, stories, videoCuts } from "@/data/media";

const heroRadioImage = "https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=800&q=80";
const institutionalImage = "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80";

function RadioHero() {
  const player = useRadioPlayerContext();
  const hasStream = Boolean(player.streamUrl);

  return (
    <section className="relative min-h-[520px] overflow-hidden border-b border-border md:min-h-[620px]" aria-label="Rádio ao vivo">
      <img src={heroRadioImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-hero-overlay" />
      <div className="container relative flex min-h-[520px] items-center py-12 md:min-h-[620px] md:py-16">
        <div className="max-w-3xl">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-sm bg-live px-3 py-1.5 text-[10px] font-bold uppercase text-live-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live-foreground" />
              {hasStream ? "Ao vivo" : "Rádio online"}
            </span>
            <span className="rounded-sm border border-overlay-foreground/20 bg-background/30 px-3 py-1.5 text-[10px] font-bold uppercase text-overlay-foreground backdrop-blur-md">
              De Tupã para todo o Brasil
            </span>
          </div>
          <h1 className="font-serif text-4xl font-bold leading-tight text-overlay-foreground md:text-6xl">
            Web Rádio Vitória
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-overlay-muted md:text-lg">
            24 horas de programação ao vivo com música, informação e fé — e uma
            biblioteca de podcasts, reels, stories e vídeos para ouvir e assistir
            quando quiser.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {hasStream ? (
              <button type="button" onClick={player.openPlayer} className="btn-brand px-10 py-4 text-sm font-bold shadow-xl transition-all duration-200 hover:shadow-2xl">
                <Play className="h-5 w-5 fill-current" /> Ouvir Agora
              </button>
            ) : (
              <button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-md bg-secondary px-10 py-4 text-sm font-bold text-secondary-foreground opacity-60 shadow-xl">
                <Play className="h-5 w-5 fill-current" /> Live em breve
              </button>
            )}
            <Button asChild variant="outline" size="lg">
              <Link to="/noticias">
                <Newspaper className="h-5 w-5" /> Acessar Vitória News
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function PodcastCard({ title, category, durationLabel, imageUrl, onPlay, isCurrent }: {
  title: string;
  category: string;
  durationLabel: string;
  imageUrl: string;
  onPlay: () => void;
  isCurrent: boolean;
}) {
  return (
    <article className="group flex gap-4 overflow-hidden rounded-md border border-border bg-card p-4 transition-colors hover:border-brand/50">
      <img src={imageUrl} alt="" loading="lazy" className="h-20 w-20 flex-shrink-0 rounded-md object-cover" />
      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-bold uppercase text-brand">{category}</span>
        <h3 className="mt-1 font-serif text-sm font-bold leading-snug text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{durationLabel}</p>
        <button
          type="button"
          onClick={onPlay}
          aria-label={`Reproduzir podcast ${title}`}
          aria-pressed={isCurrent}
          className={`mt-3 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
            isCurrent ? "bg-brand text-brand-foreground" : "bg-secondary text-secondary-foreground hover:bg-brand hover:text-brand-foreground"
          }`}
        >
          {isCurrent ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
          {isCurrent ? "Tocando" : "Ouvir"}
        </button>
      </div>
    </article>
  );
}

function ProgramSchedule() {
  const player = useRadioPlayerContext();
  const items = [
    { time: "Agora", name: "Web Rádio Vitória", detail: "24 hs adorando a Deus" },
    { time: "Conteúdo", name: "Podcasts e boletins", detail: "Episódios sob demanda, é só dar o play" },
    { time: "Participação", name: "Fale com a rádio", detail: "Envie sua sugestão de pauta" },
  ];

  return (
    <section className="page-band">
      <div className="container grid gap-10 lg:grid-cols-[17rem_1fr]">
        <aside className="space-y-10">
          <div>
            <p className="editorial-kicker">Web Rádio</p>
            <h2 className="mt-2 font-serif text-2xl font-bold">Programação</h2>
            <div className="mt-5 space-y-3">
              {items.map((item, index) => (
                <div key={item.time} className={`border-l-2 p-4 ${index === 0 ? "border-brand bg-card" : "border-border"}`}>
                  <span className="text-[10px] font-bold uppercase text-brand">{item.time}</span>
                  <h3 className="mt-1 text-sm font-bold text-foreground">{item.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="editorial-kicker text-primary">Sobre a rádio</p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              A Web Rádio Vitória transmite 24 horas por dia, unindo notícias,
              informação e fé para toda a comunidade de Tupã e região.
            </p>
            <Link to="/#institucional" className="link-arrow mt-5">
              Conhecer a área institucional <ArrowRight />
            </Link>
          </div>
        </aside>
        <div>
          <div className="mb-6 flex items-end justify-between border-b border-border pb-4">
            <div>
              <p className="editorial-kicker">Sob demanda</p>
              <h2 className="mt-2 font-serif text-3xl font-bold">Podcasts</h2>
            </div>
            <span className="text-xs text-muted-foreground">{podcasts.length} episódios disponíveis</span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {podcasts.map((podcast) => (
              <PodcastCard
                key={podcast.id}
                title={podcast.title}
                category={podcast.category}
                durationLabel={podcast.durationLabel}
                imageUrl={podcast.imageUrl}
                onPlay={() => player.playPodcast(podcast)}
                isCurrent={player.nowPlaying?.id === podcast.id && player.nowPlaying?.kind === "podcast"}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function EntertainmentBand() {
  return (
    <section className="page-band border-y border-border bg-card">
      <div className="container space-y-12">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div>
            <p className="editorial-kicker">Entretenimento</p>
            <h2 className="mt-2 font-serif text-3xl font-bold">Reels e stories</h2>
          </div>
          <span className="hidden text-xs text-muted-foreground md:inline">
            Conteúdo rápido e descontraído da redação
          </span>
        </div>
        <div className="space-y-10">
          <MediaRail title="Reels da redação" eyebrow="Reels" items={socialMedia} portrait />
          <MediaRail title="Stories em destaque" eyebrow="Stories" items={stories} portrait />
        </div>
      </div>
    </section>
  );
}

function InstitutionalBand() {
  return (
    <section id="institucional" className="border-y border-border py-16 md:py-24">
      <div className="container">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="editorial-kicker">Área institucional</p>
            <h2 className="mt-3 max-w-2xl font-serif text-4xl font-bold md:text-5xl">Uma voz que informa, acolhe e conecta.</h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">A Web Rádio Vitória nasceu para zelar pela verdade dos fatos e levar fé, esperança e informação de qualidade. De Tupã, São Paulo, transmitimos para todo o Brasil.</p>
            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-4">
              {[{ icon: Heart, value: "Fé", label: "e esperança" }, { icon: Newspaper, value: "Verdade", label: "no jornalismo" }, { icon: Users, value: "29K+", label: "seguidores" }, { icon: Radio, value: "24h", label: "no ar" }].map(({ icon: Icon, value, label }) => (
                <div key={value} className="bg-background p-5">
                  <Icon className="mb-3 h-5 w-5 text-brand" />
                  <strong className="block font-serif text-xl">{value}</strong>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild><Link to="/contato">Fale com a rádio</Link></Button>
              <Button asChild variant="outline"><Link to="/noticias"><Newspaper className="h-4 w-4" /> Vitória News</Link></Button>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-border">
            <img src={institutionalImage} alt="Estúdio da Web Rádio Vitória" loading="lazy" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-media-overlay" />
            <div className="absolute bottom-0 p-6">
              <Mic2 className="mb-3 h-8 w-8 text-brand" />
              <p className="font-serif text-2xl font-bold text-overlay-foreground">Tupã, SP — Brasil</p>
              <p className="text-sm text-overlay-muted">Notícias, informação e conteúdo para toda a comunidade.</p>
            </div>
          </div>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {institutionalServices.map((service) => (
            <article key={service.title} className="border-t-2 border-brand pt-5">
              <h3 className="font-serif text-lg font-bold">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Layout>
      <RadioHero />
      <ProgramSchedule />
      <EntertainmentBand />
      <section className="page-band">
        <div className="container">
          <MediaRail title="Vídeos e cortes de lives" eyebrow="Assista" items={videoCuts} />
        </div>
      </section>
      <InstitutionalBand />
    </Layout>
  );
}