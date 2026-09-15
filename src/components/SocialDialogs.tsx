/**
 * Ferramentas sociais de sobreposição — Vitória News.
 *
 * - `SocialBar`: barra horizontal (estilo YouTube) sobre lives, vídeos,
 *   imagens horizontais e matérias — curtir, comentar, compartilhar e
 *   convidar amigos para assinar.
 * - `SocialRail`: rail vertical (estilo Instagram) sobre reels, stories e
 *   imagens verticais — curtir, comentar, compartilhar, salvar e convidar.
 *
 * Os diálogos seguem o padrão do player: portados para o `document.body`
 * via `createPortal` (o overlay com `backdrop-blur` cria um containing
 * block que enterraria um modal `fixed inset-0`).
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bookmark,
  Check,
  Copy,
  Heart,
  MessageCircle,
  Send,
  Share2,
  UserPlus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { recordInvite, recordShare, useSocialItem } from "@/lib/social";

interface DialogProps {
  publicationId: string;
  title: string;
  onClose: () => void;
  message?: string;
}

/* -------------------------------------------------------------------------- */
/* Diálogo: comentários                                                       */
/* -------------------------------------------------------------------------- */

export function CommentDialog({ publicationId, title, onClose }: DialogProps) {
  const social = useSocialItem(publicationId);
  const [text, setText] = useState("");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    social.addComment(trimmed);
    setText("");
  };

  return (
    <DialogShell
      testId="comment-dialog"
      ariaLabel="Comentários"
      kicker="Comentários"
      title={title}
      onClose={onClose}
    >
      <ul data-testid="comment-list" className="mt-4 max-h-48 space-y-2 overflow-y-auto pr-1">
        {social.comments.length === 0 && (
          <li className="rounded-md border border-white/10 bg-neutral-800 px-3 py-2.5 text-xs text-neutral-400">
            Nenhum comentário ainda. Seja a primeira pessoa a comentar!
          </li>
        )}
        {social.comments.map((comment) => (
          <li
            key={comment.id}
            className="flex items-start gap-2.5 rounded-md border border-white/10 bg-neutral-800 px-3 py-2.5"
          >
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand">
              <MessageCircle className="h-3 w-3" />
            </span>
            <div className="min-w-0">
              <p className="text-xs leading-relaxed text-neutral-100">{comment.text}</p>
              <time className="text-[10px] text-neutral-500">
                {new Date(comment.createdAt).toLocaleString("pt-BR")}
              </time>
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          aria-label="Escreva um comentário"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Escreva um comentário…"
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-neutral-800 px-3 py-2 text-sm placeholder:text-neutral-500 focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Publicar comentário"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-brand text-brand-foreground transition-colors hover:bg-accent"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </DialogShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Diálogo: compartilhar                                                      */
/* -------------------------------------------------------------------------- */

const SHARE_NETWORKS = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    build: (url: string, text: string) =>
      `https://wa.me/?text=${encodeURIComponent(text)}%20${encodeURIComponent(url)}`,
  },
  {
    key: "facebook",
    label: "Facebook",
    build: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    key: "telegram",
    label: "Telegram",
    build: (url: string, text: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    key: "x",
    label: "X (Twitter)",
    build: (url: string, text: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
] as const;

function contentUrl(): string {
  return window.location.href || "https://brunoflacon.github.io/news-ready-portal/";
}

export function ShareContentDialog({ publicationId, title, message, onClose }: DialogProps) {
  const url = contentUrl();
  const shareText = message ?? `Assista na Vitória News: ${title}`;
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    // Registra o compartilhamento por "cópia de link" (sem abrir rede).
    await navigator.clipboard.writeText(url).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DialogShell
      testId="share-content-dialog"
      ariaLabel="Compartilhar conteúdo"
      kicker="Compartilhar"
      title={title}
      onClose={onClose}
    >
      <ul className="mt-4 space-y-2">
        {SHARE_NETWORKS.map((network) => (
          <li key={network.key}>
            <a
              href={network.build(url, shareText)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => recordShare(publicationId, network.key)}
              className="flex w-full items-center gap-3 rounded-md border border-white/10 bg-neutral-800 px-3 py-2.5 text-sm font-medium transition-colors hover:border-brand/60"
            >
              <Share2 className="h-4 w-4 flex-shrink-0 text-brand" />
              {network.label}
            </a>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={copyLink}
        className="mt-3 flex w-full items-center gap-3 rounded-md border border-white/10 bg-neutral-800 px-3 py-2.5 text-sm font-medium transition-colors hover:border-brand/60"
      >
        {copied ? <Check className="h-4 w-4 flex-shrink-0 text-brand" /> : <Copy className="h-4 w-4 flex-shrink-0 text-brand" />}
        {copied ? "Link copiado!" : "Copiar link"}
      </button>
    </DialogShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Diálogo: convidar para assinar                                             */
/* -------------------------------------------------------------------------- */

const INVITE_TEXT = (title: string, url: string) =>
  `Assine a Vitória News e acompanhe lives, podcasts e notícias em primeira mão. Não perca: ${title} — ${url}`;

export function InviteDialog({ publicationId, title, onClose }: DialogProps) {
  const url = contentUrl();
  const message = INVITE_TEXT(title, url);
  const [copied, setCopied] = useState(false);

  const copyInvite = () => {
    navigator.clipboard.writeText(message).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DialogShell
      testId="invite-dialog"
      ariaLabel="Convidar amigos para assinar"
      kicker="Convidar"
      title="Convide amigos para a Vitória News"
      onClose={onClose}
    >
      <p className="mt-3 text-xs leading-relaxed text-neutral-400">
        Leve amigos para acompanhar lives, podcasts e notícias em primeira mão.
        Assinantes têm acesso à área premium e reapresentações.
      </p>
      <ul className="mt-4 space-y-2">
        {SHARE_NETWORKS.map((network) => (
          <li key={network.key}>
            <a
              href={network.build(url, message)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => recordInvite(publicationId, network.key)}
              className="flex w-full items-center gap-3 rounded-md border border-white/10 bg-neutral-800 px-3 py-2.5 text-sm font-medium transition-colors hover:border-brand/60"
            >
              <UserPlus className="h-4 w-4 flex-shrink-0 text-brand" />
              Convidar via {network.label}
            </a>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={copyInvite}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-brand px-3 py-2.5 text-sm font-bold text-brand-foreground transition-colors hover:bg-accent"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Convite copiado!" : "Copiar convite"}
      </button>
      <p className="mt-3 flex items-center gap-1.5 text-[10px] text-neutral-500">
        <Heart className="h-3 w-3 text-brand" /> Cada convite registra um evento
        pronto para o banco de métricas.
      </p>
    </DialogShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Casca do diálogo (portal para o body)                                      */
/* -------------------------------------------------------------------------- */

interface DialogShellProps {
  testId: string;
  ariaLabel: string;
  kicker: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function DialogShell({ testId, ariaLabel, kicker, title, onClose, children }: DialogShellProps) {
  return createPortal(
    <div
      data-testid={testId}
      role="dialog"
      aria-label={ariaLabel}
      className="fixed inset-0 z-[95] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />
      <div className="relative w-full max-w-sm rounded-xl border border-white/10 bg-neutral-900 p-5 text-white shadow-2xl">
        <button
          type="button"
          aria-label="Fechar diálogo"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="editorial-kicker">{kicker}</p>
        <h3 className="mt-1 font-serif text-lg font-bold">{title}</h3>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */
/* Barra horizontal (estilo YouTube)                                          */
/* -------------------------------------------------------------------------- */

interface SocialBarProps {
  publicationId: string;
  title: string;
  /** Mantém a barra montada no DOM (para animar) e só alterna uma classe
      `pointer-events-none`/`opacity-0` quando invisível — assim ela fica
      pronta para reaparecer no hover/toque do visitante. */
  visible?: boolean;
  /** Chamado quando o visitante pede os comentários (o painel inline sobre o
      vídeo é controlado pelo player; o diálogo fica como fallback p/ podcast). */
  onOpenComments?: () => void;
}

export function SocialBar({ publicationId, title, visible = true, onOpenComments }: SocialBarProps) {
  const social = useSocialItem(publicationId);
  const [dialog, setDialog] = useState<"comments" | "share" | "invite" | null>(null);

  return (
    <>
      <div
        data-testid="social-bar"
        className={cn(
          "social-bar absolute bottom-20 right-4 z-20 flex items-center gap-1 transition-opacity duration-300 lg:bottom-24 lg:right-6",
          visible ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <SocialIconButton
          label={social.liked ? "Descurtir publicação" : "Curtir publicação"}
          pressed={social.liked}
          onClick={social.toggleLike}
        >
          <Heart className={cn("h-[18px] w-[18px] social-icon-shadow", social.liked && "fill-red-500 text-red-500")} />
          <SocialCount value={social.likesCount} testId="social-likes-count" />
        </SocialIconButton>
        <SocialIconButton
          label="Comentar publicação"
          onClick={() => (onOpenComments ? onOpenComments() : setDialog("comments"))}
        >
          <MessageCircle className="h-[18px] w-[18px] social-icon-shadow" />
          <SocialCount value={social.comments.length} testId="social-comments-count" />
        </SocialIconButton>
        <SocialIconButton label="Compartilhar publicação" onClick={() => setDialog("share")}>
          <Share2 className="h-[18px] w-[18px] social-icon-shadow" />
        </SocialIconButton>
        <SocialIconButton label="Convidar amigos para assinar" onClick={() => setDialog("invite")}>
          <UserPlus className="h-[18px] w-[18px] social-icon-shadow" />
          <span className="text-[11px] font-semibold">Convidar</span>
        </SocialIconButton>
      </div>

      {dialog === "comments" && <CommentDialog publicationId={publicationId} title={title} onClose={() => setDialog(null)} />}
      {dialog === "share" && (
        <ShareContentDialog
          publicationId={publicationId}
          title={title}
          message={`Assista na Vitória News: ${title}`}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "invite" && <InviteDialog publicationId={publicationId} title={title} onClose={() => setDialog(null)} />}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Rail vertical (estilo Instagram)                                           */
/* -------------------------------------------------------------------------- */

interface SocialRailProps {
  publicationId: string;
  title: string;
  /** Comentários abrem no painel inline à esquerda do vídeo (item 3.3). */
  onOpenComments?: () => void;
}

export function SocialRail({ publicationId, title, onOpenComments }: SocialRailProps) {
  const social = useSocialItem(publicationId);
  const [dialog, setDialog] = useState<"share" | "invite" | null>(null);

  return (
    <>
      <div
        data-testid="social-rail"
        className="social-rail absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-stretch gap-3"
      >
        <SocialIconButton
          label={social.liked ? "Descurtir publicação" : "Curtir publicação"}
          pressed={social.liked}
          onClick={social.toggleLike}
        >
          <SocialCount value={social.likesCount} testId="social-likes-count" className="min-w-6 text-right" />
          <Heart className={cn("h-[22px] w-[22px] social-icon-shadow", social.liked && "fill-red-500 text-red-500")} />
        </SocialIconButton>
        <SocialIconButton
          label="Comentar publicação"
          onClick={() => (onOpenComments ? onOpenComments() : setDialog("comments"))}
        >
          <SocialCount value={social.comments.length} testId="social-comments-count" className="min-w-6 text-right" />
          <MessageCircle className="h-[22px] w-[22px] social-icon-shadow" />
        </SocialIconButton>
        <SocialIconButton label="Compartilhar publicação" onClick={() => setDialog("share")}>
          <Share2 className="h-[22px] w-[22px] social-icon-shadow" />
        </SocialIconButton>
        <SocialIconButton
          label={social.saved ? "Remover dos salvos" : "Salvar publicação"}
          pressed={social.saved}
          onClick={social.toggleSave}
        >
          <Bookmark className={cn("h-[22px] w-[22px] social-icon-shadow", social.saved && "fill-brand text-brand")} />
        </SocialIconButton>
        <SocialIconButton label="Convidar amigos para assinar" onClick={() => setDialog("invite")}>
          <UserPlus className="h-[22px] w-[22px] social-icon-shadow" />
        </SocialIconButton>
      </div>

      {dialog === "share" && (
        <ShareContentDialog
          publicationId={publicationId}
          title={title}
          message={`Assista na Vitória News: ${title}`}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "invite" && <InviteDialog publicationId={publicationId} title={title} onClose={() => setDialog(null)} />}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Painel inline de comentários (item 3.3)                                    */
/* - Fica sobre o vídeo, alinhado à ESQUERDA (na vertical sobre o reel, na     */
/*   horizontal acima da barra de ações), para não competir com o rail/barra.  */
/* - Lista, campo de texto e envio em um só painel; fechar pelo X.             */
/* -------------------------------------------------------------------------- */

interface InlineCommentsProps {
  publicationId: string;
  title: string;
  onClose: () => void;
  /** Classes de posicionamento sobre o vídeo (vertical/horizontal). */
  className?: string;
  /** Mostra a tarja "AO VIVO" no topo (chat de transmissão/superchat). */
  live?: boolean;
}

export function InlineComments({ publicationId, title, onClose, className, live }: InlineCommentsProps) {
  const social = useSocialItem(publicationId);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLUListElement>(null);

  // Sempre rola para o comentário mais recente quando a lista cresce.
  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [social.comments.length]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    social.addComment(trimmed);
    setText("");
  };

  return (
    <div
      data-testid="inline-comments"
      className={cn(
        "social-comments-panel flex w-72 max-w-[70%] flex-col justify-end rounded-xl border border-white/10",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 rounded-t-xl border-b border-white/10 bg-neutral-900/90 px-3 py-2">
        <span className="flex min-w-0 items-center gap-2">
          {live && (
            <span
              data-testid="inline-comments-live-badge"
              className="inline-flex flex-shrink-0 items-center gap-1 rounded-sm bg-live px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-live-foreground"
            >
              <span className="h-1 w-1 animate-pulse rounded-full bg-live-foreground" />
              AO VIVO
            </span>
          )}
          <span className="truncate text-[10px] font-bold uppercase tracking-widest text-neutral-300">
            Comentários • {title}
          </span>
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar comentários"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul
        ref={listRef}
        data-testid="comment-list"
        className="max-h-44 space-y-2 overflow-y-auto bg-neutral-900/90 px-3 py-3"
      >
        {social.comments.length === 0 && (
          <li className="rounded-md border border-white/10 bg-neutral-800 px-3 py-2.5 text-xs text-neutral-400">
            Nenhum comentário ainda. Seja a primeira pessoa a comentar!
          </li>
        )}
        {social.comments.map((comment) => (
          <li
            key={comment.id}
            className="flex items-start gap-2.5 rounded-md border border-white/10 bg-neutral-800 px-3 py-2.5"
          >
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand">
              <MessageCircle className="h-3 w-3" />
            </span>
            <div className="min-w-0">
              <p className="text-xs leading-relaxed text-neutral-100">{comment.text}</p>
              <time className="text-[10px] text-neutral-500">
                {new Date(comment.createdAt).toLocaleString("pt-BR")}
              </time>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="flex gap-2 rounded-b-xl border-t border-white/10 bg-neutral-900/90 p-3">
        <input
          aria-label="Escreva um comentário"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Escreva um comentário…"
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Publicar comentário"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-brand text-brand-foreground transition-colors hover:bg-accent"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Botões de ícone compartilhados                                             */
/* -------------------------------------------------------------------------- */

interface SocialIconButtonProps {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function SocialIconButton({ label, pressed, onClick, children }: SocialIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed ?? undefined}
      title={label}
      className="flex items-center gap-1.5 p-1.5 text-white transition-colors hover:text-brand"
    >
      {children}
    </button>
  );
}

function SocialCount({ value, testId, className }: { value: number; testId: string; className?: string }) {
  return (
    <span data-testid={testId} className={cn("social-count-shadow text-[11px] font-semibold tabular-nums", className)}>
      {value > 0 ? value : ""}
    </span>
  );
}