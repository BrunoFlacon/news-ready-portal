# Plano — Propagandas, Grade de Programação e Alertas (Vitória News)

> Status: **em planejamento** · Área: monetização/programação/alertas ·
> Repo: news-ready-portal
>
> Progresso:
> - (vazio — plano recém-criado; consultar também
>   `PLANO-AUDITORIA-CORRECOES.md` Onda 4 e `PLANO-BANCO-DADOS-BACKEND.md`.)

Este plano cobre as novas exigências do editor para **gerar receita com
propaganda** e **transformar a grade de programação em um hub** de conteúdo:
inserções de anúncios entre os vídeos, um **banner gigante que vira propaganda
ao vivo**, propagandas de **próximos programas/agendados/estreias** (padrão
YouTube), **propagandas clicáveis que abrem a grade da programação**, um
**painel para o admin administrar anúncios e a grade**, e **alertas de
emergência com som** ("Urgente / Aconteceu Agora / Breaking News").

Cada item traz: objetivo → comportamento planejado → arquivos afetados →
critério de aceite. Os elementos sociais já implementados (rail, barra,
comentários ao vivo, superchat) são reutilizados nas propagandas "ao vivo".

---

## 1. Propagandas entre os vídeos (intersticiais)

### 1.1 Anúncio em banner entre um vídeo e o próximo (padrão YouTube/Sky)

- **Objetivo:** entre o fim de um vídeo (live, reel, story, material/notícia) e o
  início do próximo, exibir um **anúncio em tela cheia** por alguns segundos com
  contagem regressiva "Pular anúncio em 5s" — igual ao pré-roll/meio-roll do
  YouTube.
- **Comportamento planejado:**
  1. No `WatchOverlay` (`src/pages/Home.tsx`), quando o atual termina
     (`onEnded`) **antes** de avançar para o próximo, montar um passo
     intermediário `adStep` com o anúncio ativo (do banco, seção frontmatter
     `ads`);
  2. O anúncio ocupa o banner inteiro (capa/imagem 16:9 ou 9:16 conforme a
     orientação do vídeo em exibição), com: logotipo da marca, título da
     campanha, CTA (ex. "Saiba mais"), contador regressivo e botão **"Pular
     anúncio"** visível depois de N segundos (padrão: 5s);
  3. Ao pular OU ao terminar o tempo, o anúncio dá lugar ao próximo vídeo da
     fila — nunca bloqueia o transporte (play/pause/avançar permanecem);
  4. **Só anúncios aprimorados:** propagandas de **programas ao vivo / grade**
     e de **próximos agendados** (1.2) são exibidas nos mesmos slots — o
     editor pode clicar e **ir direto para a grade/player** (1.3).
- **Arquivos:** `src/pages/Home.tsx` (WatchOverlay — fluxo `onEnded`/`next`);
  `src/components/YouTubePlayer.tsx`; novo `src/components/AdSpot.tsx`.
- **Critério de aceite:** ao terminar um vídeo, o anúncio aparece com
  contagem regressiva e "Pular anúncio" habilitado após 5s; pular → próximo
  vídeo; o player não trava e o hover/toque ainda mostra o rail.

---

### 1.2 Banner gigante que vira propaganda ao vivo (marca patrocinadora)

- **Objetivo:** além dos intersticiais, o **banner gigante** pode ser
  **ocupado por uma propaganda em destaque** (padrão patrocínio de capa) —
  o editor quer capacidade de "empurrar" um anúncio para a posição de hero.
- **Comportamento planejado:**
  1. Nova opção no frontmatter do anúncio `featured: true` — o anúncio entra
     no **carrossel do banner gigante** como um slide patrocinado (tarja
     "Patrocinado"/"Publicidade"), com capa própria e link para o CTA;
  2. Ao girar o carrossel para o slide de anúncio, o **play automático é
     pausado** e o slide ganha contador de tempo + "Pular anúncio" (não
     toca áudio sozinho sem interação);
  3. Se o anúncio for de **programa ao vivo / grade**, ele abre o player ou a
     grade ao clicar (1.3) — comportamento idêntico ao dos reels hoje.
- **Arquivos:** `src/pages/Home.tsx` (hero caroussel `carouselItems` —
  unir `watchFeed` + `featuredAds`); `src/data/media.ts` (tipo do anúncio).
- **Critério de aceite:** anúncio `featured` aparece no carrossel com tarja
  "Patrocinado"; o play se pausa no slide de publicidade e há "Pular anúncio";
  clicar abre o CTA ou a grade.

---

## 2. Propagandas de próxima programação (padrão YouTube)

### 2.1 Próximo programa ao vivo / próximo vídeo agendado / próximas estreias

- **Objetivo:** transformar a **agenda de programação** em anúncios — no
  espírito do YouTube de "próximo" ao fim do vídeo e de "lembretes de
  estreia". O editor quer:
  - **próximo programa ao vivo** → click abre a transmissão ou a grade;
  - **próximo vídeo agendado** (com data/hora) → click mostra título,
    descrição e permite **agendar alerta**;
  - **próximas estreias** (estreia de podcast/áudio ao vivo, episódio novo)
    → viram propagandas com título + descrição + botão **"Lembrar-me"**.
- **Comportamento planejado:**
  1. Reutilizar a tarja de "banner gigante" e o rail/barra social para exibir,
     ao fim do vídeo atual, um card **"A seguir"** (agora com o agendado/
     estreia ao invés de só o próximo da fila);
  2. Novo helper em `src/data/media.ts` — `nextUpcoming(item)` que filtra
     `schedule` por `kind` (`live`/`video`/`podcast`/`news`) com
     `startsAt > now` e ordena por horário;
  3. O card exibe título + descrição + horário + botão **"Lembrar-me"** e
     **"Ver na grade"** (1.3); "Lembrar-me" escreve em
     `weekAlerts` no `localStorage` (`src/lib/alerts.ts`, item 2.3);
  4. Em lives atuais, a tarja "AO VIVO" do rail mostra o**próximo** programa
     agendado em destaque.
- **Arquivos:** `src/data/media.ts`; `src/pages/Home.tsx`; `src/lib/alerts.ts`
  (novo, ver 2.3); `src/components/SocialDialogs.tsx` (card "A seguir").
- **Critério de aceite:** ao fim de um vídeo, aparece card "A seguir" com o
  próximo agendado/estreia, com título, descrição e horário; "Lembrar-me"
  persiste em `localStorage` e dispara alerta na hora marcada; "Ver na grade"
  rola até a grade de programação.

---

### 2.2 Propagandas clicáveis que abrem a grade / player ao vivo

- **Objetivo:** qualquer propaganda de programa/vídeo (1.1, 1.2, 2.1) que
  represente um item da grade deve abrir **a grade de programação** ou o
  **player ao vivo** ao clicar.
- **Comportamento planejado:**
  1. Anúncios com `target: "schedule"` rolam até a seção **grade de
     programação** (`#grade-programacao`, `Home.tsx`) com `scrollIntoView`
     (mesmo padrão do item 3.1);
  2. Anúncios com `target: "live"` abrem a **live de vídeo** ou a **rádio ao
     vivo** diretamente (reutilizando `useSocialItem`/player);
  3. O card "A seguir" (2.1) carrega `onTarget={({ kind, id }) =>
     kind === "schedule" ? scrollToSchedule() : openLive(id)}`.
- **Arquivos:** `src/components/AdSpot.tsx`, `src/pages/Home.tsx`.
- **Critério de aceite:** clicar num anúncio de programa viva a grade (rolagem
  suave até `#grade-programacao`); clicar num anúncio de live abre o player.

---

## 3. Painel de administração (anúncios + grade)

### 3.1 Painel do admin para administrar propagandas

- **Objetivo:** dar ao editor um **painel administrativo** para criar, editar,
  pausar e remover anúncios (intersticiais, banner gigante e "a seguir"), com
  integração ao banco de dados (plano `PLANO-BANCO-DADOS-BACKEND.md`).
- **Comportamento planejado:**
  1. Nova rota/protótipo `/admin/ads` (ou painel dentro de `/admin`) listando
     os anúncios com: capa, título, marca, origem (banco/local), orientação
     (16:9/9:16), tipo (intersticial/banner/a seguir), CTA/alvo (URL, grade,
     live), `featured` e status (ativo/pausado);
  2. Formulário de criação/edição (estilo modal já usado no portal):
     upload/URL da capa, campos do anúncio, seleção de alvo (URL/grade/live),
     toggle `featured`;
  3. Ações de pausar/reativar/remover com confirmação; persistência em
     `localStorage` (modo v0) e mapeamento para o plano de banco
     (`ads` no Supabase/Mercado Pago);
  4. Nova rastreabilidade: anúncio exibido → `recordAdImpression`,
     clicado → `recordAdClick` (métricas simples no `localStorage`).
- **Arquivos:** novo `src/pages/AdminAds.tsx` (ou seção em
  `src/pages/Admin.tsx`); `src/data/ads.ts` (tipos + seed);
  `src/lib/ads.ts` (CRUD + métricas).
- **Critério de aceite:** no `/admin`, o editor cria um anúncio com capa e
  alvo, e ele aparece imediatamente nos slots (banner/intersc); pausar o
  remove dos slots; métricas de impressão/clique incrementam.

---

### 3.2 Painel do admin para administrar a grade de programação

- **Objetivo:** permitir ao admin **editar a grade** (programas ao vivo,
  agendados, estreias, podcasts, reels) sem tocar no código.
- **Comportamento planejado:**
  1. Nova rota `/admin/schedule` listando `schedule` (`src/data/media.ts`)
     com: título, tipo (`live`/`video`/`podcast`/`news`/`reel`), horário
     (`startsAt`), duração, apresentador, premium e imagem;
  2. Formulário de criação/edição (capa, horário, descrição, premium) e
     reordenação da grade (arrastar/setas) refletindo imediatamente no
     player, no card "A seguir" (2.1) e na seção de programação;
  3. Persistência em `localStorage` (v0) + mapeamento para o plano de banco
     (`schedule` no Supabase);
  4. Ao ativar "ao vivo", a rádio/live passa a usar o programa editado como
     `upcomingLive` (id estável).
- **Arquivos:** novo `src/pages/AdminSchedule.tsx`; `src/data/media.ts`
  (`schedule` passa a ser editável via `src/lib/schedule.ts`);
  `src/components/RadioPlayer.tsx` (lê `upcomingLive` do estado admin).
- **Critério de aceite:** no `/admin/schedule`, editar o horário de um
  programa reflete na grade da Home e no "A seguir"; adicionar um programa
  novo o mostra na seção de programação e no card; persistir ao recarregar.

---

## 4. Alertas de estreia e alertas de emergência (com som)

### 4.1 Avisos de estreia inspiram alertas de notícias/vídeos

- **Objetivo:** os "Lembrar-me" de estreia (2.1) e os alertas de notícias
  viram um único **sistema de notificações in-app** com som de alerta discreto
  (padrão push de app de notícias).
- **Comportamento planejado:**
  1. Novo `src/lib/alerts.ts` — fila de alertas (notícia urgente, estreia de
     programa, episódio novo de podcast) com carimbo de horário;
  2. Motor de agendamento: checa a cada X segundos se `startsAt` de uma
     estreia com `weekAlerts` chegou → dispara alerta;
  3. Ao dar play em uma notícia/vídeo com `prominent`, um sumário surge no
     canto com **som de alerta discreto** (item 4.2) e ícone de sino com
     badge de pendentes;
  4. Notificações agrupadas e descartáveis; clicar abre a matéria/player.
- **Arquivos:** `src/lib/alerts.ts` (novo); `src/pages/Home.tsx` (toast de
  alerta + sino); `src/data/media.ts` (streias com `notifyAt`).
- **Critério de aceite:** agendar "Lembrar-me" de uma estreia → na hora
  marcada aparece o alerta (toast + sino com badge) e toca o som; tocar no
  alerta abre a matéria/player.

---

### 4.2 "Urgente / Aconteceu Agora / Breaking News" com som de alerta

- **Objetivo:** tarja de **Breaking News** sobre o banner e sobre a barra do
  player/live com palavras de choque ("Urgente", "Aconteceu Agora", "Breaking
  News") e **som de alerta de emergência** — o editor quer que a notícia
  urgente seja impossível de ignorar.
- **Comportamento planejado:**
  1. **Tarja desktop:** faixa vermelha translúcida no topo do banner gigante
     ("Urgente • Aconteceu Agora • Breaking News") — como hoje a tarja
     "AO VIVO", mas em vermelho pulsante, com texto corrido/marquee do título
     da notícia;
  2. **Tarja mobile/barra:** faixa vermelha na borda inferior da barra
     principal (player/live/rádio) informando a notícia urgente — clicável;
  3. **Som de emergência:** ao aparecer a tarja de Breaking News, tocar um
     **alerta sonoro curto** (sirene/beep) via `Audio` pré-carregado
     (`src/assets` ou URL), com **controle de volume e mute** respeitado e
     opção do editor desativar ("sem som");
  4. Clicar na tarja abre a **matéria relacionada** ou o **player ao vivo**
     (alvo configurável).
- **Arquivos:** `src/pages/Home.tsx` (tarja banner + barra); `src/lib/alerts.ts`
  (dispatch `breaking`); novo `src/lib/audio-alert.ts` (som com mute);
  `src/data/media.ts` (matérias `breaking: true`).
- **Critério de aceite:** ao exibir conteúdo marcado `breaking`, a tarja
  vermelha pulsa no topo do banner (e na borda inferior da barra no mobile)
  com "Urgente"/"Aconteceu Agora"/"Breaking News", toca o som de emergência
  uma vez (respeitando o mute global), e o clique abre a matéria/player.

---

## 5. Ordem de execução sugerida

| Fase | Itens | Dependência | Verificação |
| --- | --- | --- | --- |
| A — Intersticiais | 1.1, 1.2 | antes da B | `features.test.tsx` (anúncio entre vídeos + pulo) |
| B — A seguir/agendados | 2.1, 2.2 | depois de A | `features.test.tsx` (card "A seguir" + lembrar-me) |
| C — Admin | 3.1, 3.2 | depois de B | novo `admin-*.test.tsx` (CRUD anúncio/grade) |
| D — Alertas | 4.1, 4.2 | depois de C | `features.test.tsx` (toast + som + tarja breaking) |

Todas as fases dependem do plano de banco (`PLANO-BANCO-DADOS-BACKEND.md`)
para persistência real — na v0 tudo persiste em `localStorage` (mesmo padrão
dos comentários/curtidas já implementados).

## 6. Regras de execução

- **TDD:** testes (Red) antes da implementação (Green) — mesmo ciclo das
  ondas 1–3 do plano de auditoria.
- **Porta de desenvolvimento:** `npm run dev` → `http://localhost:8080`.
- **jsdom:** testes de mídia usam `mockMedia()`; `fireEvent` (sem
  `user-event` instalado); `prefers-reduced-motion` respeitado.
- **Commit por fase** em PT-BR, no padrão do repo (ex.
  `feat(ads): anúncio intersticial com pulo e banner patrocinado`).
- **Push:** `git pull` antes de começar, `git push` ao final de cada fase.

## 7. Fora de escopo (dependências do back-end)

- Pagamento real de superchat/anúncios via **Mercado Pago** (integração
  financeira — ver `PLANO-BANCO-DADOS-BACKEND.md`).
- Sincronização multi-dispositivo dos alertas (hoje `localStorage` por
  navegador).
- Segmentação/leilão de anúncios (targeting por audiência).
