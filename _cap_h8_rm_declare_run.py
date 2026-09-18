# -*- coding: utf-8 -*-
# FINAL: alerts.ts tem import runtime real na linha 1
# (useSyncExternalStore as ReactUseSyncExternalStore) E um bloco morto
# 'declare const ReactUseSyncExternalStore: (subscribe, getSnapshot,
# getServerSnapshot) => AlertsState;' (linhas ~137-141) que (a) colide com o
# import no tipo e (b) nao emite valor -> ReferenceError em runtime. Apago o
# bloco (byte-safe) e rodo o oraculo vitest byte-safe em arquivo.
import os, re, subprocess

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
P = os.path.join(BASE, "src", "lib", "alerts.ts")
OUT = os.path.join(BASE, "_oracle_alerts_FINAL_H.out")

def rd(p_):
    with open(p_, "rb") as f:
        return f.read()
def wr(p_, b_):
    with open(p_, "wb") as f:
        f.write(b_)
def asc(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

raw = rd(P).decode("utf-8", errors="replace")

# bloco declare (137-141) com whitespace flexivel
pat = re.compile(
    r"declare\s+const\s+ReactUseSyncExternalStore\s*:\s*"          #  primeiro
    r"\(\s*subscribe\s*:\s*\(cb\s*:\s*\(\)\s*=>\s*void\s*\)\s*=>\s*\(\)\s*=>\s*void,\s*"
    r"getSnapshot\s*:\s*\(\)\s*=>\s*AlertsState,\s*"
    r"getServerSnapshot\s*:\s*\(\)\s*=>\s*AlertsState,\s*"
    r"\)\s*=>\s*AlertsState\s*;\s*",
    re.DOTALL,
)
m = pat.search(raw)
print("[alerts] bloco declare-const (137..141) encontrado:", bool(m))
if m:
    raw = raw[: m.start()] + raw[m.end():]
    wr(P, raw.encode("utf-8"))
    print("[alerts] bloco removido | restante ocorrencias 'declare const ReactUseSyncExternalStore':",
          len(re.findall(r"declare const ReactUseSyncExternalStore", raw)))
    print("[alerts] chamadas runtime 'ReactUseSyncExternalStore(' restantes:",
          len(re.findall(r"ReactUseSyncExternalStore\(", raw)))
else:
    print("[alerts] bloco ja ausente; chamadas runtime:",
          len(re.findall(r"ReactUseSyncExternalStore\(", raw)))

# ---------- oracle ----------
env = dict(os.environ)
env["FORCE_COLOR"] = "0"
env["CI"] = "1"
vit = os.path.join(BASE, "node_modules", ".bin", "vitest.cmd")
try:
    with open(OUT, "wb") as f:
        r = subprocess.run(["cmd", "/c", vit, "run", "src/test/alerts.test.tsx",
                            "--reporter=basic", "--no-coverage"],
                           cwd=BASE, stdout=f, stderr=subprocess.STDOUT,
                           env=env, timeout=280_000)
    print("[oracle] exit:", r.returncode)
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT 280s")

rawO = rd(OUT).decode("utf-8", errors="replace")
print("=" * 60)
for l in rawO.splitlines():
    a = asc(l)
    if re.search(r"(Test Files|Tests |passed|failed|PASS|FAIL|alerts\.test"
                 r"|ReferenceError|Cannot read|Syntax Error|Expression expected"
                 r"|RadioPlayer\.tsx:\d+|Home\.tsx:\d+|alerts\.ts:\d+|passed)", a):
        print(a[:172])
