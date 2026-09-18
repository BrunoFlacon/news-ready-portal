# -*- coding: utf-8 -*-
# alerts.ts: remove o bloco 137-141 ('declare const ReactUseSyncExternalStore:
# (subscribe, getSnapshot, getServerSnapshot) => AlertsState;') porque a linha 1
# ja importa o runtime real via 'useSyncExternalStore as ReactUseSyncExternalStore'
# do react; a redeclaracao local derruba o binding. Depois roda o oraculo.
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

# imprime apenas o bloco 135-143 antes do fix
L = raw.splitlines()
print("[antes] 135..143")
for i in range(134, min(143, len(L))):
    print("%5d| %s" % (i + 1, asc(L[i])[:150]))

# remover o declare const (padrao multi-linha, delimitado por ';')
pat = re.compile(
    r"declare\s+const\s+ReactUseSyncExternalStore\s*:\s*\("
    r"[^)]*\)\s*=>\s*AlertsState\s*;",
    re.S,
)
m = pat.search(raw)
print("[scan] declare const ReactUseSyncExternalStore:", bool(m))
if m:
    raw = raw[: m.start()] + raw[m.end():]
    print("[fix] bloco declare removido (bytes %d..%d)" % (m.start(), m.end()))
else:
    print("[fix] bloco ja ausente")

# remover linhas em branco duplicadas no ponto (cosmetico)
raw = re.sub(r"\n\s*\n\s*\n", "\n\n", raw)

wr(P, raw.encode("utf-8"))
print("[write] alerts.ts ok | bytes:", len(raw.encode("utf-8")))

# ---- oracle byte-safe com cmd /c + vitest.cmd absoluto + stdout->arquivo ----
env = dict(os.environ)
env["FORCE_COLOR"] = "0"
env["CI"] = "1"
vit = os.path.join(BASE, "node_modules", ".bin", "vitest.cmd")
try:
    with open(OUTF, "wb") as f:
        r = subprocess.run(
            ["cmd", "/c", vit, "run", "src/test/alerts.test.tsx",
             "--reporter=basic", "--no-coverage"],
            cwd=BASE, stdout=f, stderr=subprocess.STDOUT, env=env,
            timeout=280_000)
    print("[oracle] exit:", r.returncode)
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT")

rawO = rd(OUTF).decode("utf-8", errors="replace")
print("=" * 62)
for l in rawO.splitlines():
    a = asc(l)
    if re.search(r"(Test Files|Tests |passed|failed|PASS|FAIL|alerts\.test"
                 r"|ReactUseSyncExternalStore|alerts\.ts:\d+|ReferenceError"
                 r"|Syntax Error|cannot find|Cannot read)", a):
        print(a[:175])
