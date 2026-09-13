import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

type MediaItem = { id: string; title: string; image: string; duration?: string; category?: string };

interface MediaRailProps {
  title: string;
  eyebrow: string;
  items: MediaItem[];
  portrait?: boolean;
}

export function MediaRail({ title, eyebrow, items, portrait = false }: MediaRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: number) => railRef.current?.scrollBy({ left: direction * 360, behavior: "smooth" });

  return (
    <section aria-labelledby={`${eyebrow}-heading`}>
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="editorial-kicker">{eyebrow}</p>
          <h2 id={`${eyebrow}-heading`} className="mt-2 font-serif text-2xl font-bold text-foreground">{title}</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => scroll(-1)} aria-label={`Voltar em ${title}`}><ChevronLeft /></Button>
          <Button variant="outline" size="icon" onClick={() => scroll(1)} aria-label={`Avançar em ${title}`}><ChevronRight /></Button>
        </div>
      </div>
      <div ref={railRef} className="scrollbar-hidden flex snap-x gap-4 overflow-x-auto pb-2">
        {items.map((item) => (
          <article key={item.id} className={`${portrait ? "w-[72vw] max-w-56" : "w-[82vw] max-w-sm"} group shrink-0 snap-start`}>
            <div className={`${portrait ? "aspect-[9/14]" : "aspect-video"} relative overflow-hidden rounded-md border border-border bg-card`}>
              <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-media-overlay" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                {item.category && <span className="mb-2 block text-[10px] font-bold uppercase text-brand">{item.category}</span>}
                <h3 className="font-serif font-bold leading-snug text-overlay-foreground">{item.title}</h3>
              </div>
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-sm bg-background/85 px-2 py-1 text-[10px] font-bold text-foreground">
                <Play className="h-3 w-3 fill-current" /> {item.duration ?? "Story"}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}