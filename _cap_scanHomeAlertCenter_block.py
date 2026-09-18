# -*- coding: utf-8 -*-
# Acha o componente JSX 'undefined' DENTRO de HomeAlertCenter (mobile 4.2b).
# Escopo: Home.tsx -> funcao HomeAlertCenter (linha 1267) ate o brace que a fecha.
# Para cada tag JSX <X ...> do trecho: esta na lista de defs local? no import
# lucide? no import @/components? no 'export' de algum arquivo? imprime so
# as que NAO tem origem (candidato a undefined). Byte-safe.
import os, re

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
H = os.path.join(BASE, "src", "pages", "Home.tsx")
def rd_(p_):
    with open(p_, "rb") as f:
        return f.read()
def asc_(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

raw = rd_(H).decode("utf-8", errors="replace")
lines = raw.splitlines()

# A) bloco da funcao HomeAlertCenter: 1267 -> fechamento (balanceia chaves)
start = 1266  # 0-based idx da linha 'function HomeAlertCenter() {'
depth = 0
end = len(lines)
for i in range(start, len(lines)):
    for ch in lines[i]:
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
    if depth == 0 and i > start:
        end = i
        break
print("[HomeAlertCenter] corpo: linhas %d..%d" % (start + 1, end + 1))

block = "\n".join(lines[start:end + 1])

# B) defs locais de componente DENTRO do Home.tsx (el >= que HomeAlertCenter)
local_all = set()
for l in lines:
    mm = re.match(r"\s*(?:export\s+)?(?:async\s+)?function\s+([A-Z]\w*)\s*\(", l)
    if mm:
        local_all.add(mm.group(1))
    mm2 = re.match(r"\s*(?:export\s+)?const\s+([A-Z]\w*)\s*=\s*(?:\([^)]*\)\s*=>|function)", l)
    if mm2:
        local_all.add(mm2.group(1))

# C) imports (nomes) deste arquivo, sem 'type'
imported = set()
for l in lines:
    mm = re.match(r'.*?\bimport\s*\{([^}]*)\}\s*from\s*["\']', l)
    if mm:
        for nm in mm.group(1).split(","):
            nm = nm.strip()
            if nm and not nm.startswith("type"):
                imported.add(nm)

# D) defs locais ANTES de HomeAlertCenter (referencias vindas de cima)
defined_before = set()
for l in lines[:start]:
    mm = re.match(r"\s*(?:export\s+)?function\s+([A-Z]\w*)\s*\(", l)
    if mm:
        defined_before.add(mm.group(1))

# E) tags JSX no bloco + juiz
tags = {}
for m in re.finditer(r"<([A-Z][A-Za-z0-9]*)", block):
    t = m.group(1)
    tags[t] = tags.get(t, 0) + 1

print("=" * 60)
print("tag JSX | local-no-trecho | definido-acima | importado | eh-membro-de-outro-nome?")
one_maybe = []
for t, n in sorted(tags.items()):
    local_ = t in local_all
    before_ = t in defined_before
    imp_ = t in imported
    if local_ or before_ or imp_:
        print("  %-20s | uso=%d | %s" % (t, n, "OK" if (local_ or imp_) else "def-acima?"))
    else:
        one_maybe.append(t)
        print("  %-20s | uso=%d | <-- CANDIDATO undefined" % (t, n))
print("=" * 60)
print("candidatos:", one_maybe)
