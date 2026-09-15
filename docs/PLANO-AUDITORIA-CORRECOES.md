# Plano de Auditoria e Correções — Vitória News

> Status: **em execução** · Área: layout/player/mobile · Repo: news-ready-portal
>
> Progresso:
> - ✅ **Onda 1** (1.1, 1.2) — commit `e60ff39` — transporte no padrão YouTube/Spotify
>   (voltar 15s à esquerda do play) + seletor de velocidade compacto "1×" com menu, no
>   centro após "Avançar 15s".
> - ✅ **Onda 2** (2.1, 2.2, 2.3, 3.1) — commit `7249c54` — rail vertical com CSS limpo
>   (sem backdrop-blur/shadow/border) e contadores à esquerda dos ícones; reels 9:16
>   preenchem a altura do banner e vídeos 16:9 voltam a preencher a tela (regressão do
>   wrapper `relative` corrigida com `h-full w-full` + `w-fit` no vertical).
> - ✅ **Onda 3 parcial** (3.2, 3.3) — commit `91b0737` — barra horizontal recolhe
>   (`pointer-events-none opacity-0`) após curtir/comentar e **reaparece no
>   hover/toque/clique**; comentários abrem em **painel inline à esquerda do vídeo**
>   (lista + campo + enviar + fechar, rolagem para o novo comentário) no 16:9 e no
>   9:16, substituindo o diálogo central no player; ao escolher reel/story na faixa
>   de entretenimento a página **rola suavemente até o banner** (`scrollIntoView`);
>   rail/barra usam classe CSS própria `social-rail`/`social-bar` (o `p-2`/
>   `bg-black/60` apareciam "desativadas" no DevTools) e ícones/contadores ganham
>   sombra de contorno de 1px (`social-icon-shadow`/`social-count-shadow`).
> - ✅ **Onda 3 parcial** (3.4) — **superchat ao vivo**: lives de vídeo ganham
>   tarja "AO VIVO" no painel de comentários + botão no canto direito que alterna
>   abrir/recolher (`MessageCircle`/`ChevronDown`) com `aria-pressed`; a **rádio
>   ao vivo** (`RadioPlayerBar`) ganha botão "Comentar na transmissão" ao lado de
>   "Mais opções" abrindo o chat como overlay acima da barra (`bottom-full` canto
>   direito); comentários persistem via `useSocialItem`/`addComment`.

Este plano cobre erros, bugs, lags e problemas de layout relatados pelo editor, com
foco no player do banner gigante, nas barras sociais, no player de podcast e na
experiência mobile (celular). Cada item traz: problema → causa raiz (com referência
de arquivo:linha) → correção planejada → arquivos afetados → critério de aceite.

---

## 0. Resumo executivo

| Prioridade | Qtd | Resumo |
| --- | --- | --- |
| P0 | 2 | Transporte do podcast (ordem dos botões) + seletor de velocidade com menu |
| P0 | 3 | Rail vertical: CSS limpo, contadores à esquerda, vídeos 9:16 preenchendo altura |
| P1 | 3 | Barra horizontal reaparece no hover; comentários estilo YouTube à esquerda; superchat/ícones de recolher em lives |
| P1 | 2 | Vídeos 16:9 voltam a preencher a tela (regressão do wrapper `relative`) + enquadramento 16:9 → 9:16 respeitando o conteúdo |
| P2 | 2 | Auditoria mobile completa + seção reels/podcasts sem conteúdo "passando" |

---

## 1. P0 — Player de podcast (barra inferior estilo Spotify)

### 1.1 Botão "Voltar 15s" do lado errado do play/pause

- **Problema:** o botão "Voltar 15 segundos" (ícone `ChevronLeft`, seta para a
  esquerda) aparece **depois** do play/pause — seta apontando para trás do lado
  direito é visualmente errado (padrão YouTube/Spotify: voltar à esquerda do play).
- **Causa raiz:** `src/components/RadioPlayer.tsx:1358-1410` — ordem atual do
  transporte: `[Anterior] [Play/Pause] [Voltar 15s] [Avançar 15s] [Próximo]`.
- **Decisão do editor (confirmada):** seguir o **padrão YouTube/Spotify** —
  "voltar" (seta ←) à **ESQUERDA** do play, "avançar" (seta →) à direita.
- **Correção planejada:** reordenar para:
  `[Anterior] [Voltar 15s] [Play/Pause] [Avançar 15s] [Próximo]`.
- **Arquivos:** `src/components/RadioPlayer.tsx` (NowPlayingBar).
- **Critério de aceite:** a ordem DOM/visual é `voltar → play → avançar`; os
  `aria-label` continuam os mesmos, então os testes existentes
  (`features.test.tsx` → "avança e volta 15 segundos no episódio") não quebram.
- **Nota de UX:** o mesmo padrão deve valer no `VideoBubble`
  (`RadioPlayer.tsx:1810-1825`), que hoje também usa `ChevronLeft` após transportes.

---

### 1.2 Seletor de velocidade: mover para o centro, compacto, com menu

- **Problema:** o botão de velocidade fica no grupo da **direita** (ao lado do
  volume) e **cicla** as taxas a cada clique — o editor quer: (a) posição no
  **centro**, logo depois do "Avançar 15s"; (b) botão **compacto** mostrando só a
  taxa atual ("1×"); (c) tocar abre **menu** com as outras opções (0.75× … 2×).
- **Causa raiz:** `RadioPlayer.tsx:1449-1457` — botão no grupo direito com
  `onClick={onCycleRate}` (ciclo) e rótulo `{playbackRate}×`.
- **Decisão do editor (confirmada):** o seletor **sai do grupo direito** e vai
  para o **centro, logo após "Avançar 15s"** (padrão YouTube Music); o volume
  permanece sozinho no grupo direito.
- **Correção planejada:**
  1. Remover o botão do grupo direito (o volume fica ao lado das ações sociais,
     sem o seletor de velocidade entre eles);
  2. Inserir no transporte central após "Avançar 15s" um botão compacto
     (`px-2 h-8`, texto "1×" apenas, sem ícone Gauge);
  3. Trocar `onCycleRate` por um **menu/popover** vertical (padrão
     `DropdownMenu` da UI existente ou painel próprio com `data-testid`) listando
     `PLAYBACK_RATES` com check na taxa ativa;
  4. Manter `aria-label="Velocidade de reprodução"` no botão e
     `aria-label="Velocidade 1.25x"` (ou similar) nos itens do menu.
- **Arquivos:** `src/components/RadioPlayer.tsx`; `src/contexts/RadioPlayerContext.tsx`
  (prop `onCycleRate` → `onSetPlaybackRate` ou manter API e apenas trocar o ciclo
  por seleção direta com `setPlaybackRate`).
- **Critério de aceite:** clicar em "1×" abre o menu; escolher "1.25×" fecha o menu,
  aplica na mídia (`audio.playbackRate`) e o botão passa a exibir "1.25×".
- **Teste afetado:** `features.test.tsx` → "altera a velocidade de reprodução em
  ciclo e aplica na mídia" precisa ser reescrito: abrir menu → clicar em 1.25× →
  assertar rótulo e `playbackRate`. O mesmo para o `VideoBubble`
  (`RadioPlayer.tsx:1834-1842`).

---

## 2. P0 — Rail vertical (reels/stories) e vídeos 9:16

### 2.1 CSS do rail: apagar classes "desativadas" e aplicar configuração limpa

- **Status:** ✅ implementado (Onda 2, commit `7249c54` + Onda 3, commit `91b0737`).
- **Problema:** o editor inspecionou o elemento `[data-testid="social-rail"]` e
  encontrou várias regras CSS marcadas como desativadas/sobrescritas
  (`/* ... */` no DevTools): `backdrop-blur-md`, `shadow-2xl`, `border`,
  `border-white/10`, `bg-black/50`, `px-2.5`, `py-4` — além de um
  `element.style { padding-top: unset; padding-right: 0px }` vindo de herança
  conflitante. Na Onda 3, o mesmo sintoma apareceu para `p-2` e `bg-black/60`
  no rail **e na barra horizontal**: o editor reportou as regras `/* ... */`
  no DevTools dos vídeos verticais 9:16. O projeto usa **Tailwind v3 + PostCSS**
  (`src/index.css` com `@tailwind base/components/utilities`), portanto o
  "desativado" entre `/* */` no DevTools equivale a regra de utilitário
  sobrescrita por outro seletor ou por `element.style` inline.
- **Causa raiz:** `SocialDialogs.tsx:369-372` — classe longa
  `"absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center
  gap-4 rounded-full border border-white/10 bg-black/50 px-2.5 py-4 shadow-2xl
  backdrop-blur-md"`. A sobreposição de utilitários + possível estilo inline/
  herança de `padding` faz partes dela ficarem "cinzas" (desativadas) no
  DevTools, indicando CSS frágil/ambíguo.
- **Correção planejada:**
  1. **Apagar** as classes utilitárias com comportamento frágil no rail:
     `backdrop-blur-md`, `shadow-2xl`, `border`, `border-white/10`, `px-2.5`,
     `py-4` (Onda 2);
  2. **Definitivo (Onda 3):** extrair `padding`/`border-radius`/`background`
     para classes CSS próprias fora do `@layer` — `.social-rail` (rail) e
     `.social-bar` (barra horizontal) no final de `src/index.css`, no mesmo
     padrão de `.max-w-3xl` — assim **nenhum** utilitário `p-2`/`bg-black/60`
     fica mais sujeito a ser "desativado" por precedência de camadas;
  3. Garantir que **nenhum** `element.style` inline seja aplicado no componente
     (remover qualquer `style=` residual e evitar herança de `padding` via CSS
     reset no PostCSS — verificar `src/index.css` e `tailwind` config);
  4. Revisar o mesmo tratamento no `SocialBar` (`SocialDialogs.tsx:316`), que
     usava `backdrop-blur-md` + `shadow-2xl` com o mesmo risco.
- **Arquivos:** `src/components/SocialDialogs.tsx`; `src/index.css` (classes
  `.social-rail`/`.social-bar`); `tailwind.config.ts`/`postcss.config.js`.
- **Critério de aceite:** no DevTools, o `social-rail` (e `social-bar`) não
  exibem regras desativadas entre `/* */` e não há `element.style` sobrescrevendo
  padding; visual idêntico entre md/desktop e mobile.

---

### 2.2 Rail vertical: contadores à ESQUERDA dos ícones

- **Status:** ✅ implementado (Onda 2, commit `7249c54`).
- **Problema:** no rail vertical, a contagem exibida (curtidas, comentários,
  compartilhamentos, salvamentos, indicações) aparece **à direita** do SVG
  (`<Heart/><span>1</span>`). O editor quer o número **antes** (à esquerda) do
  ícone, padrão YouTube (número posicionado à esquerda do ícone).
- **Causa raiz:** `SocialDialogs.tsx:373-397` — `SocialIconButton` recebe
  `children` na ordem `[ícone, SocialCount]` e o flex-row coloca o contador à
  direita (linhas 425-438).
- **Correção planejada:** inverter a ordem no rail: contador primeiro, ícone
  depois (`<SocialCount/><Heart/>`), e alinhar o bloco com `text-right`
  (números alinhados à direita na coluna) ou com largura fixa do contador para
  não "pular" ao mudar de 1 para 10. O `SocialBar` horizontal mantém o padrão
  atual (ícone → número), pois ali é leitura horizontal estilo YouTube.
- **Arquivos:** `src/components/SocialDialogs.tsx` (SocialRail apenas).
- **Critério de aceite:** no rail 9:16, a contagem fica à esquerda do SVG em
  todos os botões (curtir, comentar, compartilhar, salvar, convidar), sem
  reflow visível ao incrementar.
- **Teste afetado:** nenhum quebra (os testes usam `aria-label`); adicionar
  asserção DOM para a ordem dos filhos se desejado.

---

### 2.3 Reels/stories 9:16 precisam preencher a ALTURA do banner gigante

- **Status:** ✅ implementado (Onda 2, commit `7249c54`).
- **Problema:** vídeos verticais (reels/stories) ficam pequenos no banner do
  player — não ocupam a altura do banner gigante.
- **Causa raiz:** `YouTubePlayer.tsx:589-592` — para vertical:
  `aspect-[9/16] h-full w-auto`. Dentro do flex
  `items-center justify-center` de `Home.tsx:133-147`, o `h-full` do wrapper
  `relative` (sem altura definida) colapsa para o conteúdo → o vídeo vertical
  dimensiona pela largura (`w-auto`), ficando menor que o banner
  (`min-h-[640px]`, `Home.tsx:398`).
- **Correção planejada:**
  1. No wrapper `relative` de `Home.tsx:134`, garantir altura total:
     `className="relative h-full w-full"` (ou `flex h-full items-center
     justify-center`) — hoje o wrapper só tem `relative`;
  2. No `YouTubePlayer` vertical, manter `aspect-[9/16]` mas com
     `max-h-full`/`h-full` dentro do flex para preencher a altura quando a tela
     é alta; usar `h-full w-auto` já existente e adicionar
     `max-w-full` para segurança;
  3. Revisar `Home.tsx:133` para que o container do vídeo seja
     `absolute inset-0 z-10 flex h-full w-full items-center justify-center`
     (a classe `h-full w-full` no wrapper filho resolve a regressão).
- **Arquivos:** `src/pages/Home.tsx` (WatchOverlay); `src/components/YouTubePlayer.tsx`.
- **Critério de aceite:** ao abrir um reel/story, o vídeo preenche a altura do
  banner (mesma sensação de um app de reels), com largura proporcional e sem
  distorção (`object-contain` para preservar o enquadramento).

---

## 3. P1 — Barras sociais, comentários e lives

### 3.1 Vídeos horizontais 16:9 voltam a preencher a tela (regressão)

- **Status:** ✅ implementado (Onda 2, commit `7249c54`).
- **Problema:** vídeos 16:9 não preenchem mais a tela como antes do commit
  `110d911` (que introduziu o wrapper `relative` para o rail).
- **Causa raiz:** `Home.tsx:130-147` — o `<div className="relative">` passou a
  envolver o `YouTubePlayer` (que usa `h-full w-full`). O wrapper sem altura
  definida rompe a cadeia `h-full` → o player colapsa.
- **Correção planejada:** `wrapper` com `h-full w-full` (ver item 2.3, mesmo
  ajuste). Para horizontais também aplicar `h-full w-full` no wrapper e manter
  `object-cover` no vídeo horizontal (já configurado em
  `YouTubePlayer.tsx:625-628`), exceto no modo teatro/fullscreen onde
  `object-contain` é intencional.
- **Arquivos:** `src/pages/Home.tsx`; conferir `YouTubePlayer.tsx:623-630`.
- **Critério de aceite:** vídeo 16:9 cobre o banner inteiro (desktop e mobile),
  sem barras pretas laterais e sem que o rail vertical escape da borda do vídeo.

---

### 3.2 Barra horizontal (curtir/comentar/compartilhar/indicar) reaparece no hover

- **Status:** ✅ implementado (Onda 3, commit `91b0737`).

- **Problema:** depois de curtir, a barra some **permanentemente**
  (`hideSocialBar = social.liked || social.comments.length > 0`) e o visitante
  não consegue mais compartilhar/comentar/indicar.
- **Causa raiz:** `Home.tsx:100-103` e `202-204` — `hidden` não é revertido.
- **Correção planejada:** nova dinâmica:
  1. A barra horizontal fica visível quando a UI está visível (`uiVisible`) e o
     ponteiro/touch está sobre o vídeo (`onMouseEnter`/`onTouchStart` já existem
     no overlay, `Home.tsx:120-122`);
  2. Depois de curtir, a barra **continua aparecendo** enquanto houver hover;
     sem hover, esconde junto com os controles (auto-hide de 10s,
     `UI_HIDE_MS = 10_000`, `Home.tsx:41`);
  3. Manter a transição de opacidade do YouTubePlayer (`showControls={uiVisible}`)
     e aplicar a mesma regra à barra: classe
     `transition-opacity` + `opacity-0/100` conforme `uiVisible`, **sem
     remover o elemento do DOM** (para não perder cliques em comentar/indicar
     após curtir).
- **Arquivos:** `src/pages/Home.tsx` (WatchOverlay); `src/components/SocialDialogs.tsx`
  (prop `hidden` → prop `visible`/`opacity`).
- **Critério de aceite:** curtir → barra se esconde com os controles; passar o
  mouse (ou tocar) → barra reaparece e os 4 botões funcionam normalmente.
- **Teste afetado:** `social-ui.test.tsx` → "curtir na barra alterna o estado e
  persiste (localStorage)" — hoje espera `social-bar` **não** estar no DOM após
  curtir; reescrever para: curtir → barra some visualmente → `mouseEnter` no
  overlay → barra volta; localStorage persiste.

---

### 3.3 Comentários estilo YouTube (lateral esquerda, rolagem de baixo para cima)

- **Status:** ✅ implementado (Onda 3, commit `91b0737`).

- **Problema:** hoje os comentários abrem em **diálogo central** (`CommentDialog`,
  `SocialDialogs.tsx:41-104`). O editor quer o padrão YouTube: painel de
  comentários na **lateral esquerda do vídeo**, com o feed rolando **de baixo
  para cima** (novos comentários entram embaixo e empurram os antigos para cima),
  tanto para reels/stories 9:16 quanto para vídeos/lives 16:9.
- **Correção planejada:**
  1. Criar componente `InlineComments` (ao lado de `SocialDialogs` ou dentro do
     `WatchOverlay`): painel absoluto `left-4 bottom-20 z-30 w-72 max-h-[50%]`
     com `flex flex-col justify-end` (itens ancorados embaixo);
  2. Lista com `overflow-y-auto` + rolagem automática para o fim quando um novo
     comentário entra (padrão chat ao vivo);
  3. Input de comentário fixo no rodapé do painel (estilo YouTube Live chat) —
     reutiliza `useSocialItem(...).addComment`;
  4. Substituir o `CommentDialog` (diálogo central) pelo painel inline no
     overlay do player; manter o diálogo apenas como fallback quando o
     comentário é aberto pela barra de podcast (fora do player).
- **Arquivos:** novo `src/components/InlineComments.tsx`; `src/pages/Home.tsx`
  (WatchOverlay); `src/components/SocialDialogs.tsx` (rail/barra abrem o painel
  inline, não o diálogo).
- **Critério de aceite:** ao clicar em "Comentar publicação" no rail/barra, o
  painel abre à esquerda do vídeo; ao publicar, o comentário surge embaixo e o
  feed rola de baixo para cima; funciona em 9:16 e 16:9, desktop e mobile.
- **Teste afetado:** `social-ui.test.tsx` → "abre o diálogo de comentários e
  publica um comentário" — trocar `comment-dialog` pelo novo `inline-comments`.

---

### 3.4 Superchat e comentários ao vivo (live vídeo + rádio ao vivo)

- **Status:** ✅ implementado.

- **Problema:** em lives (vídeo ao vivo e rádio/áudio ao vivo) não há chat ao
  vivo nem superchat. O editor quer: um **ícone de comentários** para o usuário
  clicar e comentar, e um **ícone para recolher/esconder** a aba de comentários
  ao vivo (toggle abrir/recolher).
- **Correção planejada:**
  1. **Live de vídeo (kind === "live"):** sobrepor o `InlineComments` no lado
     esquerdo (item 3.3) com badge "AO VIVO"; no canto direito da barra de
     controles, botões `MessageCircle` (abrir) e `ChevronDown`/`X` (recolher),
     com `aria-pressed` para o estado aberto;
  2. **Rádio ao vivo (`RadioPlayerBar`, `RadioPlayer.tsx:889+`):** adicionar o
     botão de comentários ao lado do botão "Mais opções" (linha 975) que abre o
     painel de chat como overlay **acima da barra** (painel absoluto
     `bottom-full` canto direito), com `aria-label="Comentar na transmissão"` e
     botão recolher com `aria-label="Recolher comentários"`;
  3. Os comentários usam a mesma fila de eventos (`useSocialItem`/`addComment`)
     já pronta para o banco (plano de banco: superchat via Mercado Pago).
- **Implementação:** `InlineComments` ganhou a prop `live?: boolean` (tarja
  "AO VIVO" no cabeçalho, barra `bg-live` com pulso); no `WatchOverlay` o
  `InlineComments` recebe `live={item.kind === "live"}` e, para lives, um botão
  flutuante no canto direito alterna `commentsOpen` com
  `aria-label` "Comentar na transmissão"/"Recolher comentários" e `aria-pressed`;
  na `RadioPlayerBar` há um botão ao lado de "Mais opções" que abre o
  `InlineComments` como overlay `absolute bottom-full right-0` acima da barra
  (`publicationId="radio-live"`, persiste em localStorage).
- **Arquivos:** `src/pages/Home.tsx` (WatchOverlay live); `src/components/RadioPlayer.tsx`
  (RadioPlayerBar); `src/components/SocialDialogs.tsx` (InlineComments).
- **Critério de aceite:** na live de vídeo e na rádio, o ícone de comentário
  abre o chat, o ícone de recolher esconde a aba, e o estado abre/recolhido fica
  visível (aria-pressed). Comentar publica e persiste em localStorage.
- **Testes:** `social-ui.test.tsx` → "Superchat e comentários ao vivo (Onda
  3.4) — live de vídeo"; `features.test.tsx` → "na rádio ao vivo, 'Comentar na
  transmissão' abre o chat acima da barra (com tarja AO VIVO) e recolhe".

---

### 3.5 Vídeos horizontais 16:9 apresentados como verticais 9:16 (respeitando o enquadramento)

- **Problema:** vídeos 16:9 hoje são exibidos apenas no formato horizontal
  preenchendo o banner. O editor quer que eles possam ser **enquadrados como
  verticais 9:16** (padrão reels/Shorts) **sempre respeitando o enquadramento
  original** — ou seja: sem cortar/distorcer o conteúdo e com toda a UI
  (player, barra lateral de interação, superchat e comentários) seguindo a
  experiência do YouTube.
- **Causa raiz:** `YouTubePlayer.tsx` só tem dois modos de layout —
  horizontal (`aspect-video`/`h-full w-full` com `object-cover`) e vertical
  (`aspect-[9/16] h-full w-auto`); não há modo "encaixar 16:9 dentro de 9:16".
- **Correção planejada:**
  1. Adicionar modo de exibição do player acionável pelo usuário: botão de
     alternância de proporção (reels/horizontal) na barra de controles
     (junto ao teatro/tela cheia, `YouTubePlayer.tsx:551-565`);
  2. No modo vertical 9:16 com vídeo 16:9:
     - usar `object-contain` (não `cover`) sobre fundo escuro, para **nunca
       cortar** o enquadramento original — padrão YouTube Shorts com vídeo
       paisagem;
     - ou `object-cover` opcional (preenche 9:16 cortando) apenas se o editor
       aprovar, configurável por flag;
  3. Garantir que a `SocialRail` (lateral direita), o `InlineComments` (item
     3.3) e o superchat acompanhem o container vertical, sem esconder o vídeo;
  4. Manter o comportamento em modo retrato no mobile: quando a tela é alta
     (portrait), o 16:9 também entra no modo reels citado acima
     (`media`/`useMediaQuery` para `orientation: portrait`).
- **Arquivos:** `src/components/YouTubePlayer.tsx`; `src/pages/Home.tsx`
  (WatchOverlay); `src/components/SocialDialogs.tsx` (rail/comentários se
  adaptam ao modo vertical).
- **Critério de aceite:** alternar para o modo 9:16 mantém o vídeo 16:9
  totalmente visível (sem corte), as barras de interação ficam como em reels e
  o layout segue o padrão YouTube em portrait e desktop.
- **Teste afetado:** adicionar teste em `social-ui.test.tsx`/`features.test.tsx`
  para a alternância de proporção preservar o `src` do vídeo e trocar as
  classes de layout.

---

## 4. P2 — Auditoria mobile e seções reels/podcasts

### 4.1 Auditoria geral do mobile (navegação, lags, layout)

- **Objetivo:** site no celular se comporta como app moderno: conteúdo legível,
  sem corte de layout, navegação ágil, sem lags.
- **Checklist de auditoria (itens a verificar/corrigir):**
  1. **Header** (`SiteHeader.tsx:37-100`): menu mobile usa `absolute top-full
     w-56` — verificar que não invade o banner; `truncate` na marca evita
     overflow; conferir alvo de toque ≥ 44px;
  2. **Banner gigante** (`Home.tsx:398`): `min-h-[640px]` pode exceder telas
     pequenas (iPhone SE ~667px) → usar `min-h-[100svh]`/`svh` com fallback e
     `max-h` condicional; o overlay `fixed inset-0 z-[90]` em telas pequenas
     deve cobrir o viewport (já é fixed);
  3. **Rail horizontal** (`MediaRail.tsx:31,61`): cards `w-[82vw]`/`w-[72vw]`
     com `snap-x` — conferir que não geram scroll vertical nem corte na base
     (imagens `aspect-video`/`aspect-[9/14]` + legenda);
  4. **Fonte/legibilidade:** verificar `font-size` mínima (14px em conteúdo,
     `text-[10px]` só em badges) e contraste dos textos overlay sobre o vídeo;
  5. **Lags:** `backdrop-blur-xl` no header fixo + `backdrop-blur-md` em várias
     camadas podem causar repaint caro em Android de entrada — medir e, onde
     possível, trocar por fundos sólidos (`bg-background/95` → `bg-background`);
     as animações `ambient-blob` com `filter: blur(70px)` são pesadas →
     considerar `will-change: transform` (já existe) e pausar com
     `prefers-reduced-motion` (já existe);
  6. **Viewport/zoom:** confirmar `<meta name="viewport" content="width=device-width,
     initial-scale=1">` no `index.html` e `overflow-x: clip` global para impedir
     "scroll horizontal fantasma";
  7. **Safe areas:** padding inferior para `env(safe-area-inset-bottom)` nas
     barras fixas (NowPlayingBar, RadioPlayerBar) em iPhones com notch.
- **Arquivos:** `src/index.html`, `src/index.css`, `src/components/SiteHeader.tsx`,
  `src/pages/Home.tsx`, `src/components/MediaRail.tsx`, `src/components/RadioPlayer.tsx`,
  `src/components/YouTubePlayer.tsx`.
- **Critério de aceite:** navegação completa no celular (Home → Notícias →
  Artigo, abrir live/podcast/reel) sem scroll horizontal, sem corte de
  conteúdo, com 60fps razoável no DevTools mobile.

---

### 4.2 Seção de podcasts/reels/stories no mobile sem conteúdo "passando"

- **Problema:** o editor relata conteúdos "passando" (vazando/cortando) na seção
  de podcasts, reels e stories no celular.
- **Causa provável:** `MediaRail.tsx` usa `overflow-x-auto` com cards largos
  (`w-[82vw]`, `w-[72vw]`) dentro de seções que podem herdar largura maior que o
  viewport; e os cards de podcast (seção de programação) podem estourar a linha
  em telas estreitas.
- **Correção planejada:**
  1. Garantir `min-w-0`/`max-w-full` nos containers das seções e
     `overflow-x-clip` na `main`/`body` para o scroll horizontal nunca escapar
     para a página;
  2. Nos cards do rail: `w-[64vw]` em telas muito pequenas (`max-sm:w-[70vw]`),
     `shrink-0` mantido, e altura fixa com `object-cover` para as imagens;
  3. Na grade de programação/podcasts, revisar `grid-cols` para fallback de 1
     coluna em telas < 480px e evitar `minmax(0, 1fr)` em cards com textos
     longos (`truncate`/`line-clamp-2`);
  4. No player de podcast (`NowPlayingBar`, `RadioPlayer.tsx:1345`), em telas
     muito estreitas a grade `[1fr_auto_1fr]` pode espremer o título: permitir
     ocultar o subtítulo e reduzir gaps (`gap-2` abaixo de `sm`).
- **Arquivos:** `src/index.css`, `src/components/MediaRail.tsx`, `src/pages/Home.tsx`
  (seção de programação), `src/components/RadioPlayer.tsx` (NowPlayingBar).
- **Critério de aceite:** em 360px de largura, nenhuma seção gera scroll
  horizontal; reels/stories/podcasts respeitam a tela com legenda intacta.

---

## 5. Ordem de execução sugerida (ondas)

| Onda | Itens | Verificação |
| --- | --- | --- |
| 1 — Transporte do podcast | 1.1, 1.2 | `features.test.tsx` podcast (reescrever teste de velocidade) |
| 2 — Rail vertical + preenchimento | 2.1, 2.2, 2.3, 3.1 | `social-ui.test.tsx` rail + inspeção visual |
| 3 — Barras e comentários | 3.2 ✅, 3.3 ✅, 3.4 ✅, 3.5 | `social-ui.test.tsx` (teste de curtir com hover; painel inline; scroll ao banner; superchat) |
| 4 — Mobile | 4.1, 4.2 | `npm run build` + auditoria manual em DevTools mobile (375px e 390px) |

## 6. Regras de execução

- **TDD:** escrever/ajustar os testes de cada onda **antes** de implementar
  (os arquivos citados em "Teste afetado" já sinalizam o que muda).
- **Porta de desenvolvimento:** `npm run dev` → `http://localhost:8080`.
- **jsdom:** testes de mídia usam `mockMedia()`; `user-event` **não** está
  instalado — usar `fireEvent`.
- **Commit por onda** (mensagens em PT-BR no padrão do repo, ex.:
  `fix(player): ordem do transporte e seletor de velocidade com menu`).
- **Push:** sempre `git pull` antes de começar e `git push` ao final de cada onda.

## 7. Fora de escopo (próximas fases)

- Banco de dados/back-end (Supabase + login + Mercado Pago superchat) —
  ver `PLANO-BANCO-DADOS-BACKEND.md`.
- Sincronização real dos eventos sociais (hoje v0 local com `flushEvents`).