# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.1.0] - 2026-09-18

### Corrigido
- **`src/lib/alerts.ts`**: Removido bloco `declare const ReactUseSyncExternalStore` duplicado (linhas 137-141) que colidia com o import nomeado real da linha 1, causando `ReferenceError: ReactUseSyncExternalStore is not defined` em runtime.
- **`src/pages/Home.tsx`**: Corrigido identificador corrompido `nullapsed` em `useState<"estreia" | "breaking" | null>(nullapsed)` → `null)` na linha 1269 (componente `HomeAlertCenter`). O byte corrompido gerava `ReferenceError: nullapsed is not defined` em runtime.
- **`src/pages/Home.tsx`**: Adicionado import `Bell` do `lucide-react` (era usado em `<Bell />` dentro de `HomeAlertCenter` mas não importado), corrigindo `ReferenceError: Bell is not defined`.

### Adicionado
- **`src/components/RadioPlayer.tsx`**: Novo componente `RadioPlayer` (exportado) com:
  - Tarja de breaking news mobile (`data-testid="player-breaking-bar"`) na borda inferior da barra do player.
  - Botão de mute global mobile (`data-testid="player-alert-mute"`) com ícone `Volume2`/`VolumeX`.
  - Reprodução de som de emergência **uma única vez** por breaking via `playAlertSound` (guarda por `id` do breaking em `useRef`).
  - Respeita mute global via `toggleAlertMuted` do `alerts.ts`.
  - Renderiza condicionalmente apenas quando há `breaking` ativo (compatível com teste 4.2b mobile).

### Testes
- **4/4 testes verdes** em `src/test/alerts.test.tsx` (Fase D — alertas de estreia e breaking news):
  - ✅ 4.1 — "Lembrar-me" de estreia (toast + sino + badge + som discreto 1×)
  - ✅ 4.2 — Breaking desktop (tarja vermelha pulsante + som emergência 1×)
  - ✅ 4.2a — Mute global respeitado
  - ✅ 4.2b — Breaking mobile (tarja inferior + mute global + som 1×)

## [1.0.0] - 2026-09-17

### Inicial
- Estrutura base do portal de notícias Web Rádio Vitória
- Player unificado (live, podcasts, vídeos/reels/stories)
- Sistema de alertas de estreia e breaking news (Fase D)
- Painel administrativo (anúncios, grade de programação)
- Integração WhatsApp (compartilhamento, pedidos de música, convites)
- Tema dark/light com `ThemeProvider`
- Testes com Vitest + Testing Library React

---

**Nota**: Este changelog cobre apenas as correções recentes da Fase D (alertas de estreia e breaking news). Para histórico completo, consulte `SYSTEM_HISTORY.md`.