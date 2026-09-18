# -*- coding: utf-8 -*-
# alerts.ts: remove o bloco 'declare const ReactUseSyncExternalStore: (...) =>
# AlertsState;' (linhas 137-141) que colide com o import nomeado real da linha
# 1 (useSyncExternalStore as ReactUseSyncExternalStore) e nao emite runtime.
# Roda o oraculo vitest byte-safe a seguir.
import os, re, subprocess

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
P = os.path.join(BASE, "src", "lib", "alerts.ts")
OUTF = os.path.join(BASE, "_oracle_alerts_G8.out")

def rd(p_):
    with open(p_, "rb") as f:
        return f.read()

def wr(p_, b_):
    with open(p_, "wb") as f:
        f.write(b_)

def asc(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

raw = rd(P).decode("utf-8", errors="replace")
m = re.search(
    r"declare const ReactUseSyncExternalStore:[\s\S]*?AlertsState\s*;",
    raw,
)
print("[scan] bloco declare encontrado:", bool(m))
if m:
    seg = m.group(0)
    # imprime o que sera removido (ascii-safe, primeiro caractere por linha)
    print("[remove] bloco %d bytes:\n%s" % (len(seg), asc(seg)[:220]))
    raw = raw[: m.start()] + raw[m.end():]
    wr(P, raw.encode("utf-8"))
    print("[fix] declare const removido | bytes:", len(raw.encode("utf-8")))
else:
    print("[skip] bloco ja ausente")

# confirma que so existe a chamada e o import
print("[check] import linha 1:", asc(raw.splitlines()[0])[:100])
print("[check] chamadas ReactUseSyncExternalStore(:",
      len(re.findall(r"ReactUseSyncExternalStore\s*\(", raw)))

# ---- oraculo byte-safe ---- 
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
    if re.search(r"(Test Files|Tests |passed|failed|PASS|FAIL|alerts\.test"
                 r"|ReferenceError|Cannot read|Syntax Error|Expression expected"
                 r"|ReactUseSyncExternalStore|Home\.tsx:\d+|RadioPlayer\.tsx:\d+)", a):
        print(a[:160])
