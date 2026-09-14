# Plano de Trabalho — Banco de Dados, Back-End Administrável e Métricas

**Projeto:** Web Rádio Vitória (vite_react_shadcn_ts)
**Objetivo:** transformar o site de front-end estático em uma plataforma com banco de dados, conteúdo administrável por back-end, cadastro/login obrigatório para interações (modelo Facebook/Google) e métricas completas no estilo YouTube, Spotify e Instagram — por conteúdo, por usuário e por programa.

> Este documento é o **plano de trabalho** (work plan). Ele define arquitetura, modelo de dados, regras de produto, fases com tarefas e critérios de aceite. A implementação segue o padrão TDD do repositório (Vitest + Testing Library).

---

## 1. Visão geral (o que o site passa a ter)

| # | Capacidade | Descrição |
|---|-----------|-----------|
| 1 | **Cadastro obrigatório para interagir** | Curtir, comentar, salvar, compartilhar, recomendar, pedir música, enviar áudio, mandar superchat = exige login. Cadastro direto (e-mail + senha) **ou** login social (Google, Meta/Facebook, Meta/Instagram, WhatsApp) com complementação de dados, como Facebook/Google exigem. |
| 2 | **Conteúdo administrável** | Matérias, vídeos, reels, stories, lives, podcasts e episódios, programação, banners e categorias saem dos arquivos `src/data/*` e passam a ser cadastrados/editados por um back-office. |
| 3 | **Métricas estilo YouTube/Spotify/Instagram** | Visualizações, **tempo de visualização**, curtidas, comentários, compartilhamentos, salvamentos, recomendações — por post, podcast, episódio, live, matéria e programa. |
| 4 | **Rádio e programas** | Pedidos de música, envio de áudios, reações e engajamento por programa (**gravado vs. ao vivo**, **vídeo live vs. áudio ao vivo**), tempo de escuta da rádio, ranking de programas. |
| 5 | **Funil de aquisição** | De onde cada pessoa começou: site de origem, clique, rede social, anúncio (UTM), **quem recomendou** (convite) e por qual rede. |
| 6 | **Relatório por usuário** | Perfil demográfico (sexo, idade, cidade, estado, país) + timeline de interações de cada usuário. |
| 7 | **Superchat** | Mensagens pagas em destaque para programas ao vivo (áudio ao vivo ou vídeo live), com overlay, moderação e pagamento. |
| 8 | **Dispositivos e meios** | Estatísticas de como a audiência acompanha: computador, celular, tablet, TV, fone de ouvido, bluetooth; e **por qual rede social** está acompanhando. |
| 9 | **Navegação completa** | Pageviews, cliques em matérias e banners, tempo por página, caminho percorrido, eventos de UI — tudo registrado no banco. |

---

## 2. Estado atual do projeto (ponto de partida)

- **Frontend:** React 18 + Vite 5 + TypeScript + Tailwind + shadcn/ui + React Router + Recharts.
- **Dados mock:** `src/data/articles.ts`, `src/data/media.ts` (vídeos/reels/stories/lives), `src/data/podcasts.ts`.
- **Ferramentas sociais já prontas (v0 local):** `src/lib/social.ts` com curtir, comentar, salvar, compartilhar, convidar, tempo de visualização e uma **fila de eventos** (`flushEvents()`) desenhada para sincronizar com banco.
- **Sem back-end:** `package.json` não tem SDK de banco/auth; formulário de contato roda em "modo demonstração".
- **Páginas existentes:** Home (player imersivo + social bars), Índice de notícias, Artigo, Contato, Privacidade (`PrivacyPolicy`), Termos (`TermsOfService`), 404 e área premium/assinatura.

**Evolução da fila de eventos (já plantada):** o `SocialEvent` atual `{ publicationId, action, value, createdAt }` evolui para o **Evento Enriquecido** da seção 6, e `flushEvents()` passa a enviar para o endpoint `POST /events` em vez de jogar fora.

---

## 3. Arquitetura

### 3.1 Decisão: Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions) — confirmado

Back-end escolhido pelo dono em **14/09/2026**: **Supabase**. Motivos:

- **PostgreSQL** com RLS (Row Level Security) — segurança no próprio banco, ideal para dados por usuário.
- **Auth pronto** com e-mail/senha + OAuth Google, Facebook, Instagram (via provedores) e fluxo de OTP (para WhatsApp).
- **Storage** para upload de áudio (pedidos/envios), vídeo e imagens (conteúdo do admin).
- **Realtime** para overlay de Superchat e pedidos de música ao vivo.
- **Dashboard SQL / views materializadas** para agregações de métricas.
- Plano gratuito suficiente para começar; escala sem reescrever.

### 3.2 Alternativas avaliadas (não adotadas)

| Alternativa | Prós | Contras |
|------------|------|---------|
| **Firebase (Auth + Firestore)** | Auth social amplo, Realtime nativo | Firestore NoSQL dificulta relatórios agregados pesados |
| **Back-end próprio (Node/Express + Prisma + PostgreSQL)** | Controle total, sem vendor | Muito mais código: auth, upload, rate-limit, deploy |
| **NestJS + PostgreSQL** | Estrutura robusta para admin | Sobrecarga para o tamanho do projeto |

### 3.3 Fluxo de dados

```
Navegador (React)
   │  ações sociais, telemetria, cadastro, uploads
   ▼
Supabase Edge Functions / SDK
   │  (RLS: cada usuário só lê/escreve o que pode)
   ▼
PostgreSQL ──────► Views/materializações de métricas
   │
   ├──► Auth (e-mail/senha + 2FA + Google/Meta + WhatsApp OTP)
   ├──► Storage (áudios, vídeos, imagens)
   └──► Realtime (superchat, pedidos ao vivo)
        │
        ▼
Back-office (painel admin no mesmo app, rota /admin)
   ├── CRUD de conteúdo
   └── Dashboards de métricas e relatórios
```

---

## 4. Regras de produto (cadastro obrigatório)

1. **Navegar e ler conteúdo:** permanece **anônimo** (SEO e experiência) — mas a telemetria de navegação (sessão, pageview, cliques) é coletada com **consentimento** (banner LGPD).
2. **Interagir socialmente:** curtir, comentar, salvar, compartilhar, recomendar, pedir música, enviar áudio, assinar, mandar superchat → **exige usuário autenticado**.
3. **Formas de cadastro (todas confirmadas pelo dono em 14/09/2026):**
   - **Cadastro direto (manual):** nome, e-mail e senha (mín. 8 caracteres) → confirmação por e-mail **e verificação de duas etapas (2FA)** no primeiro acesso (app autenticador TOTP ou OTP por WhatsApp/SMS).
   - **Login social Google / Meta (Facebook e Instagram):** o provedor entrega nome, e-mail e foto do perfil; o site **pré-preenche** e o usuário **completa/confirma** os dados (como Facebook/Google fazem); 2FA opcional reforçada.
   - **WhatsApp:** login por **OTP no número de telefone** (WhatsApp Business API/SMS) — aprovado.
   - As três vias convivem na mesma conta: o usuário pode vincular e-mail, Google, Meta e WhatsApp.
4. **Dados obrigatórios do cadastro (complementação):** nome de exibição, **sexo/gênero**, **data de nascimento** (vira idade), **cidade**, **estado**, **país**, avatar (opcional). Esses campos alimentam os relatórios demográficos.
5. **Consentimentos LGPD (checkboxes explícitos):** aceitar Política de Privacidade e Termos; consentir coleta de dados de navegação; consentir uso de dados para métricas/insights; opcional: aceitar comunicações por e-mail/WhatsApp.
6. **Menores de 16 anos** não podem criar conta (bloqueio por data de nascimento), conforme LGPD.
7. **Direito do usuário:** ver/exportar seus dados e excluir conta (LGPD) — tela "Meus Dados".

---

## 5. Modelo de dados (schema PostgreSQL)

Convenção: chaves `uuid` (padrão gen_random_uuid), timestamps `timestamptz`, todas as tabelas com `created_at`; tabelas de conteúdo com `status` (`draft | scheduled | published | archived`).

### 5.1 Usuários, identidades e consentimentos

| Tabela | Colunas principais | Observações |
|--------|-------------------|-------------|
| `profiles` | id, email, display_name, gender, birth_date, city, state, country, avatar_url, referred_by (fk users), signup_source (`direct|google|facebook|instagram|whatsapp`), created_at | 1:1 com auth.users; `referred_by` grava quem convidou |
| `user_consents` | user_id, consent_type (`privacy|terms|analytics|marketing`), version, accepted_at | histórico de aceites |
| `user_devices` | user_id, device_type (`desktop|mobile|tablet|tv|headphone|bluetooth`), os, browser, last_seen_at | atualizado a cada sessão |
| `follow_sources` | user_id, source (`youtube|instagram|facebook|whatsapp|telegram|google|direct|ad_*`), url/utm, first_followed_at | **por qual rede social acompanha** |

> **2FA (verificação de duas etapas):** gerenciada pelo Supabase Auth (`auth.mfa_factors` — TOTP/autenticador; OTP por WhatsApp/SMS via edge function). O app entrega as telas de "Ativar 2FA", "Verificar código" e "Recuperar acesso" (códigos de recuperação).

### 5.2 Conteúdo (administrável pelo back-office)

| Tabela | Colunas principais | Substitui |
|--------|-------------------|-----------|
| `categories` | id, slug, name, color | categorias atuais (Tecnologia, Política…) |
| `articles` | id, title, slug, excerpt, body, category_id, author_id, cover_url, published_at, status | `articles.ts` |
| `media_items` | id, kind (`video|reel|story|image`), title, orientation, category_id, media_url (storage), thumb_url, duration_seconds, published_at, status, premium | `media.ts` (videoCuts/socialMedia/stories) |
| `lives` | id, title, host, kind (`audio_live|video_live`), stream_url, schedule_at, status, premium, replay_media_id | `lives.ts` |
| `podcasts` | id, title, description, category_id, author_id, cover_url | `podcasts.ts` |
| `podcast_episodes` | id, podcast_id, title, duration_label, audio_url, premium, published_at, status | episódios dos podcasts |
| `programs` | id, name, host, schedule (`seg-sex 13h`), kind (`recorded|live`), media_type (`audio|video`), color | programação da rádio |
| `banners` | id, title, image_url, target_url, placement, starts_at, ends_at, status | banners das páginas |

### 5.3 Interações sociais (por publicação e por usuário)

| Tabela | Colunas | Conta para |
|--------|---------|-----------|
| `likes` | user_id, publication_id, created_at (unique user+pub) | curtidas por post/podcast/live |
| `comments` | user_id, publication_id, parent_id, text, created_at | comentários |
| `shares` | user_id, publication_id, network, created_at | compartilhamentos por rede |
| `saves` | user_id, publication_id, created_at | salvamentos (bookmark) |
| `recommendations` | user_id, publication_id, recipient_id (opcional), network, created_at | recomendações/convites |
| `publications` (polimorfismo) | id, content_type (`article|video|reel|story|live|podcast|episode`), content_id | **chave única de métrica** para todas as interações; a UI já usa `publicationId` |

**Nota de modelagem:** a UI social já opera com `publicationId` genérico. Mantemos `publications` como tabela central e as tabelas de interação apontam para ela — simplifica relatórios "por conteúdo".

### 5.4 Navegação e telemetria

| Tabela | Colunas | Uso |
|--------|---------|-----|
| `sessions` | id, user_id (nullable), started_at, ended_at, device_type, os, browser, referrer, utm_source/m/campaign, ip_hash, country (geo) | sessão de navegação; **funil** |
| `page_views` | session_id, path, title, referrer_path, started_at, duration_seconds | tempo por página e caminho |
| `events` | id, session_id, user_id, publication_id, type, value (jsonb), created_at | telemetria enriquecida (seção 6) |
| `article_clicks` | session_id, user_id, article_id, source (`hero|feed|related…`), created_at | cliques em matérias |
| `banner_clicks` | session_id, user_id, banner_id, placement, created_at | cliques em banners |
| `watch_sessions` | id, session_id, user_id, media_id, started_at, ended_at, watched_seconds, completed | **tempo de visualização** (vídeo/reel/live) |
| `listen_sessions` | id, session_id, user_id, program_id (nullable), started_at, ended_at, listened_seconds | **tempo ouvindo a rádio** |

### 5.5 Rádio, programa ao vivo e superchat

| Tabela | Colunas | Uso |
|--------|---------|-----|
| `song_requests` | id, user_id, program_id, artist, title, message, played_at (nullable), created_at | **pedidos de música** por programa |
| `audio_uploads` | id, user_id, program_id, storage_path, duration_seconds, status (`pending|approved|rejected`), created_at | **envio de áudios** da audiência |
| `reactions` | id, user_id, program_id, kind (`live_reaction|emoji`), icon, created_at | reações em programa (gravado/ao vivo) |
| `superchats` | id, user_id, program_id, live_id (opcional), message, amount_cents, currency, color/level, status (`pending|approved|hidden`), payment_id, created_at | **Superchat** (seção 7) |
| `payments` | id, user_id, provider (`mercado_pago|stripe|paypal|bitpay|coinbase|nowpayments|pix`), currency (`BRL|USD|BTC|ETH|…`), amount_cents/amount_sats, status, gateway_id | pagamentos (superchat, assinatura) — via adapters |

### 5.6 Agregações e relatórios

| Objeto | Tipo | Uso |
|--------|------|-----|
| `v_publication_metrics` | View | curtidas, comentários, compartilhamentos, salvamentos, views, tempo médio por publicação |
| `v_program_metrics` | View | engajamento por programa: gravado vs. ao vivo, vídeo vs. áudio |
| `v_daily_counts` | View | série diária de cada métrica (gráficos Recharts) |
| `v_user_profiles` | View | relatório individualizado: demográficos + resumo de interações + fonte de aquisição |
| `v_audience_devices` | View | estatística por dispositivo/meio e por rede social |
| função `run_user_report(user_id)` | SQL | relatório completo de um usuário (exportável CSV) |

---

## 6. Telemetria — formato do Evento Enriquecido

Evolução do `SocialEvent` atual (`src/lib/social.ts`) para o evento enviado ao banco:

```ts
interface EnrichedEvent {
  sessionId: string;          // sessão de navegação corrente
  userId?: string;            // null se anônimo (com consentimento)
  publicationId?: string;     // vídeo, reel, live, podcast, episódio, matéria
  contentType?: "article" | "video" | "reel" | "story" | "live" | "podcast" | "episode" | "banner";
  programId?: string;         // programa da rádio relacionado
  type:
    | "pageview" | "click_article" | "click_banner" | "nav"
    | "like" | "unlike" | "comment" | "share" | "save" | "unsave" | "recommend" | "invite" | "view"
    | "song_request" | "audio_upload" | "reaction" | "superchat"
    | "listen_start" | "listen_heartbeat" | "listen_end"
    | "watch_start" | "watch_heartbeat" | "watch_end";
  value: string | number | Record<string, unknown>;  // ex.: rede, segundos, texto
  device: { type: "desktop" | "mobile" | "tablet" | "tv" | "headphone" | "bluetooth"; os: string; browser: string };
  utm: { source?: string; medium?: string; campaign?: string };
  referrer?: string;
  createdAt: string;
}
```

Regras de coleta:

- **Tempo de escuta da rádio:** heartbeat de escuta a cada **30 s** enquanto o player de rádio está ativo (`listen_heartbeat`), fechando `listen_sessions` no fim.
- **Tempo de visualização:** a cada 5 s com o vídeo tocando envia `watch_heartbeat` (a UI já faz `trackView` a cada 5 s no WatchOverlay).
- **Cliques em matérias/banners:** cada clique vira `click_article`/`click_banner` com a origem (hero, feed, relacionados) e o `placement`.
- **Buffer offline:** o app mantém a fila local (já existe em `social.events`, limite 500) e envia em lote; só remove da fila o que o servidor confirmou. `POST /events` aceita lotes de até 100 eventos.
- **Identificação de dispositivo/meio:**
  - Computador/celular/tablet: `navigator.userAgent` + Client Hints (headless pode ser testado via `navigator.userAgentData`).
  - **Fone de ouvido / bluetooth:** via `navigator.mediaSession` (metadados de mídia) e, quando o usuário permitir, `navigator.bluetooth.getDevices()` para listar dispositivos pareados; fallback: cadastro manual em "Meus Dispositivos".
  - TV: UA de smart TVs (Tizen, webOS, Android TV, Roku) + botão "assistir na TV" (Chromecast/AirPlay).

---

## 7. Superchat (mensagens pagas em destaque)

Objetivo: ouvintes de **programas ao vivo** (áudio ao vivo ou vídeo live) pagam para ter a mensagem destacada no overlay.

Fluxo:

1. Usuário autenticado clica "Superchat" no player da live.
2. Escolhe o valor (faixas sugeridas: R$ 2, R$ 5, R$ 10, R$ 25, R$ 50) — pagamento via **Mercado Pago (PIX, cartão de crédito e débito)** como provedor primário; em seguida, **internacional em dólar (USD)** e **criptomoedas**.
3. Mensagem passa por moderação (`status: pending`) → aprovada/oculta pelo admin (automática por padrão para faixas altas).
4. Aprovada: aparece no **overlay ao vivo** (topo do player, com cor/nível pelo valor) via **Supabase Realtime** — o locutor lê ao vivo, como no YouTube.
5. Tudo vira métrica: valor total, mensagens por programa ao vivo, ranking de apoiadores.

Tabelas: `superchats` + `payments` (5.5). UI: componente `SuperchatDialog` + `SuperchatOverlay` (reutiliza `DialogShell` de `SocialDialogs.tsx`).

**Camada de pagamento plugável (adapter pattern):** o projeto define uma interface `PaymentProvider` (criar intent → capturar → webhook). Implementações iniciais: **Mercado Pago** (PIX, crédito, débito — BRL), um **gateway internacional** (ex.: Stripe/PayPal) para **dólar (USD)** e um **processador de criptomoedas** (ex.: BitPay/Coinbase Commerce/NowPayments) com câmbio cotado no momento da compra. Novos provedores entram como novos adapters sem alterar o fluxo do superchat.

---

## 8. API — endpoints

| Método | Rota | Uso |
|--------|------|-----|
| POST | `/events` | lote de eventos enriquecidos (telemetria + sociais + rádio) |
| POST | `/auth/signup` `(e-mail/senha)` | cadastro direto |
| POST | `/auth/oauth/{provider}` | Google, Facebook, Instagram |
| POST | `/auth/whatsapp/otp` | OTP por WhatsApp (login e 2FA) |
| POST | `/auth/confirm-profile` | complementação de dados pós-login social |
| POST | `/auth/mfa/enroll` e `/auth/mfa/verify` | ativar/validar 2FA (TOTP ou OTP WhatsApp/SMS) |
| GET/PATCH | `/me` | perfil, consentimentos, dispositivos, exclusão LGPD |
| GET/PUT/POST/DELETE | `/admin/content/{type}/{id}` | CRUD de artigos, mídia, lives, podcasts, episódios, programas, banners (admin) |
| POST | `/admin/content/{type}/upload` | upload via Storage |
| GET | `/admin/metrics/publications` | ranking por publicação |
| GET | `/admin/metrics/programs` | gravado vs. ao vivo; vídeo vs. áudio |
| GET | `/admin/metrics/audience` | dispositivos/meios/redes sociais |
| GET | `/admin/metrics/funnel` | origem/UTM/referral/convites |
| GET | `/admin/users/{id}/report` | relatório individual (CSV/JSON) |
| POST | `/superchats` | criar superchat (com pagamento) |
| POST | `/payments/{provider}/intent` | criar intent no provedor (`mercado_pago|stripe|paypal|bitpay|coinbase|nowpayments`) |
| POST | `/payments/{provider}/webhook` | webhook de confirmação de pagamento |
| POST | `/song-requests` | pedido de música |
| POST | `/audio-uploads` | envio de áudio |
| WS | Realtime `live:{programId}` | overlay superchat/pedidos ao vivo |

---

## 9. Back-office (painel administrativo)

Mesmo app, rota `/admin`, protegida por role `admin` (coluna `role` em `profiles`).

1. **Conteúdo:** CRUD com preview de artigos (rich text), mídia (vídeos/reels/stories), lives, podcasts/episódios, programas, banners, categorias. Status `draft/scheduled/published/archived`; upload de arquivos para Storage; reordenação de feeds (`sort_order`).
2. **Métricas (Recharts — já é dependência):**
   - Top conteúdos por views/tempo/curtidas/comentários/compartilhamentos/salvamentos.
   - Programas: ranking gravado vs. ao vivo, vídeo live vs. áudio ao vivo, reações.
   - Rádio: tempo total de escuta, picos por horário/programa, pedidos de música por programa.
   - Funil: aquisição por rede/UTM/anúncio, convites (quem recomendou), conversão visitante→cadastro→assinatura.
3. **Audiência:** dispositivos (desktop/celular/tablet/TV/fone/bluetooth), por rede social.
4. **Usuários:** lista com demográficos (sexo, idade, cidade, estado, país) + drill-down individual (timeline de eventos) + exportação CSV.
5. **Moderação:** comentários, áudios enviados, superchats.

---

## 10. Mapeamento: pedido → tabela/relatório

| Pedido (do dono) | Onde está no banco | Relatório/insight |
|------------------|--------------------|-------------------|
| Tempo de visualização | `watch_sessions` | média por publicação, total por usuário |
| Curtidas, compartilhamentos, comentários, salvamentos, recomendações | `likes`, `shares`, `comments`, `saves`, `recommendations` | `v_publication_metrics` |
| Pedidos de música | `song_requests` | por programa e por usuário |
| Envio de áudios | `audio_uploads` | por programa, status de moderação |
| Qual programa tem mais reações/engajamento | `reactions`, `superchats`, `song_requests` | `v_program_metrics` (gravado vs. ao vivo, vídeo vs. áudio) |
| Tempo ouvindo a rádio | `listen_sessions` | total/horário/programa por usuário |
| Por onde clicou e navegou | `sessions`, `page_views`, `events` | trilha do usuário, caminhos mais comuns |
| De onde começou a seguir / quem recomendou / rede ou anúncio | `profiles.referred_by`, `follow_sources`, `sessions.utm*`, `recommendations` | `v_funnel` (funil de aquisição) |
| Cliques em matérias e banners | `article_clicks`, `banner_clicks` | CTR por matéria/banner/posição |
| Dados por usuário (sexo, idade, cidade, estado, país) | `profiles` | `v_user_profiles` + relatório individual |
| Superchat ao vivo | `superchats`, `payments` | receita por programa, ranking de apoiadores |
| Meio de acesso (PC, celular, TV, tablet, fone, bluetooth) | `user_devices`, `sessions.device_type` | `v_audience_devices` |
| Por qual rede social acompanha | `follow_sources` | `v_audience_devices` |

---

## 11. Fases do plano de trabalho

> Cada fase termina com **todos os testes passando** (`npx vitest run`), **`npx tsc --noEmit`** limpo e **`npm run build`** verde.

### Fase 0 — Fundação do banco e SDK
**Tarefas:**
- [ ] Criar projeto Supabase (ou escolher alternativa) e registrar `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` no `.env`.
- [ ] Instalar `@supabase/supabase-js` e criar `src/lib/supabase.ts` (inicialização única).
- [ ] Escrever migrations SQL (TDD de banco: `supabase/migrations/` com arquivos versionados).
- [ ] Aplicar todas as tabelas da seção 5 com **RLS** habilitado por padrão (deny até policy explícita).
- [ ] Seed de conteúdo: migrar `articles.ts`, `media.ts`, `podcasts.ts` para as tabelas (script de import).
- [ ] Configurar ambiente de teste: `supabase-test` (local) ou mocks do cliente nos testes do front.

**Critérios de aceite:** migrations aplicáveis do zero; `profiles` criado via trigger pós-registro; RLS deny por padrão; CI roda testes.

### Fase 1 — Autenticação e cadastro (modelo Facebook/Google)
**Tarefas:**
- [ ] Cadastro direto: e-mail+senha com confirmação (página `/cadastro`, UI nova no app) **+ verificação de duas etapas (2FA)**: TOTP (app autenticador) ou OTP WhatsApp/SMS; telas de ativação, verificação e códigos de recuperação.
- [ ] Login social: Google e Meta (Facebook + Instagram) via Supabase Auth (botão "Continuar com…"); 2FA como reforço opcional.
- [ ] WhatsApp: OTP por número de telefone (WhatsApp Business API/SMS).
- [ ] Tela de **complementação de dados** pós-login social (nome de exibição, sexo, nascimento→idade, cidade, estado, país; consentimentos LGPD).
- [ ] Gating: componentes sociais (`SocialBar`, `SocialRail`, `CommentDialog`, `ShareContentDialog`, `InviteDialog`, `SuperchatDialog`) abrem "faça login para continuar" quando anônimos.
- [ ] Perfil "Meus Dados": exportar e excluir conta (LGPD).
- [ ] Páginas `PrivacyPolicy`/`TermsOfService` atualizadas para o novo tratamento de dados.

**Critérios de aceite:** interação sem login bloqueada com convite ao cadastro; cadastro social pré-preenche e exige confirmação; cadastro manual com 2FA ativo por padrão; testes de UI cobrindo cada fluxo (mock do cliente Supabase).

### Fase 2 — Conteúdo administrável (back-office)
**Tarefas:**
- [ ] Crud genérico de conteúdo em `/admin` (artigos, mídia, lives, podcasts/episódios, programas, banners, categorias).
- [ ] Upload de imagens/áudio/vídeo para Storage com preview.
- [ ] Sistema de publicação: `draft → scheduled → published → archived`, agendador de publicação.
- [ ] Home, Índice, Artigo e player passam a **ler do banco** (com cache/mock em testes usando dados seed idênticos aos atuais).

**Critérios de aceite:** editar uma matéria/banner no admin reflete no site em produção; testes mantêm as 62+ asserções existentes (dados seed idênticos).

### Fase 3 — Ferramentas sociais no banco
**Tarefas:**
- [ ] `src/lib/social.ts` v2: funções assíncronas (curtir, comentar, salvar, compartilhar, recomendar) gravando no banco via API.
- [ ] Fila offline→online: reutilizar `flushEvents()`; enviar lote e limpar só confirmados; conflitos resolvidos por `last-write-wins` (timestamp).
- [ ] Contadores reativos: `likesCount` etc. via Realtime/refetch com React Query (já instalado).
- [ ] Manter compatibilidade: testes sociais existentes passam com adapter local em modo demonstração.

**Critérios de aceite:** curtir em aba A aparece em aba B; desconectado acumula e sincroniza ao voltar; contadores consistentes.

### Fase 4 — Telemetria e métricas de navegação
**Tarefas:**
- [ ] `src/lib/telemetry.ts`: sessão, pageviews, cliques em matérias/banners, heartbeat de watch e de listen (rádio).
- [ ] `POST /events` com lote; retry com backoff; desidratação no `beforeunload`.
- [ ] Views: `v_publication_metrics`, `v_daily_counts` + endpoints de leitura.
- [ ] Testes unitários dos helpers (tempo, batching, consentimento anônimo).

**Critérios de aceite:** navegar 5 páginas gera 5 pageviews com sessão única; ouvir rádio 2 min gera `listen_heartbeat` coerentes; cliques registrados com origem.

### Fase 5 — Rádio, programas ao vivo e Superchat
**Tarefas:**
- [ ] Pedido de música (`SongRequestDialog`) vinculado ao programa atual da rádio; fila de pedidos no painel do locutor (Realtime).
- [ ] Envio de áudio da audiência (`AudioUpload`) com moderação.
- [ ] Reações rápidas por programa (emoji) — métrica "mais reações por programa".
- [ ] **Superchat:** valores, pagamento via adapters (**Mercado Pago: PIX, crédito, débito**; em seguida **internacional em dólar** e **criptomoedas**), moderação, overlay ao vivo e painel de receita.
- [ ] `v_program_metrics`: ranking gravado vs. ao vivo e vídeo live vs. áudio ao vivo.

**Critérios de aceite:** superchat aprovado aparece no overlay de outra aba via Realtime < 2 s; pedido de música entra na fila do locutor; métricas por programa corretas.

### Fase 6 — Dispositivos, meios e redes sociais
**Tarefas:**
- [ ] Detecção de device/meio (seção 6): desktop, mobile, tablet, TV, fone de ouvido, bluetooth; `user_devices` e `sessions.device_type` preenchidos.
- [ ] `follow_sources`: registrar de onde o usuário passou a acompanhar (rede social via referrer/UTM e "curtir nossa página").
- [ ] Views `v_audience_devices`.

**Critérios de aceite:** relatório mostra distribuição por meio e por rede social; teste com UAs simulados (Playwright já está no projeto).

### Fase 7 — Insights e relatórios
**Tarefas:**
- [ ] Dashboard `/admin/metrics` com Recharts: top conteúdos, engajamento por programa, tempo de escuta, funil, dispositivos.
- [ ] Relatório por usuário individualizado: demográficos + timeline + exportação CSV.
- [ ] Funil de aquisição: visitante → cadastro → interação → assinatura; atribuição por UTM/convite.
- [ ] E2E (Playwright): cenários-chave de admin e relatórios.

**Critérios de aceite:** cada pedido da tabela da seção 10 tem um gráfico/exportação correspondente no painel.

### Fase 8 — Hardening, LGPD e operação
**Tarefas:**
- [ ] RLS auditado (cada política revisada), rate limit em `/events`, auth e pagamentos.
- [ ] Moderação de comentários, áudios e superchats.
- [ ] Backup/point-in-time, monitoramento, retenção e anonimização de dados (LGPD/ANPD).
- [ ] Revisão de Privacidade/Termos com responsável legal; fluxo de exclusão testado ponta a ponta.

**Critérios de aceite:** pentest básico de RLS em script; exclusão de usuário remove/anonimiza conforme política; backups restauráveis.

---

## 12. Critérios de UAT gerais (transversais)

- Toda funcionalidade nova tem teste (Vitest + Testing Library; E2E Playwright para fluxos críticos).
- `npx vitest run`, `npx tsc --noEmit` e `npm run build` verdes ao fim de cada fase.
- Nenhuma interação social sem login; nenhum dado pessoal sem consentimento.
- O site continua funcionando em "modo demonstração" (dados seed) quando não há `.env` — os testes atuais seguem válidos.

---

## 13. Riscos e decisões em aberto

| Risco/decisão | Impacto | Decisão sugerida |
|---------------|---------|------------------|
| **"Login com WhatsApp"** não é OAuth padrão (o WhatsApp não oferece botão "Continuar com WhatsApp" como Meta/Google) | Experiência do cadastro | **Decidido:** OTP por número (WhatsApp Business API/SMS); Google/Meta como login social; cadastro manual com 2FA |
| Verificação de apps Google/Meta (OAuth consent screen, App Review) | Prazo da Fase 1 | Começar com Google + e-mail; Meta/Instagram em paralelo ao App Review |
| **LGPD**: dados demográficos sensíveis (sexo, idade, cidade) | Multas/confiança | Coleta declarada com consentimento explícito; política de retenção; direito de exclusão; menores de 16 bloqueados |
| Custo de provedores (Auth, Storage, Realtime, SMS) | Orçamento | Plano gratuito Supabase para começar; tarifar SMS/WhatsApp OTP apenas com volume |
| Pagamentos (superchat/assinatura) | Conformidade financeira | **Decidido:** Mercado Pago (PIX, crédito, débito) primário; internacionais em **dólar** e **criptomoedas** via adapters (Stripe/PayPal + processador cripto). Exige cadastro/KYC nos gateways e regras de câmbio |
| Câmbio e liquidez de criptomoedas no superchat | Financeiro | Cotar no momento da compra; liquidar em BRL pelo processador; guardar `currency` e valor originais em `payments` |
| Precisão da detecção fone/bluetooth | Métrica parcial | Detectar via `mediaSession`/UA; Web Bluetooth só com permissão; permitir autodeclaração em "Meus Dispositivos" |
| Inferência de origem da navegação (privacidade do navegador) | Funil parcial | Combinar referrer + UTM + convites (`referred_by`) + login social |
| Back-end | Arquitetura | **Decidido:** Supabase (confirmado pelo dono em 14/09/2026) |

---

## 14. Dependências a adicionar

| Pacote | Uso |
|--------|-----|
| `@supabase/supabase-js` | cliente (banco, auth, storage, realtime) |
| `@supabase/ssr` (opcional) | sessão server-side; suporte a MFA/TOTP do Supabase Auth |
| SDK **Mercado Pago** (edge function do Supabase) | pagamentos nacionais: PIX, crédito, débito |
| SDK de gateway internacional (ex.: Stripe/PayPal) | pagamentos em dólar (USD) |
| SDK de processador cripto (ex.: BitPay/Coinbase Commerce/NowPayments) | pagamentos em criptomoedas |
| `nanoid` ou uso de `gen_random_uuid()` | ids de eventos/sessões |

Back-end adicional (se alternativa própria): `fastify`/`express`, `prisma`, `pg`, `zod` (já existe), `jose` (JWT).

---

## 15. Glossário rápido

- **publicationId:** id genérico usado pela UI social (vídeo, reel, live, podcast, episódio, matéria) — vira `publications.id` no banco.
- **flushEvents():** fila local de eventos (src/lib/social.ts) que será enviada a `POST /events`.
- **RLS:** Row Level Security do Postgres — cada linha só é acessível conforme a política (ex.: usuário só lê os próprios dados).
- **Superchat:** mensagem paga em destaque no overlay de programas ao vivo.
- **Funil de aquisição:** jornada visitante → cadastro → interação → assinatura, com atribuição de origem (rede/UTM/convite/anúncio).