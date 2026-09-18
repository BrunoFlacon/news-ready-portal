# -*- coding: utf-8 -*-
# Corrige alerts.ts: remove o 'declare const ReactUseSyncExternalStore' orfao
# (ReferenceError em runtime) e o substitui por binding runtime real, byte-safe.
import os, re, subprocess

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
P = os.path.join(BASE, "src", "lib", "alerts.ts")
OUTF = os.path.join(BASE, "_oracle_alerts_G4.out")

def rd(p):
    with open(p, "rb") as f:
        return f.read()

def wr(p, b):
    with open(p, "wb") as f:
        f.write(b)

raw = rd(P).decode("utf-8", errors="replace")
L = raw.splitlines()

# ---- onde esta o declare + a funcao compat ----
for i, ln in enumerate(L):
    a = "".join(c if 32 <= ord(c) < 127 else "?" for c in ln)
    if re.search(r"declare const ReactUseSyncExternalStore|useSyncExternalStoreCompat|function useAlerts|ReactUseSyncExternalStore\(", a):
        print("%5d| %s" % (i + 1, a[:150]))
print("-" * 50)

# ---- FIX 1: usar React.useSyncExternalStore via import nomeado quando existir ----
# A forma mais segura: substituir o bloco declare-const por uma constante runtime
# que resolve React.useSyncExternalStore (disponivel no React 18+), com fallback.
bloco = re.search(
    r"declare const ReactUseSyncExternalStore:\s*\n"
    r"(?:  [^\n]*\n)*?\s*\);",
    raw,
)
print("[scan] declare-const ReactUseSyncExternalStore encontrado:", bool(bloco))

# ---- montar substituicao ----
subst = (
    "// Bridge runtime: usa useSyncExternalStore do React 18+; fallback procedural.\n"
    "const ReactUseSyncExternalStore =\n"
    "  typeof React !== \"undefined\" && typeof React.useSyncExternalStore === \"function\"\n"
    "    ? React.useSyncExternalStore.bind(React)\n"
    "    : (subscribe: (cb: () => void) => () => void,\n"
    "       getSnapshot: () => AlertsState,\n"
    "       getServerSnapshot: () => AlertsState,\n"
    "      ) => getSnapshot();\n"
)

if bloco:
    raw = raw[:bloco.start()] + subst + raw[bloco.end():]
    wr(P, raw.encode("utf-8"))
    print("[fix] bloco declare-const substituido por binding runtime")
else:
    print("[warn] declare-const nao encontrado; ver admitir que ja foi removido")

# ---- garantir import de React (default) no alerts.ts, se nao houver ----
if "from \"react\"" not in raw and "from 'react'" not in raw:
    # inserir import apos a primeira linha de import existente OU no topo
    lines = raw.splitlines()
    anchor = 0
    for i, ln in enumerate(lines):
        if ln.startswith("import "):
            anchor = i + 1
            break
    lines.insert(anchor, 'import React from "react";')
    raw = "\n".join(lines)
    wr(P, raw.encode("utf-8"))
    print("[fix] import React default adicionado (anchor linha %d)" % (anchor + 1))
else:
    print("[ok] import react ja existe")

# ---- re-verificar uso ----
raw2 = rd(P).decode("utf-8", errors="replace")
print("[check] 'ReactUseSyncExternalStore(' uso:", raw2.count("ReactUseSyncExternalStore("))
print("[check] 'declare const ReactUseSyncExternalStore' restante:", raw2.count("declare const ReactUseSyncExternalStore"))

# ---- oracle ----
env = dict(os.environ)
env["FORCE_COLOR"] = "0"
env["CI"] = "1"
vit = os.path.join("node_modules", ".bin", "vitest.cmd")
try:
    with open(OUTF, "wb") as f:
        r = subprocess.run(["cmd", "/c", vit, "run", "src/test/alerts.test.tsx",
                            "--reporter=basic", "--no-coverage"],
                           cwd=BASE, stdout=f, stderr=subprocess.STDOUT,
                           env=env, shell=False, timeout=280_000)
    print("[oracle] exit:", r.returncode)
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT 280s")

rawO = open(OUTF, "rb").read().decode("utf-8", errors="replace")
print("=" * 58)
for l in rawO.splitlines():
    a = "".join(c if 32 <= ord(c) < 127 else "?" for c in l)
    if re.search(r"(Test Files|Tests |passed|failed|PASS|FAIL|alerts\.test|Cannot read|Error|RadioPlayer\.tsx:\d+|Home\.tsx:\d+|Syntax Error)", a):
        print(a[:170])
