# -*- coding: utf-8 -*-
# Localizar a UNICA ocorrencia real de 'nullapsed' em Home.tsx, mostrar contexto
# (linha + vizinhos + tag JSX), e deduzir o identificador correto comparando
# com o conjunto de componentes que alerts.test.tsx importa de @/pages/Home.
import os, re

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
H = os.path.join(BASE, "src", "pages", "Home.tsx")
T = os.path.join(BASE, "src", "test", "alerts.test.tsx")

def rd(p_):
    with open(p_, "rb") as f:
        return f.read()

raw = rd(H).decode("utf-8", errors="replace")
lines = raw.splitlines()

print("=" * 60)
print("[Home.tsx] ocorrencias de 'nullapsed':")
for i, l in enumerate(lines):
    if "nullapsed" in l:
        print("linha %d:" % (i + 1))
        for j in range(max(0, i - 4), min(len(lines), i + 6)):
            tag = ">>>"
            if i == j:
                tag = ">>>"
            print("%3d %s| %s" % (j + 1, tag if j == i else "   ", l[j:][:140] if j == i else lines[j][:140]))
        # mostrar o fragmento exato
        idx = l.find("nullapsed")
        print("   fragmento 60b esquerda..60b direita:")
        print("   L: %r" % l[max(0, idx - 60):idx])
        print("   R: %r" % l[idx:idx + 120])

# quais componentes o TEST espera ter em Home (imports)? 100% sem rotulo;
# pega linhas import de alerts.test que citam Home
print("=" * 60)
print("[alerts.test.tsx] linhas que importam de @/pages/Home:")
rawT = rd(T).decode("utf-8", errors="replace")
for i, l in enumerate(rawT.splitlines()):
    if "pages/Home" in l:
        print("%5d| %s" % (i + 1, l[:160]))

print("=" * 60)
print("[Home.tsx] token c/ problema: nullapsed. Checar o que 'devia' ser por"
      " localizacao: linha atual = %d. Ver defs de componentes na vizinhanca:"
      % ([i + 1 for i, l in enumerate(lines) if "nullapsed" in l][0] if any("nullapsed" in l for l in lines) else -1))
for i, l in enumerate(lines):
    if re.search(r"function\s+(HomeAlertCenter|HomeAlertBell|HomeAlertBadge|HomeAlertToast|HomeBreakingTicker|HomeAlertPlayer)\b", l) or re.search(r"export\s+function\s+RadioAlertShell", l):
        print("   def %5d| %s" % (i + 1, l[:120]))
