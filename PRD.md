# PRD — Web Rádio Vitória Portal

**Versão**: 1.1.0  
**Data**: 2026-09-18  
**Status**: Em produção (Fase D concluída)

---

## 1. Visão Geral

### 1.1 Propósito
Portal editorial unificado da **Web Rádio Vitória** (Tupã, SP) que integra transmissão ao vivo, podcasts sob demanda, vídeos/reels/stories recomendados, sistema de alertas de estreia/breaking news e painel administrativo.

### 1.2 Público-Alvo
- **Ouvintes**: Acesso à transmissão ao vivo, podcasts, vídeos, notícias
- **Editores/Administradores**: Gestão de anúncios, grade de programação, breaking news

### 1.3 Diferenciais
- **Player unificado**: Live + Podcasts + Vídeos em uma única instância (estado persistido)
- **Alertas inteligentes**: Estreias (sino + toast + som discreto) + Breaking (tarja + som emergência)
- **Mute global sincronizado**: Player + Alertas respeitam preferência do usuário
- **Mobile-first**: Tarja breaking na borda inferior em mobile, topo em desktop

---

## 2. Requisitos Funcionais

### 2.1 Player Unificado (Core)

| ID | Requisito | Status |
|----|-----------|--------|
| RF-01 | Transmissão ao vivo contínua (stream HLS/MP3) | ✅ |
| RF-02 | Podcasts sob demanda com barra estilo Spotify | ✅ |
| RF-03 | Vídeos/Reels/Stories em mini-player flutuante | ✅ |
| RF-04 | Estado persistido ao minimizar/alternar (audioRef no Provider) | ✅ |
| RF-05 | Auto-play próximo ao finalizar (podcast → vídeo breaking) | ✅ |
| RF-06 | Controles: play/pause, seek ±15s, volume, taxa playback (0.75–2×) | ✅ |
| RF-07 | Equalizador visual (live/podcast/video) | ✅ |
| RF-08 | Like/curtida persistida (localStorage) | ✅ |
| RF-09 | Compartilhamento WhatsApp (link + mensagem) | ✅ |
| RF-10 | Pedido de música via WhatsApp | ✅ |
| RF-11 | Convite para assinatura (referral) | ✅ |

### 2.2 Sistema de Alertas (Fase D)

| ID | Requisito | Testes | Status |
|----|-----------|--------|--------|
| RF-20 | "Lembrar-me" de estreia → toast + sino + badge + som discreto 1× | 4.1 | ✅ |
| RF-21 | Breaking desktop → tarja topo pulsante + som emergência 1× | 4.2 | ✅ |
| RF-22 | Mute global (player + alertas) sincronizado | 4.2a | ✅ |
| RF-23 | Breaking mobile → tarja inferior + mute + som 1× | 4.2b | ✅ |
| RF-24 | Volume/sem som do editor respeitado | 4.2c | ✅ |

#### Detalhamento RF-20 (4.1 - Estreia)
- Usuário agenda "Lembrar-me" na grade → `remindStreakEntry()`
- Na hora marcada: toast lateral + sino no header com badge + som discreto 1×
- Clique no toast/sino → abre player/matéria
- Som toca **uma única vez** (guard por `id` do toast)

#### Detalhamento RF-21/23 (Breaking Desktop + Mobile)
- Editor marca conteúdo `breaking: true` → `pendingBreaking()`
- **Desktop**: Tarja vermelha pulsante no topo do banner (`home-breaking-ticker`)
- **Mobile**: Tarja na borda inferior da barra do player (`player-breaking-bar`)
- Texto: "Urgente / Aconteceu Agora / Breaking News"
- Som de emergência toca **uma única vez** por breaking (`playAlertSound` kind="breaking")
- Clique na tarja → abre matéria/player

#### Mute Global (RF-22)
- Toggle no header (sino) + player (volume) + mobile (tarja)
- Estado único em `alerts.ts` (`mutedAlert`) + `RadioPlayerContext` (`muted`)
- `playAlertSound({ muted: mutedAlert })` respeita preferência

### 2.3 Painel Administrativo

| ID | Requisito | Status |
|----|-----------|--------|
| RF-30 | Gestão de anúncios (criar/editar/excluir/ativar) | ✅ |
| RF-31 | Grade de programação (criar/editar/excluir/ordenar) | ✅ |
| RF-32 | Marcar `breaking: true` na grade | ✅ |
| RF-33 | Preview de anúncios/grade | ✅ |

### 2.4 Compartilhamento Social

| ID | Requisito | Status |
|----|-----------|--------|
| RF-40 | Compartilhar matéria/player via WhatsApp | ✅ |
| RF-41 | Pedido de música via WhatsApp | ✅ |
| RF-42 | Convite para assinatura (referral link) | ✅ |
| RF-43 | Comentários inline (live/podcast) | ✅ |

---

## 3. Requisitos Não-Funcionais

| ID | Requisito | Métrica |
|----|-----------|---------|
| RNF-01 | Performance | LCP < 2.5s, TTI < 3.5s |
| RNF-02 | Acessibilidade | WCAG 2.1 AA (Radix UI + ARIA) |
| RNF-03 | Responsivo | Mobile-first (320px–1440px+) |
| RNF-04 | Offline/Resiliente | Service Worker (futuro) |
| RNF-05 | SEO | Meta tags dinâmicas, sitemap |
| RNF-06 | Segurança | CSP, sanitização XSS, HTTPS only |
| RNF-07 | Testes | 100% cobertura alertas (Fase D) |

---

## 4. Arquitetura Técnica

### 4.1 Stack
- **Frontend**: React 18 + TypeScript + Vite 5
- **Styling**: Tailwind CSS + Radix UI (headless accessible)
- **State**: React Context (RadioPlayer, Theme) + `useSyncExternalStore` (alerts)
- **Routing**: React Router v6 (SPA + basename para GitHub Pages)
- **Data**: TanStack Query (cache) + localStorage (persistência)
- **Testes**: Vitest + Testing Library React + jsdom

### 4.2 Estrutura de Contextos
```
App
├── ThemeProvider (dark/light)
├── QueryClientProvider
├── TooltipProvider
├── RadioPlayerProvider (contexto global do player)
│   └── useRadioPlayer() → { streamUrl, liveOpen, livePlaying, togglePlay, ... }
└── AppRoutes (React Router)
    ├── Home (Portal + HomeAlertCenter)
    ├── Admin (Ads + Schedule)
    └── ...
```

### 4.3 Motor de Alertas (`src/lib/alerts.ts`)
- **Estado reativo**: `useSyncExternalStore` (React 18) → `useAlerts()` hook
- **Persistência**: localStorage (`radio.weekAlerts`) + estado em memória (sessão)
- **Som**: Delegado para `@/lib/audio-alert.ts` (`playAlertSound`)
- **Eventos**: `emit()` notifica listeners → re-render via `useSyncExternalStore`

### 4.4 Player (`src/components/RadioPlayer.tsx` + Context)
- **Provider**: `RadioPlayerProvider` expõe `useRadioPlayer()` API
- **Componentes**: `RadioPlayerBar` (desktop), `LiveMiniCard` (minimizado), `VideoBubble`, `FloatingPlayer`, `RadioPlayer` (mobile breaking)
- **Áudio**: `<audio>` vivo no Provider (nunca desmontado ao minimizar)
- **Estados**: `playing`, `muted`, `volume`, `playbackRate`, `nowPlaying`

---

## 5. Design System (Tailwind + Radix)

### 5.1 Cores (CSS Variables)
```css
:root {
  --background: 222 47% 11%;      /* neutral-950 */
  --foreground: 210 40% 98%;      /* neutral-50 */
  --brand: 14 100% 57%;           /* orange-500 */
  --live: 0 84% 60%;              /* red-500 */
  --card: 222 47% 15%;            /* neutral-900 */
  --border: 215 28% 17%;          /* neutral-800 */
}
```

### 5.2 Tipografia
- **Títulos**: `font-serif` (editorial) — `text-4xl` a `text-lg`
- **Corpo**: `font-sans` — `text-base` a `text-xs`
- **Kickers**: `editorial-kicker` (uppercase, tracking-widest, text-brand)

### 5.3 Componentes Base (Radix + Tailwind)
- `Button`, `Dialog`, `DropdownMenu`, `Tooltip`, `Toast`, `Tabs`, `Slider` (volume), `ScrollArea`

---

## 6. Testes (Vitest + Testing Library)

### 6.1 Estrutura
```
src/test/
├── alerts.test.tsx      # Fase D (4.1/4.2/4.2a/4.2b) — 4 testes
├── features.test.tsx    # RadioPlayer, useRadioPlayer, barra, mini-card
├── pages.test.tsx       # Home, Admin, rotas
└── utils.tsx            # renderWithProviders + RadioPlayerProvider
```

### 6.2 Helpers
```tsx
renderWithProviders(<Component />, { route: "/" })
// Inclui: MemoryRouter + RadioPlayerProvider
```

### 6.3 Comandos
```bash
npm test                    # Todos os testes
npm run test:watch          # Watch mode
npx vitest run src/test/alerts.test.tsx  # Apenas Fase D
```

---

## 7. Build & Deploy

### 7.1 Build Produção
```bash
npm run build
# Saída: dist/ (otimizado, minificado, code-splitting)
```

### 7.2 GitHub Pages (Basename)
- `basename` configurado via `import.meta.env.BASE_URL`
- Ex: `/news-ready-portal/` em produção

### 7.3 Variáveis de Build
```env
VITE_RADIO_STREAM_URL=https://shoutcast2.s12.com.br:16002/stream
```

---

## 8. Roadmap (Próximas Fases)

| Fase | Foco | Entregáveis |
|------|------|-------------|
| **E** | PWA + Offline | Service Worker, cache de áudio, install prompt |
| **F** | Analytics + Métricas | Play events, retention, breaking engagement |
| **G** | IA/Recomendação | Próximo conteúdo baseado em histórico |
| **H** | Multi-tenant | Múltiplas rádios no mesmo código base |

---

## 9. Apêndice — Correções Recentes (Fase D)

Ver `docs/FIXES_ALERTAS.md` para log técnico detalhado das correções:
- `nullapsed` → `null` em `HomeAlertCenter`
- Import `Bell` do `lucide-react`
- Remoção `declare const ReactUseSyncExternalStore` duplicado
- Criação do componente `RadioPlayer` mobile (4.2b)

---

**Aprovação**: ✅ 4/4 testes Fase D verdes | Build passing | Lint clean