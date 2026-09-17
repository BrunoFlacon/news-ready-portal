/**
 * Fase C (item 3.2) — painel do admin para administrar a grade de programação.
 *
 * v0 sem banco: o CRUD vive em `src/lib/schedule.ts` (localStorage), reativo via
 * `useSchedule` — editar/adicionar/reordenar reflete imediatamente na seção de
 * programação da Home, no card "A seguir" (2.1) e na barra do player.
 */
import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
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
import type { ScheduleEntry } from "@/data/media";
import {
  createScheduleEntry,
  moveScheduleEntry,
  removeScheduleEntry,
  resetSchedule,
  updateScheduleEntry,
  useSchedule,
} from "@/lib/schedule";

const KIND_LABELS = {
  program: "Programa",
  live: "Ao vivo",
  podcast: "Podcast",
  replay: "Reapresentação",
} as const;

type ScheduleKind = ScheduleEntry["kind"];

interface ScheduleFormState {
  title: string;
  host: string;
  day: string;
  time: string;
  kind: ScheduleKind;
  premium: boolean;
  startsAt: string;
}

const EMPTY_FORM: ScheduleFormState = {
  title: "",
  host: "",
  day: "",
  time: "",
  kind: "program",
  premium: false,
  startsAt: "",
};

/** Converte o campo `datetime-local` em timestamp (ms) quando válido. */
function toStartsAt(value: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Converte o timestamp salvo no formato aceito por `datetime-local`. */
function fromStartsAt(startsAt?: number): string {
  if (!startsAt) {
    return "";
  }
  const date = new Date(startsAt);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function formFromEntry(entry: ScheduleEntry): ScheduleFormState {
  return {
    title: entry.title,
    host: entry.host,
    day: entry.day,
    time: entry.time,
    kind: entry.kind,
    premium: entry.premium,
    startsAt: fromStartsAt(entry.startsAt),
  };
}

const SELECT_CLASS =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground";
const CHECKBOX_CLASS = "h-4 w-4 rounded border-input accent-primary";

export default function AdminSchedule() {
  const grade = useSchedule();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleFormState>(EMPTY_FORM);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  const patch = (changes: Partial<ScheduleFormState>) =>
    setForm((prev) => ({ ...prev, ...changes }));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (entry: ScheduleEntry) => {
    setEditingId(entry.id);
    setForm(formFromEntry(entry));
    setFormOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      title: form.title.trim(),
      host: form.host.trim(),
      day: form.day.trim(),
      time: form.time.trim(),
      kind: form.kind,
      premium: form.premium,
      startsAt: toStartsAt(form.startsAt),
    };
    if (editingId) {
      updateScheduleEntry(editingId, payload);
    } else {
      createScheduleEntry(payload);
    }
    setFormOpen(false);
  };

  const confirmRemove = () => {
    if (pendingRemove) {
      removeScheduleEntry(pendingRemove);
    }
    setPendingRemove(null);
  };

  return (
    <>
    <section data-testid="admin-schedule-page" className="page-band">
        <div className="container space-y-8">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
            <div>
              <p className="editorial-kicker">Painel administrativo</p>
              <h1 className="mt-2 font-serif text-3xl font-bold">Grade de programação</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Edite, reordene e crie programas sem tocar no código. A grade ativa reflete na
                home, no card "A seguir" e na barra do player.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" data-testid="schedule-reset" onClick={() => resetSchedule()}>
                <RotateCcw className="h-4 w-4" /> Restaurar grade original
              </Button>
              <Button data-testid="schedule-new-button" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Novo programa
              </Button>
            </div>
          </header>

          {grade.length === 0 ? (
            <p data-testid="schedule-empty" className="text-sm text-muted-foreground">
              A grade está vazia. Crie o primeiro programa em "Novo programa".
            </p>
          ) : (
            <ol className="space-y-3">
              {grade.map((entry, index) => (
                <li
                  key={entry.id}
                  data-testid={`schedule-row-${entry.id}`}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-bold text-foreground">{entry.title}</h3>
                      <Badge variant="outline">{KIND_LABELS[entry.kind]}</Badge>
                      <Badge
                        data-testid={`schedule-premium-${entry.id}`}
                        variant={entry.premium ? "default" : "secondary"}
                      >
                        {entry.premium ? "Premium" : "Grátis"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {entry.day} • {entry.time} — Apresentador(a): {entry.host}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`schedule-move-up-${entry.id}`}
                      aria-label={`Subir ${entry.title}`}
                      disabled={index === 0}
                      onClick={() => moveScheduleEntry(entry.id, "up")}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`schedule-move-down-${entry.id}`}
                      aria-label={`Descer ${entry.title}`}
                      disabled={index === grade.length - 1}
                      onClick={() => moveScheduleEntry(entry.id, "down")}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid={`schedule-edit-${entry.id}`}
                      onClick={() => openEdit(entry)}
                    >
                      <Pencil className="h-4 w-4" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid={`schedule-remove-${entry.id}`}
                      onClick={() => setPendingRemove(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" /> Remover
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <Dialog open={formOpen} onOpenChange={(open) => setFormOpen(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar programa" : "Novo programa"}</DialogTitle>
            <DialogDescription>
              O horário salvo aqui é o que aparece na grade da home e alimenta os alertas.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="schedule-title">Título</Label>
              <Input
                id="schedule-title"
                data-testid="schedule-form-title"
                value={form.title}
                onChange={(event) => patch({ title: event.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="schedule-host">Apresentador(a)</Label>
              <Input
                id="schedule-host"
                data-testid="schedule-form-host"
                value={form.host}
                onChange={(event) => patch({ host: event.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="schedule-day">Dia</Label>
                <Input
                  id="schedule-day"
                  data-testid="schedule-form-day"
                  placeholder="Segunda a sexta"
                  value={form.day}
                  onChange={(event) => patch({ day: event.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="schedule-time">Horário</Label>
                <Input
                  id="schedule-time"
                  data-testid="schedule-form-time"
                  placeholder="19h"
                  value={form.time}
                  onChange={(event) => patch({ time: event.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="schedule-kind">Tipo</Label>
              <select
                id="schedule-kind"
                data-testid="schedule-form-kind"
                className={SELECT_CLASS}
                value={form.kind}
                onChange={(event) => patch({ kind: event.target.value as ScheduleKind })}
              >
                <option value="program">Programa</option>
                <option value="live">Ao vivo</option>
                <option value="podcast">Podcast</option>
                <option value="replay">Reapresentação</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="schedule-starts-at">Início exato (opcional, para alertas)</Label>
              <Input
                id="schedule-starts-at"
                data-testid="schedule-form-starts-at"
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) => patch({ startsAt: event.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className={CHECKBOX_CLASS}
                data-testid="schedule-form-premium"
                checked={form.premium}
                onChange={(event) => patch({ premium: event.target.checked })}
              />
              Conteúdo premium (exclusivo para assinantes)
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              data-testid="schedule-form-cancel"
              onClick={() => setFormOpen(false)}
            >
              Cancelar
            </Button>
            <Button data-testid="schedule-form-submit" onClick={handleSubmit}>
              {editingId ? "Salvar alterações" : "Criar programa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingRemove !== null} onOpenChange={(open) => !open && setPendingRemove(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover programa?</DialogTitle>
            <DialogDescription>
              O item sai da grade da home imediatamente. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRemove(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              data-testid="schedule-confirm-remove"
              onClick={confirmRemove}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
