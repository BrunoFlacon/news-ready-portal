# -*- coding: utf-8 -*-
# FIX FINAL DETERMINISTICO (byte-safe):
# 1) Home.tsx: fecha <RadioHero ... bannerRef={bannerRef})> com `/>` (self-closed)
#    e coloca <HomeAlertCenter /> como IRMAO (nao filho aberto). Isso restaura
#    o JSX balanceado (o error era "Expression expected" em Home.tsx:1246/1248).
# 2) alerts.ts: remove bloco 'declare const ReactUseSyncExternalStore: (...) =>
#    AlertsState;' (era Declaration-only; em runtime o import nomeado linha 1
#    ja traz useSyncExternalStore corretamente).
# 3) Oracle vitest byte-safe em arquivo + leitura ascii-estrita.
import os, re, subprocess

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
H = os.path.join(BASE, "src", "pages", "Home.tsx")
A = os.path.join(BASE, "src", "lib", "alerts.ts")
OUT = os.path.join(BASE, "_oracle_alerts_FASE_E_FINAL.out")

def rd(p_):
    with open(p_, "rb") as f:
        return f.read()
def wr(p_, b_):
    with open(p_, "wb") as f:
        f.write(b_)
def asc(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

def asc_fixed(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

# ---------- 1) Home.tsx ----------
h_raw = rd(H).decode("utf-8", errors="replace")
lines_h = h_raw.splitlines()

# mostra regiao 1237..1260 novamente (byte-safe) antes do fix
print("=" * 56)
print("[fix Home] regiao 1237..1260 (estado pre-fix):")
for i in range(1236, min(1260, len(lines_h))):
    print("%5d| %s" % (i + 1, asc(lines_h[i])[:130]))

# bloco BAD: bannerRef + '>' + HomeAlertCenter (filho aberto)  ->  GOOD self-closed
BAD = "bannerRef={bannerRef}\n      >\n      <HomeAlertCenter />"
GOOD = "bannerRef={bannerRef}\n      />\n      <HomeAlertCenter />"
n_bad = h_raw.count(BAD)
print("[fix] bloco BAD(bannerRef+'>'+HomeAlertCenter) encontrado:", n_bad)
if n_bad >= 1:
    h_raw = h_raw.replace(BAD, GOOD, 1)
    wr(H, h_raw.encode("utf-8"))
    print("[fix] aplicado: RadioHero self-closed, HomeAlertCenter = irmao")
else:
    print("[fix] bloco BAD nao presente (talvez ja corrigido ou outro formato)")

# ---------- 2) alerts.ts ----------
a_raw = rd(A).decode("utf-8", errors="replace")
pat = re.compile(
    r"declare\s+const\s+ReactUseSyncExternalStore:[\s\S]*?AlertsState\s*;"
)
m = pat.search(a_raw)
print("[fix alerts] bloco declare-const encontrado:", bool(m))
if m:
    a_raw = a_raw[: m.start()] + a_raw[m.end():]
    wr(A, a_raw.encode("utf-8"))
    print("[fix alerts] declare-const removido")

# ---------- 3) oracle ----------
env = dict(os.environ)
env["FORCE_COLOR"] = "0"
env["CI"] = "1"
vit = os.path.join(BASE, "node_modules", ".bin", "vitest.cmd")
try:
    with open(OUT, "wb") as f:
        r = subprocess.run(
            ["cmd", "/c", vit, "run", "src/test/alerts.test.tsx",
             "--reporter=basic", "--no-coverage"],
            cwd=BASE, stdout=f, stderr=subprocess.STDOUT,
            env=env, timeout=280_000,
        )
    print("[oracle] exit:", r.returncode)
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT 280s")

raw = open(OUT, "rb").read().decode("utf-8", errors="replace")
print("=" * 56)
for l in raw.splitlines():
    a = "".join(c if 32 <= ord(c) < 127 else "?" for c in l)
    if re.search(
        r"(Test Files|Tests |passed|failed|PASS|FAIL|alerts\.test\.tsx"
        r"|alerts\.ts:\d+|RadioPlayer\.tsx:\d+|Home\.tsx:\d+|Cannot read|"
        r"Expression expected|ReferenceError|Syntax Error|Element type|undefined)",
        a,
    ):
        print(a[:170])
