# Web Rádio Vitória — Portal de Notícias (news-ready-portal)

Repositório **único** do projeto Web Rádio Vitória (Tupã–SP · “24 hs Adorando a Deus”).

Resultado da **unificação** de dois repositórios:
- `BrunoFlacon/news-ready-portal` — portal de notícias + páginas legais (para aprovação de APIs TikTok/Meta/Google).
- `BrunoFlacon/landpagewebradiovitoria` — landing institucional da rádio (design “Celestial Signal”).

> 📋 Auditoria e plano de unificação completos: [`AUDITORIA-E-PLANO-UNIFICACAO.md`](./AUDITORIA-E-PLANO-UNIFICACAO.md)

---

## Funcionalidades

### Landing institucional (`/`)
- Hero “AO VIVO” com stats (29K seguidores, 24h, Tupã) e visualizador de ondas animado
- **Player de áudio ao vivo** — botão “Ouvir Agora” abre barra fixa com stream (URL via `VITE_RADIO_STREAM_URL`); sem URL, exibe estado “Em breve”
- Seções: Sobre (história + valores), Serviços (6 cards), Depoimentos (4 testemunhos)
- Contato com informações reais e redes sociais da rádio
- Footer com slogan “24 hs Adorando a Deus”

### Portal de notícias (`/noticias`, `/artigo/:id`)
- Listagem com hero de destaque, grade de cards e sidebar (“Em Alta” / “Recentes”)
- **Filtro por categoria** (Política, Tecnologia, Entretenimento)
- Página de artigo com autor, data e **compartilhamento real** (Facebook, X, LinkedIn, WhatsApp, copiar link)
- **Título dinâmico** por artigo (SEO)

### Páginas legais (requisito para aprovação de APIs)
- Política de Privacidade (`/privacy-policy`)
- Termos de Serviço (`/terms-of-service`)

### Contato (`/contato`)
- Formulário completo (nome, e-mail, telefone, mensagem)
- **Envio real** via `VITE_CONTACT_ENDPOINT` (Formspree/Webhook/WhatsApp API); sem endpoint, modo demonstração
- **Google Maps** integrado quando `VITE_FRONTEND_FORGE_API_KEY` está configurada; fallback com link para o Google Maps
- Endereço e redes sociais reais

---

## Rotas

| Rota | Página |
|---|---|
| `/` | Landing institucional da rádio |
| `/noticias` | Portal de notícias |
| `/artigo/:id` | Artigo completo |
| `/contato` | Contato unificado |
| `/privacy-policy` | Política de Privacidade |
| `/terms-of-service` | Termos de Serviço |
| `*` | 404 |

---

## Stack

- Vite 5 + React 18 + TypeScript
- Tailwind CSS 3 + shadcn/ui (Radix)
- React Router 6 + TanStack Query
- Vitest (unit) + Playwright (e2e)
- Fontes: Merriweather / Source Sans 3 (portal) · Playfair Display / Lato (landing)

---

## Variáveis de ambiente (arquivo `.env`)

Copie [`.env.example`](./.env.example) para `.env` e preencha:

| Variável | Finalidade |
|---|---|
| `VITE_RADIO_STREAM_URL` | URL do stream ao vivo (Icecast/MP3) — libera o botão “Ouvir Agora” |
| `VITE_CONTACT_ENDPOINT` | Endpoint de envio do formulário (Formspree/WhatsApp API/Webhook) |
| `VITE_ANALYTICS_ENDPOINT` | Instância Umami (o script só é injetado quando preenchida) |
| `VITE_ANALYTICS_WEBSITE_ID` | ID do website no Umami |
| `VITE_FRONTEND_FORGE_API_KEY` | Chave do Google Maps (mapa na página de contato) |
| `VITE_FRONTEND_FORGE_API_URL` | Proxy do Google Maps (default: `https://forge.butterfly-effect.dev`) |
| `VITE_OAUTH_PORTAL_URL` / `VITE_APP_ID` | Login OAuth (quando aplicável) |

> ⚠️ **Nunca commitar o `.env`** (já ignorado pelo `.gitignore`).

---

## Desenvolvimento

```sh
npm install
npm run dev
```

Build de produção:

```sh
npm run build
```

Testes:

```sh
npm test        # vitest run
```

---

## Pendências que exigem decisão do cliente (valores reais)

O código já está pronto e pronto para produção — basta preencher os valores no `.env`:

1. **URL do stream ao vivo** → `VITE_RADIO_STREAM_URL` (Icecast/Shoutcast ou MP3) libera o botão “Ouvir Agora”.
2. **Endpoint do formulário** → `VITE_CONTACT_ENDPOINT` (Formspree/Resend/WhatsApp API). Sem valor, o envio fica em modo demonstração.
3. **Chave do Google Maps** → `VITE_FRONTEND_FORGE_API_KEY` ativa o mapa em `/contato`.
4. **Analytics Umami** → `VITE_ANALYTICS_ENDPOINT` + `VITE_ANALYTICS_WEBSITE_ID`.
5. **Domínio definitivo** — apontar o CNAME/HTTPS público para URIs OAuth.
6. **Arquivar/desativar** o repositório `landpagewebradiovitoria` (conteúdo 100% unificado e portado aqui).

---

Este projeto foi criado com o [Lovable](https://lovable.dev) e continua mantido como repositório único para o domínio público e aprovação de APIs.