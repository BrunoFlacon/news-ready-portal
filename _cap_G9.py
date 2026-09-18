# -*- coding: utf-8 -*-
# Byte-safe fix + oracle: remove o 'declare const ReactUseSyncExternalStore'
# orfao (que agora conflita/nada gera) em alerts.ts e roda vitest do alerts.
# ASC-ONLY saida, byte-safe leitura/escrita.
import os, re, subprocess

BASE_ABS = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
P = os.path.join(BASE_ABS, "src", "lib", "alerts.ts")
OUT = os.path.join(BASE_ABS, "_oracle_alerts_G9.out")

def rd(p):
    f = open(p, "rb"); b = f.read(); f.close(); return b

def wr(p, b):
    f = open(p, "wb"); f.write(b); f.close()

raw = rd(P).decode("utf-8", errors="replace")

# remove bloco 'declare const ReactUseSyncExternalStore: (...)=>AlertsState;'
pat = re.compile(
    r"declare const ReactUseSyncExternalStore:\s*"
    r"\(\s*subscribe[^;]*?\)\s*=>\s*AlertsState\s*;",
    re.S,
)
m = pat.search(raw)
print("[alerts] find declare:", m is not None)
if m:
    raw = raw[: m.start()] + raw[m.end():]
    wr(P, raw.encode("utf-8"))
    print("[alerts] declare removido; bytes:", len(raw.encode("utf-8")))
else:
    print("[alerts] declare nao encontrado (ok? verificar)")

# oracle byte-safe
env = dict(os.environ); env["FORCE_COLOR"] = "0"; env["CI"] = "1"
vit = os.path.join(BASE_ABS, "node_modules", ".bin", "vitest.cmd")
try:
    f = open(OUT, "wb")
    r = subprocess.run(["cmd", "/c", vit, "run", "src/test/alerts.test.tsx",
                        "--reporter=basic", "--no-coverage"],
                       cwd=BASE_ABS, stdout=f, stderr=subprocess.STDOUT,
                       env=env, timeout=280_000)
    f.close()
    print("[oracle] exit:", r.returncode)
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT 280s")

o = rd(OUT).decode("utf-8", errors="replace")
print("=" * 56)
for l in o.splitlines():
    a = "".join(c if 32 <= ord(c) < 127 else "?" for c in l)
    if re.search(
        r"(Test Files|Tests |passed|failed|PASS|FAIL|alerts\.test"
        r"|ReactUseSync|alerts\.ts:\d+|Error|Cannot read|Syntax|ReferenceError)",
        a):
        print(a[:170])
