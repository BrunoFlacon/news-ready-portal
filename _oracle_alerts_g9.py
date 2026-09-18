# -*- coding: utf-8 -*-
# Minimal ASCII oracle: remove declare-const orfao de alerts.ts e roda vitest
# gravando stdout em arquivo (byte-safe), depois filtra linhas-chave.
import os, re, subprocess

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
P = os.path.join(BASE, "src", "lib", "alerts.ts")
OUT = os.path.join(BASE, "_oracle_alerts_G9.out")

def rd(x):
    f = open(x, "rb"); b = f.read(); f.close(); return b
def wr(x, b):
    f = open(x, "wb"); f.write(b); f.close()

raw = rd(P).decode("utf-8", "replace")

# bloco 'declare const ReactUseSyncExternalStore: (...) => AlertsState;'
pat = re.compile(
    r"declare const ReactUseSyncExternalStore:\s*\([^)]*\)\s*=>\s*AlertsState\s*;",
    re.S,
)
m = pat.search(raw)
if m:
    raw = raw[: m.start()] + raw[m.end():]
    wr(P, raw.encode("utf-8"))
    print("[fix] declare-const removido | bytes:", len(raw.encode("utf-8")))
else:
    print("[fix] declare-const nao achado (ja ok)")

# oracle
env = dict(os.environ); env["FORCE_COLOR"] = "0"
vit = os.path.join(BASE, "node_modules", ".bin", "vitest.cmd")
try:
    f = open(OUT, "wb")
    r = subprocess.run(
        ["cmd", "/c", vit, "run", "src/test/alerts.test.tsx",
         "--reporter=basic", "--no-coverage"],
        cwd=BASE, stdout=f, stderr=subprocess.STDOUT, env=env, timeout=280_000,
    )
    f.close()
    print("[oracle] exit:", r.returncode)
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT 280s")

raw2 = rd(OUT).decode("utf-8", "replace")
print("=" * 58)
for l in raw2.splitlines():
    a = "".join(c if 32 <= ord(c) < 127 else "?" for c in l)
    if re.search(r"(Test Files|Tests |PASS|FAIL|passed|failed|alerts\.test"
                 r"|ReferenceError|ReactUseSync|alerts\.ts:\d+|Cannot read"
                 r"|Syntax|RadioPlayer\.tsx:\d+|Home\.tsx:\d+)", a):
        print(a[:170])
