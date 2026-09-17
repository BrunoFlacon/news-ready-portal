/**
 * Fase C (item 3.1) — painel do admin para administrar propagandas.
 *
 * v0 sem banco: o CRUD e as métricas vivem em `src/lib/ads.ts` (localStorage),
 * reativos via `useAdCampaigns` — criar/pausar/remover reflete imediatamente
 * nos slots da Home (intersticial e banner gigante). O mapeamento para o banco
 * futuro está documentado em `src/lib/ads.ts` e no
 * `docs/PLANO-BANCO-DADOS-BACKEND.md`.
 */
import { useState } from "react";
import { Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdCampaign } from "@/components/AdSpot";
import {
  createAdCampaign,
  getAdMetrics,
  getAdsTotals,
  isAdActive,
  removeAdCampaign,
  toggleAdStatus,
  updateAdCampaign,
  useAdCampaigns,
} from "@/lib/ads";

const KIND_LABELS = {
  interstitial: "Intersticial",
  banner: "Banner",
  next: "A seguir",
} as const;

const ORIENTATION_LABELS = {
  horizontal: "16:9",
  vertical: "9:16",
} as const;

const TARGET_LABELS = {
  url: "URL externa",
  schedule: "Grade de programação",
  live: "Ao vivo",
} as const;

type AdKind = keyof typeof KIND_LABELS;
type AdOrientation = keyof typeof ORIENTATION_LABELS;
type AdTarget = keyof typeof TARGET_LABELS;

interface AdFormState {
  headline: string;
  brand: string;
  caption: string;
  image: string;
  ctaLabel: string;
  target: AdTarget;
  targetUrl: string;
  featured: boolean;
  kind: AdKind;
  orientation: AdOrientation;
}

const EMPTY_FORM: AdFormState = {
  headline: "",
  brand: "",
  caption: "",
  image: "",
  ctaLabel: "Saiba mais",
  target: "url",
  targetUrl: "",
  featured: false,
  kind: "interstitial",
  orientation: "horizontal",
};

/** Tipo efetivo: as campanhas antigas (sem `kind`) caem no destaque. */
function adKind(ad: AdCampaign): AdKind {
  return ad.kind ?? (ad.featured ? "banner" : "interstitial");
}

function adOrientation(ad: AdCampaign): AdOrientation {
  return ad.orientation ?? "horizontal";
}

function formFromAd(ad: AdCampaign): AdFormState {
  return {
    headline: ad.headline,
    brand: ad.brand,
    caption: ad.caption,
    image: ad.image,
    ctaLabel: ad.ctaLabel,
    target: ad.target ?? "url",
    targetUrl: ad.targetUrl ?? "",
    featured: ad.featured === true,
    kind: adKind(ad),
    orientation: adOrientation(ad),
  };
}

const SELECT_CLASS =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground";
const CHECKBOX_CLASS = "h-4 w-4 rounded border-input accent-primary";

export default function AdminAds() {
  const ads = useAdCampaigns();
  const metrics = getAdMetrics();
  const totals = getAdsTotals();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdFormState>(EMPTY_FORM);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  const patch = (changes: Partial<AdFormState>) => setForm((prev) => ({ ...prev, ...changes }));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (ad: AdCampaign) => {
    setEditingId(ad.id);
    setForm(formFromAd(ad));
    setFormOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      headline: form.headline.trim(),
      brand: form.brand.trim(),
      caption: form.caption.trim(),
      image: form.image.trim(),
      ctaLabel: form.ctaLabel.trim() || "Saiba mais",
      target: form.target,
      targetUrl: form.target === "url" ? form.targetUrl.trim() || undefined : undefined,
      featured: form.featured,
      kind: form.kind,
      orientation: form.orientation,
      status: "active" as const,
    };
    if (editingId) {
      updateAdCampaign(editingId, payload);
    } else {
      createAdCampaign(payload);
    }
    setFormOpen(false);
  };

  const confirmRemove = () => {
    if (pendingRemove) {
      removeAdCampaign(pendingRemove);
    }
    setPendingRemove(null);
  };

  return (
    <>
    <section data-testid="admin-ads-page" className="page-band">
        <div className="container space-y-8">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
            <div>
              <p className="editorial-kicker">Painel administrativo</p>
              <h1 className="mt-2 font-serif text-3xl font-bold">Anúncios</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Crie, pause e remova campanhas. O que estiver ativo entra na hora nos slots da
                home: intersticial entre vídeos e banner gigante.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div
                data-testid="ads-totals"
                className="rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground"
              >
                <span className="font-bold text-foreground">{totals.impressions}</span> exibições
                {" • "}
                <span className="font-bold text-foreground">{totals.clicks}</span>{" "}
                {totals.clicks === 1 ? "clique" : "cliques"}
              </div>
              <Button data-testid="ad-new-button" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Novo anúncio
              </Button>
            </div>
          </header>

          {ads.length === 0 ? (
            <p data-testid="ad-empty" className="text-sm text-muted-foreground">
              Nenhuma campanha cadastrada. Crie a primeira em "Novo anúncio".
            </p>
          ) : (
            <ul className="space-y-3">
              {ads.map((ad) => {
                const active = isAdActive(ad);
                const metric = metrics[ad.id] ?? { impressions: 0, clicks: 0 };
                return (
                  <li
                    key={ad.id}
                    data-testid={`ad-row-${ad.id}`}
                    className={cnRow(active)}
                  >
                    <img
                      src={ad.image}
                      alt=""
                      loading="lazy"
                      className="h-16 w-28 shrink-0 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-foreground">{ad.headline}</h3>
                        <Badge
                          data-testid={`ad-status-${ad.id}`}
                          variant={active ? "secondary" : "outline"}
                          className={active ? "bg-live text-live-foreground" : undefined}
                        >
                          {active ? "Ativo" : "Pausado"}
                        </Badge>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">{ad.brand}</span>
                        <Badge variant="outline">{KIND_LABELS[adKind(ad)]}</Badge>
                        <Badge variant="outline">{ORIENTATION_LABELS[adOrientation(ad)]}</Badge>
                        <span>{TARGET_LABELS[ad.target ?? "url"]}</span>
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        <span data-testid={`ad-impressions-${ad.id}`} className="font-bold text-foreground">
                          {metric.impressions}
                        </span>{" "}
                        exibições •{" "}
                        <span data-testid={`ad-clicks-${ad.id}`} className="font-bold text-foreground">
                          {metric.clicks}
                        </span>{" "}
                        cliques
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`ad-toggle-${ad.id}`}
                        onClick={() => toggleAdStatus(ad.id)}
                        aria-label={`${active ? "Pausar" : "Reativar"} ${ad.headline}`}
                      >
                        {active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {active ? "Pausar" : "Reativar"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`ad-edit-${ad.id}`}
                        onClick={() => openEdit(ad)}
                      >
                        <Pencil className="h-4 w-4" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`ad-remove-${ad.id}`}
                        onClick={() => setPendingRemove(ad.id)}
                      >
                        <Trash2 className="h-4 w-4" /> Remover
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <Dialog open={formOpen} onOpenChange={(open) => setFormOpen(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar anúncio" : "Novo anúncio"}</DialogTitle>
            <DialogDescription>
              A capa e o CTA aparecem no intersticial e, com "banner gigante", também no carrossel.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ad-headline">Título</Label>
              <Input
                id="ad-headline"
                data-testid="ad-form-headline"
                value={form.headline}
                onChange={(event) => patch({ headline: event.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ad-brand">Marca</Label>
              <Input
                id="ad-brand"
                data-testid="ad-form-brand"
                value={form.brand}
                onChange={(event) => patch({ brand: event.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ad-image">Capa (URL da imagem)</Label>
              <Input
                id="ad-image"
                data-testid="ad-form-image"
                placeholder="https://..."
                value={form.image}
                onChange={(event) => patch({ image: event.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ad-caption">Descrição</Label>
              <Input
                id="ad-caption"
                data-testid="ad-form-caption"
                value={form.caption}
                onChange={(event) => patch({ caption: event.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ad-cta">Texto do botão (CTA)</Label>
              <Input
                id="ad-cta"
                data-testid="ad-form-cta"
                value={form.ctaLabel}
                onChange={(event) => patch({ ctaLabel: event.target.value })}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="ad-target">Alvo do clique</Label>
              <select
                id="ad-target"
                data-testid="ad-form-target"
                className={SELECT_CLASS}
                value={form.target}
                onChange={(event) => patch({ target: event.target.value as AdTarget })}
              >
                <option value="url">URL externa</option>
                <option value="schedule">Grade de programação</option>
                <option value="live">Ao vivo</option>
              </select>
            </div>
            {form.target === "url" && (
              <div className="grid gap-1.5">
                <Label htmlFor="ad-target-url">URL de destino</Label>
                <Input
                  id="ad-target-url"
                  data-testid="ad-form-target-url"
                  placeholder="/#assinatura"
                  value={form.targetUrl}
                  onChange={(event) => patch({ targetUrl: event.target.value })}
                />
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="ad-kind">Tipo</Label>
              <select
                id="ad-kind"
                data-testid="ad-form-kind"
                className={SELECT_CLASS}
                value={form.kind}
                onChange={(event) => patch({ kind: event.target.value as AdKind })}
              >
                <option value="interstitial">Intersticial (entre vídeos)</option>
                <option value="banner">Banner (carrossel do hero)</option>
                <option value="next">A seguir (card de transição)</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ad-orientation">Orientação</Label>
              <select
                id="ad-orientation"
                data-testid="ad-form-orientation"
                className={SELECT_CLASS}
                value={form.orientation}
                onChange={(event) => patch({ orientation: event.target.value as AdOrientation })}
              >
                <option value="horizontal">Horizontal (16:9)</option>
                <option value="vertical">Vertical (9:16)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className={CHECKBOX_CLASS}
                data-testid="ad-form-featured"
                checked={form.featured}
                onChange={(event) =>
                  patch({
                    featured: event.target.checked,
                    kind: event.target.checked ? "banner" : "interstitial",
                  })
                }
              />
              Exibir no banner gigante (featured)
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" data-testid="ad-form-cancel" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button data-testid="ad-form-submit" onClick={handleSubmit}>
              {editingId ? "Salvar alterações" : "Criar anúncio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingRemove !== null} onOpenChange={(open) => !open && setPendingRemove(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover anúncio?</DialogTitle>
            <DialogDescription>
              A campanha sai dos slots imediatamente. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRemove(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" data-testid="ad-confirm-remove" onClick={confirmRemove}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Cartão de campanha: destaca borda esquerda conforme o estado. */
function cnRow(active: boolean): string {
  return [
    "flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4",
    active ? "border-border" : "border-dashed border-border opacity-70",
  ].join(" ");
}
