# -*- coding: utf-8 -*-
# REPARA alerts.ts (byte-safe): o codigo chama ReactUseSyncExternalStore(...) no
# runtime via useSyncExternalStoreCompat, mas so existe um 'declare const ...' tipo
# (sem valor) -> ReferenceError em vitest. Garantimos um binding runtime real:
# import nomeado useSyncExternalStore do react e alias local; fallback gerador.
import os, re, subprocess

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
P = os.path.join(BASE, "src", "lib", "alerts.ts")
OUTF = os.path.join(BASE, "_oracle_alerts_G5.out")

def rd(p):
    with open(p, "rb") as f:
        return f.read()

def wr(p, b):
    with open(p, "wb") as f:
        f.write(b)

def asc(s):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s)

raw = rd(P).decode("utf-8", errors="replace")

# --- 1) metadata: onde a chamada/declaracao esta ---
for m in re.finditer(r"ReactUseSyncExternalStore", raw):
    s = max(0, m.start() - 40)
    e = min(len(raw), m.end() + 50)
    snip = raw[s:e].replace("\r", " ").replace("\n", " ")
    print("[scan] ocorrencia @%d | %s" % (m.start(), asc(snip)[:110]))

# --- 2) garantir import runtime do useSyncExternalStore ---
if "useSyncExternalStore" in raw and ("from 'react'" in raw or 'from "react"' in raw):
    print("[scan] react ja importado com useSyncExternalStore referencia")
else:
    # injeta import nomeado react (se ainda nao existir import do react)
    if "from 'react'" not in raw and 'from "react"' not in raw:
        # coloca logo apos o ultimo import top-level, senao no topo
        lines = raw.splitlines()
        last_imp = -1
        for i, ln in enumerate(lines):
            if ln.startswith("import "):
                last_imp = i
        insert_at = last_imp + 1 if last_imp >= 0 else 0
        lines.insert(insert_at, 'import { useSyncExternalStore } from "react";')
        raw = "\n".join(lines)
        print("[fix] import react injectado na linha %d" % (insert_at + 1))

# --- 3) substituir o declare-const tipo por definicao runtime real ---
pat_decl = re.compile(
    r"declare const ReactUseSyncExternalStore\s*:\s*\([^)]*\)\s*=>\s*AlertsState\s*;?"
)
repl_decl = (
    "// Binding runtime real: usa useSyncExternalStore do react 18+ (import\n"
    "// nomeado acima); fallback gerador pregui\u00e7oso para ambientes sem react.\n"
    "const ReactUseSyncExternalStore =\n"
    "  typeof useSyncExternalStore === \"function\"\n"
    "    ? useSyncExternalStore\n"
    "    : (function (subscribe, getSnapshot) {\n"
    "        let state = getSnapshot();\n"
    "        subscribe(function () { state = getSnapshot(); });\n"
    "        return state;\n"
    "      } as typeof useSyncExternalStore);\n"
)

n_decl = len(pat_decl.findall(raw))
raw = pat_decl.sub(repl_decl, raw, count=1)
print("[fix] declare-const substituido (matches):", n_decl)

# --- 4) mesma troca para a variavel usada na compat (caso haja outro nome) ---
raw = raw.replace(
    "declare const ReactUseSyncExternalStore",
    "const ReactUseSyncExternalStore",
)

wr(P, raw.encode("utf-8"))
print("[write] alerts.ts gravado | bytes:", len(raw.encode("utf-8")))

# --- 5) oraaculo ---
env = dict(os.environ)
env["FORCE_COLOR"] = "0"
env["CI"] = "1"
vit = os.path.join(BASE, "node_modules", ".bin", "vitest.cmd")
try:
    with open(OUTF, "wb") as f:
        r = subprocess.run(["cmd", "/c", vit, "run", "src/test/alerts.test.tsx",
                            "--reporter=basic", "--no-coverage"],
                           cwd=BASE, stdout=f, stderr=subprocess.STDOUT,
                           env=env, timeout=280_000)
    print("[oracle] exit:", r.returncode)
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT 280s")

rawO = rd(OUTF).decode("utf-8", errors="replace")
print("=" * 60)
for l in rawO.splitlines():
    a = asc(l)
    if len(a.strip()) == 0:
        continue
    print(a[:170])
