# -*- coding: utf-8 -*-
# ASC-ONLY FIX (byte-safe): alerts.ts chama ReactUseSyncExternalStore(...) em
# runtime porem so existe um 'declare const ReactUseSyncExternalStore: (sig) =>
# AlertsState;' => emitido como NADA (tipos sao apagados) => ReferenceError em
# runtime (vitest/jsdom). Fix: import nomeado real useSyncExternalStore do react
# jah aliasing esse nome, e remover o declare-const orfao. Depois roda o oracle.
import os, re, subprocess

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
P = os.path.join(BASE, "src", "lib", "alerts.ts")
OUT = os.path.join(BASE, "_oracle_g6.out")

def rd(p_):
    with open(p_, "rb") as f:
        return f.read()

def wr(p_, b_):
    with open(p_, "wb") as f:
        f.write(b_)

def asc(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

# -- le ------------------------------------------------------------------
raw = rd(P).decode("utf-8", errors="replace")
print("[alerts] bytes:", len(raw.encode("utf-8")))
print("[alerts] ocorrencias 'ReactUseSyncExternalStore':",
      len(re.findall(r"ReactUseSyncExternalStore", raw)))

# -- 1) injetar import nomeado do react (se ainda nao houver) -------------
has_import = bool(re.search(
    r"import[^;]*\buseSyncExternalStore\b[^;]*from\s*['\"]react['\"]", raw))
print("[alerts] ja existe import useSyncExternalStore do react:", has_import)

if not has_import:
    # procurar o primeiro 'import ... from "react"' para injetar apos ele;
    # caso contrario injeta no topo do arquivo.
    m = re.search(r"(import[^\n]*from\s*['\"][^'\"\n]+['\"]\s*;?\n)", raw)
    inject = 'import { useSyncExternalStore as ReactUseSyncExternalStore } from "react";\n'
    if m:
        pos = m.end()
        raw = raw[:pos] + inject + raw[pos:]
        print("[fix] import injetado apos linha de import existente @ byte", pos)
    else:
        raw = inject + raw
        print("[fix] import injetado no topo")

# -- 2) remover o declare const orfao --------------------------------------
# Padroes possiveis:
#   declare const ReactUseSyncExternalStore: (a,b,c)=>AlertsState;
#   declare const ReactUseSyncExternalStore : (...sig...) ;
decl_pat = re.compile(
    r"declare\s+const\s+ReactUseSyncExternalStore\s*:"
    r"\s*\([^)]*\)\s*=>\s*AlertsState\s*;",
    re.S,
)
removed = len(decl_pat.findall(raw))
raw = decl_pat.sub("", raw)
print("[fix] declare const removido:", removed, "x")

# -- 3) como solucao redundante/simples: se o nome colidir, forcar vai --
# (se o import nomeado foi adicionado, o declare seria duplicado - ja removido)

# -- 4) garantir que a chamada usa os 3 args certos -------------------------
# (verify only)
argsn = len(re.findall(r"ReactUseSyncExternalStore\s*\(", raw))
print("[alerts] chamadas a ReactUseSyncExternalStore(", argsn, ")")

wr(P, raw.encode("utf-8"))
print("[write] alerts.ts ok")

# -- 5) oracle byte-safe ----------------------------------------------------
env = dict(os.environ)
env["FORCE_COLOR"] = "0"
env["CI"] = "1"
vit = os.path.join(BASE, "node_modules", ".bin", "vitest.cmd")
cmd = ["cmd", "/c", vit, "run", "src/test/alerts.test.tsx",
       "--reporter=basic", "--no-coverage"]
try:
    with open(OUT, "wb") as f:
        r = subprocess.run(cmd, cwd=BASE, stdout=f, stderr=subprocess.STDOUT,
                           env=env, timeout=280_000)
    print("[oracle] exit:", r.returncode)
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT 280s")

rawO = rd(OUT).decode("utf-8", errors="replace")
print("=" * 60)
for l in rawO.splitlines():
    a = asc(l)
    if re.search(r"(Test Files|Tests |passed|failed|PASS|FAIL|alerts\.test|"
                 r"ReferenceError|Cannot read|Syntax Error|Expression expected|"
                 r"RadioPlayer\.tsx:\d+|Home\.tsx:\d+|alerts\.tsx:\d+|alerts\.ts:\d+)", a):
        print(a[:175])
