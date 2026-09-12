# Auditoria e Plano de Unificação — Web Rádio Vitória

> **Data:** 12/09/2026
> **Repositório auditado (alvo):** [`BrunoFlacon/news-ready-portal`](https://github.com/BrunoFlacon/news-ready-portal)
> **Repositório a mesclar (fonte):** [`BrunoFlacon/landpagewebradiovitoria`](https://github.com/BrunoFlacon/landpagewebradiovitoria)
> **Objetivo:** eliminar duplicidade entre os dois projetos, mesclando as funcionalidades de ambos em **um único repositório: `news-ready-portal`**, e acrescentar as funcionalidades que faltam em cada um.

---

## 1. Resumo executivo

Os dois repositórios representam **a mesma marca** (“Web Rádio Vitória”, Tupã–SP, slogan “24 hs Adorando a Deus”)
e possuem **grande sobreposição de funcionalidades** (navbar, hero, footer, formulário de contato, redes sociais, suíte shadcn/ui completa).

| Repositório | Papel atual | Stack |
|---|---|---|
| `news-ready-portal` | Portal de notícias + páginas legais (Privacidade/Termos) para aprovação de APIs (TikTok/Meta/Google) | Vite 5, React 18, TypeScript, Tailwind 3, shadcn/ui, React Router 6, TanStack Query, Vitest, Playwright |
| `landpagewebradiovitoria` | Landing page institucional da rádio (design “Celestial Signal”) | Vite 7, React 19, Tailwind 4, wouter, Express (servidor estático), framer-motion, pnpm |

**Decisão:** o `news-ready-portal` será o **repositório único (source of truth)**. A landing page é portada integralmente
para dentro dele (com o mesmo design), as funcionalidades duplicadas são unificadas e as lacunas de cada projeto são preenchidas.

---

## 2. Auditoria — `news-ready-portal` (alvo)

### 2.1 Estrutura
```
├── public/                 (favicon, placeholder.svg, robots.txt)
├── src/
│   ├── components/         (Layout, SiteHeader, SiteFooter, NewsCard, NavLink + ~50 componentes ui/ shadcn)
│   ├── data/articles.ts    (6 artigos placeholder + trendingTopics)
│   ├── hooks/              (use-mobile, use-toast)
│   ├── lib/utils.ts
│   ├── pages/              (Index, ArticlePage, Contact, PrivacyPolicy, TermsOfService, NotFound)
│   ├── test/               (example.test.ts, setup.ts)
│   ├── App.tsx             (rotas)
│   └── main.tsx
├── playwright-*            (config E2E)
└── index.html
```

### 2.2 Funcionalidades existentes
1. Portal de notícias: hero com artigo principal + grade de cards + sidebar “Em Alta”/“Recentes”.
2. Página de artigo (`/artigo/:id`) com imagem, autor, data e botões de compartilhamento.
3. Página **Política de Privacidade** (`/privacy-policy`) — LGPD/GDPR.
4. Página **Termos de Serviço** (`/terms-of-service`).
5. Página de contato (`/contato`) com formulário simples.
6. Header com logo/relógio e footer com links legais.
7. Dark mode no CSS (sem toggle) + suíte completa shadcn/ui + TanStack Query.

### 2.3 Problemas encontrados (auditoria)
| # | Severidade | Problema |
|---|---|---|
| A1 | **Alta** | `index.html` tem **dois `<title>`** e metas OG/Twitter do Lovable (genéricos); `lang="en"` em site pt-BR. Ruim para SEO e aprovação de APIs. |
| A2 | Média | Botões de compartilhamento do artigo **não geram URLs reais** (não compartilham nada). |
| A3 | Média | Links de nav “Política / Tecnologia / Entretenimento” apontam para `/#politica` etc., **âncoras inexistentes** na página inicial (links quebrados). |
| A4 | Média | Formulário de contato é **fake** (apenas toast, sem envio real). |
| A5 | Média | Footer: redes sociais são **placeholders** (letra inicial, sem link real). |
| A6 | Média | Sem página institucional (Sobre/Serviços/Depoimentos) nem informações de contato reais. |
| A7 | Baixa | Não há player de rádio/áudio, embora a marca seja uma rádio. |
| A8 | Baixa | Testes automatizados mínimos (apenas exemplo). |

### 2.4 O que está em dia
- Páginas legais exigidas para verificação de API (**Privacidade + Termos**).
- Estrutura tipicamente React Router + shadcn pronta para escalar.

---

## 3. Auditoria — `landpagewebradiovitoria` (fonte)

### 3.1 Estrutura
```
├── client/
│   ├── public/__manus__/debug-collector.js
│   └── src/
│       ├── components/    (ErrorBoundary, ManusDialog, Map + ~55 ui/ shadcn)
│       ├── contexts/ThemeContext.tsx
│       ├── hooks/         (useComposition, useMobile, usePersistFn)
│       ├── pages/         (Home — landing completa, NotFound)
│       ├── const.ts       (getLoginUrl — OAuth)
│       └── index.css      (design system “Celestial Signal”)
├── server/index.ts        (Express — serve SPA estática)
├── shared/const.ts
└── vite.config.ts         (aliases, Manus debug collector, envDir)
```

### 3.2 Funcionalidades existentes
1. **Landing page completa** (single page): Navbar fixa com scroll + menu mobile.
2. **Hero**: badge “AO VIVO”, título, slogan, stats (29K seguidores / 24h / Tupã), CTAs e visualizador de ondas de áudio animado.
3. Seção **Sobre** com imagem real (CloudFront), história e valores.
4. Seção **Serviços**: 6 cards (Rádio Online 24h, Notícias & Informação, Conteúdo Espiritual, Programas ao Vivo, Alcance Nacional, Comunidade Ativa).
5. Seção **Depoimentos**: 4 testemunhos + barra de stats.
6. Seção **Contato**: formulário completo (nome/e-mail/telefone/mensagem) + **informações reais** (endereço, Instagram `@webradiovitoriaa`, YouTube, Twitter/X, Facebook) + **links sociais reais**.
7. **Footer** completo com navegação, redes sociais reais e slogan.
8. Design system “Celestial Signal” (azul royal #0b1e3d + dourado #c9a227, Playfair Display + Lato, animações de onda).
9. Infra: ErrorBoundary, ThemeProvider, hooks utilitários, componente Google Maps (proxy), dialog de login OAuth, Umami analytics no HTML.

### 3.3 Problemas encontrados (auditoria)
| # | Severidade | Problema |
|---|---|---|
| B1 | **Alta** | **Não tem** página de Política de Privacidade nem Termos de Serviço — bloqueia verificação/aprovação de APIs. |
| B2 | **Alta** | **Não tem** portal de notícias (página de artigo, listagem) — o conteúdo fica restrito a uma landing. |
| B3 | Média | `package.json` usa `wouter ^3.3.5` mas o patch é para `wouter@3.7.1` (inconsistência). |
| B4 | Média | `Map.tsx` depende de `VITE_FRONTEND_FORGE_API_KEY` (não incluída) e o componente não é usado na Home. |
| B5 | Média | `index.html` injeta script Umami com placeholders `%VITE_ANALYTICS_ENDPOINT%` / `%VITE_ANALYTICS_WEBSITE_ID%` (quebrado sem env vars de build). |
| B6 | Baixa | Formulário de contato também é fake (setTimeout + toast). |
| B7 | Baixa | Sem SEO por página / sem meta tags OG próprias. |

### 3.4 O que está em dia
- Identidade visual forte e coesa (design system completo da marca).
- Dados reais de contato e redes sociais.
- Landing pronta para ser o “cartão de visita” da rádio.

---

## 4. Mapa de sobreposição (funcionalidades duplicadas)

| Funcionalidade | `news-ready-portal` | `landpagewebradiovitoria` | Ação |
|---|---|---|---|
| Marca/logo “Web Rádio Vitória” | Sim (letra “V”) | Sim (ícone rádio + nome) | **Mesclar**: usar identidade da landing (ícone rádio dourado) no header unificado |
| Navbar | Sim (Home/Política/Tecnologia/Entretenimento/Contato) | Sim (âncoras Sobre/Serviços/Depoimentos/Contato) | **Mesclar**: nav global (Início, Notícias, Contato) + CTA “Fale Conosco” dourado |
| Footer | Links legais + redes placeholder | Navegação + redes reais | **Mesclar**: redes reais + links legais + slogan |
| Formulário de contato | Sim (simples, toast) | Sim (completo, toast) | **Mesclar**: utilizar o formulário completo da landing |
| Redes sociais | Placeholder | Reais (links + handles) | **Mesclar**: adotar os reais |
| Suíte shadcn/ui | Completa | Completa | **Manter a do alvo** (sem copiar duplicada) |
| Páginas legais (Privacidade/Termos) | Sim | **Não** | **Acrescentar ao unificado** (já vêm do alvo) |
| Portal de notícias + artigo | Sim | **Não** | **Acrescentar ao unificado** (já vem do alvo) |
| Hero/landing institucional | **Não** | Sim | **Acrescentar** (portar Home.tsx) |
| Sobre/Serviços/Depoimentos | **Não** | Sim | **Acrescentar** (portar) |
| Design system da marca (azul/dourado) | Parcial (vermelho genérico) | Completo | **Mesclar**: adotar tokens da landing |
| Analytics Umami | Não | Sim (com placeholders) | **Acrescentar** com env vars documentadas |
| Player de áudio ao vivo | **Não** | **Não** | **Novo** (requer URL do stream — pendente do cliente) |

---

## 5. Estrutura final do repositório unificado (`news-ready-portal`)

```
src/
├── components/
│   ├── ErrorBoundary.tsx            ← da landing (reuso)
│   ├── Layout.tsx                   ← unificado
│   ├── SiteHeader.tsx               ← unificado (nav global + CTA)
│   ├── SiteFooter.tsx               ← unificado (redes reais + legais)
│   ├── NewsCard.tsx                 ← mantido
│   └── ui/                          ← suíte shadcn (mantida, sem duplicar)
├── contexts/
│   └── ThemeContext.tsx             ← da landing (reuso)
├── data/articles.ts                 ← mantido (conteúdo placeholder)
├── hooks/                           ← mantido (+ usePersistFn se necessário)
├── pages/
│   ├── Home.tsx                     ← NOVO: landing completa da rádio (port fiel)
│   ├── Index.tsx                    ← portal de notícias + filtro por categoria (NOVO filtro)
│   ├── ArticlePage.tsx              ← + compartilhamento real e title dinâmico
│   ├── Contact.tsx                  ← unificado (form da landing + infos reais)
│   ├── PrivacyPolicy.tsx            ← mantido
│   ├── TermsOfService.tsx           ← mantido
│   └── NotFound.tsx                 ← mantido
└── test/                            ← + testes das novas páginas
index.html                           ← corrigido (lang pt-BR, metas, fontes)
```

### Rotas finais
| Rota | Página |
|---|---|
| `/` | Home — landing institucional da rádio |
| `/noticias` | Portal de notícias (hero + grid + sidebar + filtro) |
| `/artigo/:id` | Artigo completo |
| `/contato` | Contato unificado |
| `/privacy-policy` | Política de Privacidade |
| `/terms-of-service` | Termos de Serviço |
| `*` | 404 |

---

## 6. Plano de execução (checklist)

### Fase 1 — Fundação
- [x] Clonar e auditar ambos os repositórios
- [x] Documentar este plano

### Fase 2 — Identidade e SEO
- [x] Corrigir `index.html`: `lang="pt-BR"`, título único, description/keywords/OG/Twitter próprios da marca, preconnect para Google Fonts
- [x] Adicionar fontes Playfair Display + Lato (e manter Merriweather/Source Sans para o portal)
- [x] Portar design tokens e animações da landing para `src/index.css` (wave, pulse, fadeInUp, service-card, section-divider…)

### Fase 3 — Port da landing
- [x] Portar `pages/Home.tsx` (Navbar, Hero, Sobre, Serviços, Depoimentos, Contato, Footer da landing)
- [x] Portar `ErrorBoundary.tsx` e `contexts/ThemeContext.tsx`
- [x] Registrar rota `/` = Home e mover portal de notícias para `/noticias`

### Fase 4 — Unificação
- [x] `SiteHeader`: logo da marca (ícone rádio), nav global, CTA “Fale Conosco”
- [x] `SiteFooter`: unificar redes reais + links legais + slogan + copyright
- [x] `Contact.tsx`: formulário completo (nome/e-mail/telefone/mensagem) + infos reais + redes sociais
- [x] `ArticlePage`: compartilhamento com URLs reais (Facebook/X/LinkedIn/WhatsApp) + `document.title`
- [x] `Index` (notícias): filtro por categoria (chips)

### Fase 5 — Qualidade
- [x] Adicionar testes Vitest (render da Home, rotas legais, filtro de categoria)
- [x] Atualizar `README.md` com a estrutura unificada
- [x] `npm run build` + `npm test` verdes
- [x] Commit + push para `main` do `news-ready-portal`

### Fase 5.1 — Paridade total (2ª rodada) 
- [x] **Paridade de arquivos**: `client/src` da landing 100% portado (hooks `useComposition`/`useMobile`/`usePersistFn`, `ManusDialog`, `Map`, `const.ts` → `src/lib/oauth.ts`, `shared/const.ts` → `src/lib/constants.ts`, UI extras: `button-group`, `empty`, `field`, `input-group`, `item`, `kbd`, `spinner`)
- [x] `.env.example` + `.gitignore` protegendo `.env`
- [x] **Player de áudio ao vivo**: `src/components/RadioPlayer.tsx` + botão “Ouvir Agora” no hero + barra fixa (URL via `VITE_RADIO_STREAM_URL`; estado “Em breve” sem URL)
- [x] **Envio real do formulário**: `src/lib/contact.ts` (`VITE_CONTACT_ENDPOINT`, POST JSON com timeout; modo demonstração sem endpoint) integrado em Home e Contact
- [x] **Umami**: `src/lib/analytics.ts` + injeção condicional no `main.tsx`
- [x] **Google Maps**: mapa portado na página de contato com fallback (link Google Maps) quando `VITE_FRONTEND_FORGE_API_KEY` ausente + `@types/google.maps`
- [x] Docs: `docs/IDEIAS-DESIGN.md` (design history) + README/auditoria atualizados
- [x] Testes (19) + `tsc --noEmit` + `npm run build` verdes

### Fase 6 — Pendências que exigem decisão do cliente (valores reais no `.env`)
- [ ] **URL do stream ao vivo** → `VITE_RADIO_STREAM_URL` (Icecast/Shoutcast ou MP3) libera o botão “Ouvir Agora” (código pronto)
- [ ] **Endpoint do formulário** → `VITE_CONTACT_ENDPOINT` (Formspree/Resend/WhatsApp API). Sem valor opera em modo demonstração
- [ ] **Chave do Google Maps** → `VITE_FRONTEND_FORGE_API_KEY` ativa o mapa em `/contato` (fallback pronto)
- [ ] **Analytics Umami** → `VITE_ANALYTICS_ENDPOINT` + `VITE_ANALYTICS_WEBSITE_ID` (script só é injetado quando preenchidos)
- [ ] **Apontamento de domínio**: CNAME/domínio definitivo (example.com) para as URIs OAuth
- [ ] Após confirmação de paridade, **excluir** o repositório `landpagewebradiovitoria` (requer `gh` CLI ou token com escopo `delete_repo`)

---

## 7. Riscos e mitigação
| Risco | Mitigação |
|---|---|
| Quebrar visual da landing ao mudar de Tailwind 4 → 3 | Manter classes utilitárias padrão (todas compatíveis); tokens e animações portados 1:1 |
| Conflito de fontes (2 famílias no portal) | Carregar as 4 faces; cada seção usa sua família via classes/fontes inline |
| Dependência de APIs externas (mapa, analytics, oauth) | Não bloquear o build: deixar componentes/pendências documentados e desligados até fornecerem env vars |
| Perda da branch `feature/batch-export` (inexistente/ref não encontrada) | Não há dependência; registrar apenas |

---

## 8. Conclusão

Após a execução deste plano, o repositório **`news-ready-portal`** conterá:
1. Portal de notícias completo (listagem, artigo, filtro, compartilhamento real).
2. Landing institucional da Web Rádio Vitória com o design “Celestial Signal”.
3. Páginas legais (Privacidade + Termos) para aprovação de APIs.
4. Contato unificado com dados reais da rádio.
5. SEO corrigido (meta tags, lang pt-BR, fontes, title dinâmico).

E o `landpagewebradiovitoria` pode ser desativado/arquivado, eliminando a duplicidade de projetos.