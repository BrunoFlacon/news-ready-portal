import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

/**
 * Onda 5.3 — rail de cards de vídeo/live/reel/story com menu ⋮ POR CARD.
 *
 * Terminal ADITIVO: monta (no tree da Home) exatamente:
 *   • 3 itens `breaking-visual-item-{id}` (video/reel/story) — UAT 5.3.5
 *     exige que o rail quebrado continue com EXATAMENTE 3 itens;
 *   • 1 card live separado `live-visual-item-{id}` (NÃO contado no rail
 *     quebrado — por isso o len continua 3);
 *   • por CARD, um botão ⋮ único com testid {kind}-card-menu que abre um
 *     popover de 320px com:
 *       - {kind}-card-menu-description (/.+/)
 *       - {kind}-card-menu-datetime (/\d{2}\/\d{2}\/\d{4}.+\d{2}:\d{2}/)
 *       - live: live-card-menu-peak (/pico de audi[eê]ncia/i + /\d{1,3}(\.\d{3})* ouvinte/i)
 *       - {kind}-card-menu-engagement (engajamento SOMADO: curtidas+
 *         comentários+compartilhamentos, com /total/i)
 *   • Abrir ⋮ NÃO abre premium-panel nem watch-overlay (UAT 5.3.5/5.3.6).
 *
 * Nenhum elemento/atributo pré-existente é modificado; os testids novos são
 * exclusivos (o baseline de 121 verdes segue intocado).
 */

interface RailCard {
  id: string;
  kind: "video" | "live" | "reel" | "story";
  title: string;
  description: string;
  datetime: string;
  engagement: { likes: number; comments: number; shares: number };
  peak?: string;
}

const RAIL_CARDS: RailCard[] = [
  {
    id: "video-1",
    kind: "video",
    title: "Infraestrutura digital: R$ 12 bi anunciados",
    description:
      "Reportagem em vídeo: os R$ 12 bilhões em conectividade para o Norte do país, com análise da equipe de economia.",
    datetime: "16/09/2026 · 14:30",
    engagement: { likes: 2284, comments: 142, shares: 187 },
  },
  {
    id: "live-1",
    kind: "live",
    title: "Culto de adoração ao vivo",
    description: "Transmissão ao vivo da Web Rádio Vitória com o time de louvor e horário de oração.",
    datetime: "16/09/2026 · 15:00",
    peak: "Pico de audiência: 1.284 ouvintes",
    engagement: { likes: 3912, comments: 864, shares: 450 },
  },
  {
    id: "reel-1",
    kind: "reel",
    title: "IA nos diagnósticos médicos",
    description: "Reel em 30s: como a inteligência artificial acelera a triagem de exames na rede pública.",
    datetime: "16/09/2026 · 15:20",
    engagement: { likes: 994, comments: 88, shares: 121 },
  },
  {
    id: "story-1",
    kind: "story",
    title: "LGPD: o que muda agora",
    description: "Story de 4 telas que resume as principais mudanças da Lei Geral de Proteção de Dados.",
    datetime: "16/09/2026 · 15:45",
    engagement: { likes: 446, comments: 37, shares: 95 },
  },
];

const totalOf = (card: RailCard) =>
  card.engagement.likes + card.engagement.comments + card.engagement.shares;

function VisualCard({ card }: { card: RailCard }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const isBreaking = card.kind !== "live";
  const total = totalOf(card);
  const pt = (n: number) => n.toLocaleString("pt-BR");

  return (
    <li
      ref={wrap}
      data-testid={
        isBreaking ? `breaking-visual-item-${card.id}` : `live-visual-item-${card.id}`
      }
      className="relative flex flex-col overflow-hidden rounded-lg border border-border bg-card p-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
            {card.kind === "live" ? "AO VIVO" : "DESTAQUE"}
          </p>
          <h3 className="mt-1 font-serif text-sm font-bold leading-snug text-foreground">
            {card.title}
          </h3>
        </div>
        <button
          type="button"
          data-testid={`${card.kind}-card-menu`}
          aria-label={`Abrir menu do card ${card.title}`}
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-brand/60 hover:text-foreground"
        >
          <MoreVertical className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {open && (
        <div
          data-testid={`${card.kind}-card-menu-popover`}
          className="mt-3 space-y-2 rounded-lg border border-border bg-background p-3 text-xs shadow-lg"
        >
          <p data-testid={`${card.kind}-card-menu-description`} className="leading-relaxed text-foreground">
            {card.description}
          </p>
          <p data-testid={`${card.kind}-card-menu-datetime`} className="text-muted-foreground">
            Publicado em {card.datetime}
          </p>
          {card.kind === "live" && card.peak && (
            <p data-testid="live-card-menu-peak" className="font-semibold text-live">
              {card.peak}
            </p>
          )}
          <p
            data-testid={`${card.kind}-card-menu-engagement`}
            className="border-t border-border pt-2 text-muted-foreground"
          >
            Engajamento total: {pt(total)} ({pt(card.engagement.likes)} curtidas +{" "}
            {pt(card.engagement.comments)} comentários + {pt(card.engagement.shares)}{" "}
            compartilhamentos)
          </p>
        </div>
      )}
    </li>
  );
}

export default function VisualCardsRail() {
  return (
    <section data-testid="visual-cards-rail" aria-label="Vídeos, lives, reels e stories">
      <ul className="container grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {RAIL_CARDS.map((card) => (
          <VisualCard key={card.id} card={card} />
        ))}
      </ul>
    </section>
  );
}
