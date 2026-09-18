# -*- coding: utf-8 -*-
# ASCII-only, byte-safe.
# Repara alerts.ts: o oracle acusa ReferenceError em runtime
# 'ReactUseSyncExternalStore is not defined' (linha ~133, chamada de
# useSyncExternalStoreCompat). Causa: so existe um 'declare const
# ReactUseSyncExternalStore: ...' (apenas tipo, sem valor em runtime) e ninguem
# importa useSyncExternalStore do react. Injetamos import nomeado real do react
# e reatribuimos o const para o binding runtime. Depois rodamos o oraculo
# vitest gravando em arquivo e imprimimos o resumo filtrado.
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

# ---- 1) ler ----
raw = rd(P).decode("utf-8", errors="replace")
print("[alerts] bytes:", len(raw.encode("utf-8")))

# ---- 2) ja importa useSyncExternalStore do react? ----
has_import = bool(re.search(r"import\s*\{[^}]*useSyncExternalStore[^}]*\}\s*from\s*['\"]react['\"]", raw))
print("[alerts] import useSyncExternalStore:", has_import)

# ---- 3) injetar import nomeado real do react se faltar ----
if not has_import:
    if "from \"react\"" in raw:
        # tem import React default: adiciona alias nomeado na mesma linha
        raw2 = raw.replace(
            'import React from "react";',
            'import React, { useSyncExternalStore as ReactUseSyncExternalStoreBinding } from "react";',
        )
        if raw2 == raw:
            raw2 = raw.replace(
                "from 'react'",
                "from 'react';\nimport { useSyncExternalStore as ReactUseSyncExternalStoreBinding } from 'react';",
            )
        raw = raw2
        print("[fix] import nomeado adicionado a import React existente")
    else:
        # sem import react: adiciona no topo
        intro = 'import { useSyncExternalStore as ReactUseSyncExternalStoreBinding } from "react";\n'
        head = ""
        # coloca depois do ultimo import existente se houver
        m = re.search(r"^import[^\n]*\n(?=import|export|\w|/\*|//|$)", raw, re.M)
        if m:
            ins = m.end()
            raw = raw[:ins] + intro + raw[ins:]
        else:
            raw = intro + raw
        print("[fix] import uso nomeado adicionado no topo")

# ---- 4) reatribuir o declare-const fake para o binding real ----
# Alvo exato: 'declare const ReactUseSyncExternalStore: (...) => AlertsState;'
pat = re.compile(
    r"declare\s+const\s+ReactUseSyncExternalStore\s*:\s*"
    r"\([^)]*\)[^;]*AlertsState\s*;",
    re.S,
)
n = len(pat.findall(raw))
raw = pat.sub(
    "const ReactUseSyncExternalStore = ReactUseSyncExternalStoreBinding\n"
    "  ? ReactUseSyncExternalStoreBinding\n"
    "  : ((createServerSnapshot, getServerSnapshot, subscribe) =>\n"
    "      getServerSnapshot()) as unknown as typeof useSyncExternalStore;",
    raw,
    count=1,
)
raw = raw.replace(
    "const ReactUseSyncExternalStore = ReactUseSyncExternalStore as typeof useSyncExternalStore",
    "const ReactUseSyncExternalStoreBinding = ReactUseSyncExternalStoreBinding",
)
print("[fix] declare-const falsa -> binding runtime real (substituicoes:", n, ")")

# ---- 5) verificar se restam usos sem valor ----
rem = re.search(r"ReactUseSyncExternalStore\s*=?\s*$", raw, re.M)
print("[alerts] refs restantes a 'ReactUseSyncExternalStore':",
      len(re.findall(r"ReactUseSyncExternalStore", raw)))

# ---- 6) gravar ----
wr(P, raw.encode("utf-8"))
print("[write] alerts.ts atualizado")

# ---- 7) oraculo byte-safe em arquivo ----
env = dict(os.environ)
env["FORCE_COLOR"] = "0"
env["CI"] = "1"
vit = os.path.join(BASE, "node_modules", ".bin", "vitest.cmd")
try:
    with open(OUTF, "wb") as f:
        r = subprocess.run(
            ["cmd", "/c", vit, "run", "src/test/alerts.test.tsx",
             "--reporter=basic", "--no-coverage"],
            cwd=BASE, stdout=f, stderr=subprocess.STDOUT, env=env, timeout=280_000,
        )
    print("[oracle] exit:", r.returncode)
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT 280s")

rawO = rd(OUTF).decode("utf-8", errors="replace")
print("=" * 58)
for l in rawO.splitlines():
    a = asc(l)
    if re.search(
        r"(Test Files|Tests |passed|failed|PASS|FAIL|alerts\.test|alerts\.tsx|"
        r"Cannot read|Syntax Error|ReferenceError|ReactUseSyncExternalStore|"
        r"RadioPlayer\.tsx:\d+|Home\.tsx:\d+|4\.1|4\.2|4\.2b|3\.1)",
        a,
    ):
        print(a[:170])
