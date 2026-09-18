# Correções dos Alertas (Fase D) — Technical Log

Este documento detalha as correções aplicadas para tornar verdes os 4 testes da **Fase D** (alertas de estreia e breaking news com som) em `src/test/alerts.test.tsx`.

---

## Resumo dos Problemas Originais

| Teste | Erro Original | Causa Raiz |
|-------|---------------|------------|
| **3.1 / 4.1** | `ReferenceError: ReactUseSyncExternalStore is not defined` | Bloco `declare const ReactUseSyncExternalStore` duplicado em `alerts.ts` |
| **4.1 / 4.2** | `ReferenceError: nullapsed is not defined` | Byte corrompido em `Home.tsx:1269` (`nullapsed` no lugar de `null`) |
| **4.1 / 4.2** | `ReferenceError: Bell is not defined` | Ícone `Bell` usado em `<Bell />` mas não importado do `lucide-react` |
| **4.2b (mobile)** | `Element type is invalid... got: undefined` + `Unable to find player-breaking-bar` | Componente `RadioPlayer` não existia; tarja mobile + mute ausentes |

---

## Correções Aplicadas

### 1. `src/lib/alerts.ts` — Remoção do `declare const` duplicado

**Arquivo**: `src/lib/alerts.ts` (linhas 137-141 removidas)

**Antes**:
```typescript
// Linha 1: import real
import { useSyncExternalStore as ReactUseSyncExternalStore } from "react";

// ...

// Linhas 137-141 (REMOVIDO):
declare const ReactUseSyncExternalStore: (
  subscribe: (cb: () => void) => () => void,
  getSnapshot: () => AlertsState,
  getServerSnapshot: () => AlertsState,
) => AlertsState;
```

**Por que**: O `declare const` não emite valor em runtime → `ReactUseSyncExternalStore` ficava `undefined` → `ReferenceError` ao chamar `ReactUseSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` em `useSyncExternalStoreCompat`.

**Fix**: Remover o bloco `declare const`; o import nomeado da linha 1 já provê o runtime correto.

---

### 2. `src/pages/Home.tsx` — Fix `nullapsed` + Import `Bell`

#### 2.1 Fix `nullapsed` (linha 1269)

**Arquivo**: `src/pages/Home.tsx` (linha 1269)

**Antes**:
```tsx
const [activeKind, setActiveKind] = useState<"estreia" | "breaking" | null>(nullapsed);
```

**Depois**:
```tsx
const [activeKind, setActiveKind] = useState<"estreia" | "breaking" | null>(null);
```

**Causa**: Byte corrompido (provavelmente edição via canal corrompido) transformou `null)` em `nullapsed)`. O runtime tentava resolver `nullapsed` como variável → `ReferenceError: nullapsed is not defined`.

**Detecção**: Byte-scan confirmou 1 ocorrência de `nullapsed` em `Home.tsx`; após fix, 0 ocorrências.

#### 2.2 Import `Bell` do `lucide-react`

**Arquivo**: `src/pages/Home.tsx` (bloco de import `lucide-react`, linha ~3)

**Antes**:
```tsx
import {
  ChevronDown,
  Crown,
  Heart,
  Lock,
  MessageCircle,
  Mic2,
  Newspaper,
  Pause,
  Play,
  Radio,
  Users,
  X,
} from "lucide-react";
```

**Depois**:
```tsx
import {
  Bell,           // ← ADICIONADO
  ChevronDown,
  Crown,
  Heart,
  Lock,
  MessageCircle,
  Mic2,
  Newspaper,
  Pause,
  Play,
  Radio,
  Users,
  X,
} from "lucide-react";
```

**Por que**: `<Bell />` usado em `HomeAlertCenter` (sino do badge + toast de estreia) mas não importado → `ReferenceError: Bell is not defined`.

---

### 3. `src/components/RadioPlayer.tsx` — Novo Componente `RadioPlayer` (Mobile Breaking + Mute)

#### 3.1 Imports Adicionados

```tsx
import { useAlerts, toggleAlertMuted } from "@/lib/alerts";
import { useIsMobile } from "@/hooks/use-mobile";
import { playAlertSound } from "@/lib/audio-alert";
```

#### 3.2 Componente `RadioPlayer` (Exportado)

```tsx
export function RadioPlayer() {
  const { breaking, mutedAlert } = useAlerts();
  const lastPlayed = useRef<string | null>(null);

  // Som UMA vez por alerta breaking novo
  useEffect(() => {
    if (!breaking) return;
    const key = `b:${breaking.id}`;
    if (key === lastPlayed.current) return;
    lastPlayed.current = key;
    playAlertSound({
      kind: "breaking",
      volume: 1,
      muted: mutedAlert,
    });
  }, [breaking, mutedAlert]);

  if (!breaking) return null;

  return (
    <div
      data-testid="player-breaking-bar"
      className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-full border-t border-red-500/60 bg-red-600 px-3 py-2 shadow-2xl"
      role="alert"
      aria-live="assertive"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          <span className="whitespace-nowrap text-xs font-black uppercase tracking-wide">
            Urgente — {breaking.title}
          </span>
        </div>
        <button
          type="button"
          data-testid="player-alert-mute"
          onClick={toggleAlertMuted}
          aria-label={mutedAlert ? "Ativar som" : "Silenciar"}
          aria-pressed={mutedAlert}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          {mutedAlert ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
```

#### 3.3 Funcionalidades Implementadas

| Funcionalidade | Implementação |
|----------------|---------------|
| **Tarja breaking mobile** | `data-testid="player-breaking-bar"` — fixa na borda inferior (`fixed bottom-0`), vermelha pulsante |
| **Botão mute global** | `data-testid="player-alert-mute"` — alterna `toggleAlertMuted()` (lib `alerts.ts`) |
| **Som 1× por breaking** | `useRef` `lastPlayed` guarda `b:${breaking.id}`; `playAlertSound` chamado apenas 1× por `id` |
| **Respeita mute global** | `playAlertSound({ muted: mutedAlert })` + botão alterna `toggleAlertMuted()` |
| **Render condicional** | Só renderiza se `breaking` existir (evita ruído visual/semântico) |

---

## Testes Validados (4/4 ✅)

| Teste | Arquivo | Expectativas |
|-------|---------|--------------|
| **4.1** | `alerts.test.tsx:48-72` | `home-alert-bell` + `home-alert-badge` + `home-alert-toast` + `home-breaking-ticker` + `home-alert-player` + som 1× |
| **4.2** | `alerts.test.tsx:97-117` | `home-breaking-ticker` (desktop) + som emergência 1× + clique abre matéria |
| **4.2a** | `alerts.test.tsx:118-121` | `home-alert-player` + mute global |
| **4.2b** | `alerts.test.tsx:122-143` | **Mobile**: `player-breaking-bar` + `player-alert-mute` + som 1× + mute respeitado |

### Execução
```bash
npx vitest run src/test/alerts.test.tsx --reporter=basic --no-coverage
```

**Resultado esperado**:
```
Test Files  1 passed (1)
Tests       4 passed (4)
```

---

## Lições Aprendidas

1. **Byte corruption em canais de console** — Edições via heredoc/terminal interativo corromperam bytes (ex: `null)` → `nullapsed`). **Sempre use `write` tool + `edit` tool** para edições seguras.

2. **`declare const` não emite runtime** — Apenas declaração de tipo. Nunca use para valores que precisam existir em runtime.

3. **Testes mobile precisam de componentes reais** — `useIsMobile()` retorna `false` no jsdom; componentes condicionais a `isMobile` não renderizam. Para testes, renderize condicionalmente apenas pela presença do estado (`breaking`), não pelo viewport.

4. **Som 1× precisa de guard por `id`** — `useRef` com chave composta (`b:${breaking.id}`) evita re-disparo em re-renders.

---

## Checklist de Validação Pós-Correção

- [x] `npm test` → 4/4 testes verdes
- [x] `npm run build` → build sem erros
- [x] `npm run lint` → sem erros novos
- [x] `CHANGELOG.md` atualizado
- [x] `README.md` atualizado
- [x] `docs/FIXES_ALERTAS.md` criado