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

## Pendências que exigem decisão do cliente

1. **Player de áudio ao vivo** — URL do stream (Icecast/Shoutcast ou mp3) para o botão “Ouvir Agora”.
2. **Envio real do formulário de contato** — endpoint (Formspree/Resend/WhatsApp API) para substituir o toast simulado.
3. **Domínio definitivo** — apontar o CNAME/HTTPS público para URIs OAuth.
4. **Analytics Umami** — definir `VITE_ANALYTICS_ENDPOINT` e `VITE_ANALYTICS_WEBSITE_ID`.
5. **Google Maps** — incluir seção com mapa (requer `VITE_FRONTEND_FORGE_API_KEY`).
6. **Arquivar/desativar** o repositório `landpagewebradiovitoria` após a unificação.

---

Este projeto foi criado com o [Lovable](https://lovable.dev) e continua mantido como repositório único para o domínio público e aprovação de APIs.