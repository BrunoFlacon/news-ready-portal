# Plano — Ferramentas Sociais de Sobreposição (Vitória News)

> Documento de design e implementação das ferramentas sociais exibidas sobre
> cada publicação do portal (lives, vídeos, imagens, reels/stories e podcasts).
> Objetivo: transformar o consumo de conteúdo em um comportamento social — com
> curtidas, comentários, compartilhamentos e convites para novos assinantes —
> funcionando **sem banco de dados** desde já, mas com a captura de dados pronta
> para ser conectada a um banco no futuro.

---

## 1. Visão geral

Cada formato de mídia recebe uma sobreposição social inspirada na rede social
que consolidou o formato:

| Formato de mídia                           | Padrão visual      | Ações disponíveis                                    |
| ------------------------------------------ | ------------------ | ---------------------------------------------------- |
| Live, vídeo, imagem horizontal, artigo     | YouTube (fullscreen) | Curtir, comentar, compartilhar, convidar assinante |
| Reel, story, imagem vertical               | Instagram          | Curtir, comentar, compartilhar, salvar, convidar     |
| Podcast em áudio                           | Spotify            | Curtir, comentar, compartilhar, convidar             |

Todas as ações usam **ícones SVG compactos** (lucide-react, já no projeto) com
`aria-label` em português e tooltip, seguindo o padrão de acessibilidade já
usado no player do banner (componente `ControlButton`).

### Ação central: convidar novos assinantes

O diferencial do portal: além das ações clássicas de rede social, há um convite
para amigos **virarem assinantes da Vitória News** em qualquer rede social
(WhatsApp, Facebook, Telegram, X). O convite abre um diálogo com:
- mensagem pronta ("Assine a Vitória News e fique por dentro de tudo: {url}");
- botão de cópia do link;
- atalhos de compartilhamento em cada rede;
- **registro do evento de convite** para o futuro banco (quantos convites, de
  qual publicação).

---

## 2. Barra horizontal (YouTube fullscreen)

**Onde aparece:** sobre lives, vídeos, imagens horizontais e matérias/artigos
abertos no player do banner (`WatchOverlay` → `Home.tsx`).

**Posição:** barra compacta sobre o vídeo (canto inferior, acima dos controles
do player), visível junto com os controles (mesma lógica de `uiVisible`), com
fundo translúcido `bg-black/40 backdrop-blur` e ícones brancos de 18–20 px.

**Ações (da esquerda para a direita):**

1. **Curtir** — coração; alterna curtiu/descurtiu; mostra contador local.
2. **Comentar** — balão; abre diálogo com campo de texto; salva o comentário
   localmente e o exibe como lista simples.
3. **Compartilhar** — ícone de compartilhamento; abre diálogo com links das
   redes (WhatsApp, Facebook, Telegram, X) e copiar link.
4. **Convidar assinante** — ícone "+ Amigo / UserPlus"; abre o diálogo de
   convite descrito na seção 1.

---

## 3. Rail vertical (Instagram)

**Onde aparece:** sobre reels, stories e imagens verticais (`orientation === "vertical"`).

**Posição:** coluna vertical fixa à direita do conteúdo 9:16 (estilo reels do
Instagram/desktop), eixo centralizado na altura do vídeo.

**Ações (de cima para baixo):**

1. **Curtir** — coração (como no Instagram; coração "explode" para rosa no clique).
2. **Comentar** — balão; diálogo e lista local de comentários.
3. **Compartilhar** — seta de envio; diálogo de redes.
4. **Salvar** — marcador (bookmark); registra no local "salvos" (chave do
   navegador) e mostra estado ativo.
5. **Convidar assinante** — ícone "+ Amigo"; diálogo de convite.

---

## 4. Barra de podcast (Spotify)

**Onde aparece:** na barra inferior de "tocando agora" (`NowPlayingBar`), que já
é estilo Spotify.

**Ações adicionadas ao grupo de controles:**

1. **Curtir** — coração com contador (mesmo padrão da barra da rádio ao vivo,
   que já implementa curtir com métricas via `localStorage`).
2. **Compartilhar** — abre o diálogo de compartilhamento do episódio.
3. **Convidar assinante** — abre o diálogo de convite.

---

## 5. Funcionamento sem banco (estado v0)

Todas as ações funcionam **sem backend** nesta versão, persistindo no
`localStorage` do navegador. O módulo central é `src/lib/social.ts` e expõe:

- `likes(liked)`, `likesCount()`, `toggleLike(id)` — curtidas por publicação;
- `save(id)` / `isSaved(id)` — publicações salvas;
- `comments(id)` / `addComment(id, text)` — comentários por publicação;
- `share(id, network)` — registro de compartilhamento;
- `invite(id, network)` — registro de convite;
- `trackView(id, seconds)` — acumula o **tempo de visualização** por publicação;
- `flushEvents()` — exporta todos os eventos acumulados no formato pronto para
  inserção no banco (JSON) e limpa a fila local.

Chaves de armazenamento (prefixo `social.`):

| Chave                          | Conteúdo                                    |
| ------------------------------ | ------------------------------------------- |
| `social.liked.{id}`            | `1`/`0` — usuário curtiu a publicação       |
| `social.likes.total.{id}`      | total local de curtidas                     |
| `social.saved.{id}`            | `1`/`0` — publicação salva                 |
| `social.comments.{id}`         | `JSON` da lista de comentários              |
| `social.events`                | fila `JSON` de eventos (share, invite, view)|

### Instruções de captura para o banco futuro

Em cada publicação/live, os eventos abaixo já são capturados e ficam
prontos para sincronização:

1. **Navegação:** abertura do player/publicação (tipo, id, timestamp).
2. **Curtidas:** like/unlike (id da publicação, timestamp, valor).
3. **Tempo de visualização:** acumulado por `trackView` (id, segundos totais),
   disparado por `timeupdate` do player (play/scroll visível).
4. **Comentários:** texto, id da publicação, timestamp.
5. **Compartilhamentos e convites:** rede, id da publicação, timestamp.

Para conectar ao banco (ex.: Supabase, já usado no repositório `SiteVitoriaNews`):
implantar `flushEvents()` em um endpoint/edge function e chamá-lo quando o
usuário autenticar, ao sair da página (`visibilitychange`/`beforeunload`) ou em
intervalos durante a sessão. O payload de `flushEvents()` já chega normalizado
por `{ publicationId, action, value, createdAt }`.

> Nota editorial (v0): os contadores exibidos ("curtidas", "salvos") são locais
> por navegador. Quando o banco entrar, o contador real virá da API e o valor
> local será apenas um fallback otimista.

---

## 6. Componentes novos

| Arquivo                            | Responsabilidade                                        |
| ---------------------------------- | ------------------------------------------------------- |
| `src/lib/social.ts`                | Estado social sem banco + fila de eventos (API central) |
| `src/components/SocialActions.tsx` | `SocialBar` (horizontal) e `SocialRail` (vertical)      |
| `src/components/SocialDialogs.tsx` | `CommentDialog`, `ShareContentDialog`, `InviteDialog`   |

Os componentes são alimentados por `useSocialItem(id)` (hook em `social.ts`)
para manter os estados sincronizados com o armazenamento local.

---

## 7. Integração

- `WatchOverlay` (em `Home.tsx`) renderiza `SocialBar` para
  `orientation === "horizontal"` (lives, vídeos, imagens horizontais, artigos)
  e `SocialRail` para `orientation === "vertical"` (reels, stories).
- `NowPlayingBar` (em `RadioPlayer.tsx`) ganha o grupo Curtir/Compartilhar/
  Convidar para podcasts.
- Componentes de diálogo são portados para `document.body` via `createPortal`
  (mesma técnica já usada para os diálogos da barra da rádio — o
  `backdrop-blur` da barra cria um containing block que prenderia modais
  `fixed inset-0`).

---

## 8. Critérios de aceite (UAT)

1. Lives/vídeos/imagens horizontais e artigos exibem a barra social horizontal
   com as 4 ações; cliques funcionam e persistem entre sessões (localStorage).
2. Reels/stories/imagens verticais exibem o rail vertical com as 5 ações.
3. Podcasts exibem Curtir/Compartilhar/Convidar na barra inferior.
4. O convite gera links reais de rede social e registra o evento `invite`.
5. O tempo de visualização é acumulado por publicação (`trackView`).
6. `flushEvents()` devolve o payload pronto para o banco e limpa a fila.
7. Todos os testes novos e existentes passam (`npx vitest run`).