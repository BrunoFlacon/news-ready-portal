# -*- coding: utf-8 -*-
# Para cada tag JSX <Xxx> usada em RadioPlayer.tsx, achar onde X ide ef:
# (a) exportado no proprio RadioPlayer? (b) importado (de onde)? (c) existe
# export <Xxx> em QUALQUER arquivo que RadioPlayer importe? Imprime so true.
import os, re

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
SRC = os.path.join(BASE, "src")

def rd_(p_):
    with open(p_, "rb") as f:
        return f.read()
def asc_(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

def wfiles():
    for dp, d_, fns in os.walk(SRC):
        for f_ in fns:
            if f_.endswith((".ts", ".tsx")):
                yield os.path.join(dp, f_)

RP_RAW = rd_(os.path.join(SRC, "components", "RadioPlayer.tsx")).decode("utf-8", errors="replace")
rp_lines = RP_RAW.splitlines()

# tags JSX em RadioPlayer (def local via function/const)
local_defs = set()
for l in rp_lines:
    mm = re.search(r"\b(?:export\s+)?(?:function|const)\s+(RadioPlayerBar|RadioAlertShell|"
                   r"HomeAlertCenter|RadioAlertMute\w*|RadioAlertShell\w*)\b", l)
    if mm:
        local_defs.add(mm.group(1))

# tags JSX: '<Xxx' (com >=2 letras, nao lucide-icons? capture todas)
tags = {}
for m in re.finditer(r"<([A-Z][A-Za-z0-9]*)", RP_RAW):
    tags[m.group(1)] = tags.get(m.group(1), 0) + 1

# imports de RadioPlayer: resolver alias explicitos -> source
imports = []
for l in rp_lines:
    m = re.search(r'import\s*\{([^}]*)\}\s*from\s*["\']([^"\']+)["\']', l)
    if m:
        names = [x.strip() for x in m.group(1).split(",") if x.strip()]
        imports.append((m.group(2), names))

# mapa nome->relacao (estado de memoria de defs em todos os arquivos)
def_of = {}
for p_ in wfiles():
    raw = rd_(p_).decode("utf-8", errors="replace")
    for m in re.finditer(r"\bexport\s+(?:function|const|class)\s+([A-Z][A-Za-z0-9]*)", raw):
        def_of[m.group(1)] = p_.split("src")[-1].split("\\")[-1]

print("=" * 64)
print("[RadioPlayer] tag JSX | def-local | importado | export-em-algum-arquivo")
issues = []
for t_, n_ in sorted(tags.items()):
    is_imported = any(t_ in names for _, names in imports)
    exported = t_ in def_of
    if not is_imported and not exported and t_ not in local_defs:
        issues.append(t_)
    flag = "OK" if (is_imported or exported or t_ in local_defs) else "<-- UNDEFINED?"
    print("  %-22s %-2d | %-6s | %-6s | %-5s  %s"
          % (t_, n_, "S" if t_ in local_defs else "-",
             "S" if is_imported else "-", "S" if exported else "-", flag))
print("=" * 64)
if issues:
    print("[PROBLEMA] tags sem definicao em RadioPlayer:", issues)
else:
    print("[OK] todas as tags de RadioPlayer tem origem importada/definida.")
