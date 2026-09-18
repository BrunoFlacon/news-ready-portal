# Web Rádio Vitória — Portal de Notícias

Portal editorial unificado para a **Web Rádio Vitória** (Tupã, SP), integrando:
- **Transmissão ao vivo** (stream de áudio contínuo)
- **Podcasts** sob demanda (barra estilo Spotify)
- **Vídeos/Reels/Stories** recomendados (mini-player flutuante)
- **Sistema de alertas** de estreia e breaking news com som
- **Painel administrativo** (anúncios + grade de programação)
- **Compartilhamento social** (WhatsApp, convites, pedidos de música)

---

## 🚀 Quick Start

```bash
# Instalar dependências
npm install

# Desenvolvimento (Vite + HMR)
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

---

## 🧪 Testes

```bash
# Rodar todos os testes (Vitest + Testing Library React)
npm test

# Modo watch (re-executa ao salvar)
npm run test:watch
```

### Testes de Alertas (Fase D)
```bash
# Rodar apenas testes de alertas (4.1/4.2/4.2a/4.2b)
npx vitest run src/test/alerts.test.tsx
```

**Testes cobertos (4/4 verdes):**
| Teste | Descrição |
|-------|-----------|
| **4.1** | "Lembrar-me" de estreia → toast + sino + badge + som discreto 1× |
| **4.2** | Breaking desktop → tarja vermelha pulsante + som emergência 1× |
| **4.2a** | Mute global respeitado (player + alertas) |
| **4.2b** | Breaking mobile → tarja inferior + mute global + som 1× |

---

## 📁 Estrutura Principal

```
src/
├── components/
│   ├── RadioPlayer.tsx      # Player unificado (live + podcasts + vídeos)
│   ├── RadioPlayerBar.tsx   # Barra principal (desktop)
│   ├── VideoBubble.tsx      # Mini-player flutuante (vídeos/reels)
│   ├── HomeAlertCenter.tsx  # Central de alertas (Home)
│   ├── SocialDialogs.tsx    # Comentários, compartilhamento, convites
│   └── ui/                  # Componentes base (Radix + Tailwind)
├── pages/
│   ├── Home.tsx             # Portal editorial (Hero + grade + alertas)
│   ├── Admin.tsx            # Painel admin (anúncios + grade)
│   └── ...
├── lib/
│   ├── alerts.ts            # Motor de alertas (estreia + breaking)
│   ├── audio-alert.ts       # Som de alerta (playAlertSound)
│   ├── schedule.ts          # Grade de programação
│   └── ...
├── contexts/
│   ├── RadioPlayerContext.tsx  # Provider global do player
│   └── ThemeContext.tsx        # Tema dark/light
├── hooks/
│   └── use-mobile.tsx         # Detecção mobile (matchMedia)
└── test/
    ├── alerts.test.tsx        # Testes Fase D (4.1/4.2/4.2a/4.2b)
    └── utils.tsx              # renderWithProviders + RadioPlayerProvider
```

---

## 🔧 Variáveis de Ambiente

Crie `.env` na raiz (baseado no `.env.example`):

```env
# Stream da rádio (fallback se não configurado)
VITE_RADIO_STREAM_URL=https://shoutcast2.s12.com.br:16002/stream

# Supabase (opcional - para dados persistentes)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## 📦 Stack Tecnológico

- **React 18** + **TypeScript** + **Vite 5**
- **Tailwind CSS** + **Radix UI** (componentes acessíveis)
- **React Router v6** (roteamento SPA)
- **TanStack Query** (cache de dados)
- **Vitest** + **Testing Library React** (testes)
- **Lucide React** (ícones)
- **date-fns** (datas/horários)

---

## 📝 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de dev (HMR) |
| `npm run build` | Build produção (`dist/`) |
| `npm run preview` | Preview do build |
| `npm run lint` | ESLint |
| `npm test` | Testes (Vitest run) |
| `npm run test:watch` | Testes watch mode |

---

## 📄 Licença

Proprietário — Web Rádio Vitória. Uso interno.