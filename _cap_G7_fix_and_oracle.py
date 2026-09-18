# -*- coding: utf-8 -*-
# alerts.ts: remove bloco 'declare const ReactUseSyncExternalStore: (...)=>AlertsState;'
# (137-141) - conflita com o import runtime real da linha 1 e emite nada em
# runtime (declaracoes ambient abandonadas). Depois roda o oraculo byte-safe.
import os, re, subprocess

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
P = os.path.join(BASE, "src", "lib", "alerts.ts")
OUTF = os.path.join(BASE, "_oracle_alerts_G7.out")

def rd(p_):
    with open(p_, "rb") as f:
        return f.read()

def wr(p_, b_):
    with open(p_, "wb") as f:
        f.write(b_)

def asc(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

raw = rd(P).decode("utf-8", errors="replace")

# 1) remover o declare const (bloco de tipo morto)
pat = re.compile(
    r"declare\s+const\s+ReactUseSyncExternalStore\s*:"
    r"\s*\(\s*subscribe\s*:\s*\(cb\s*:\s*\(\)\s*=>\s*void\)\s*=>\s*\(\)\s*=>\s*void,"
    r"\s*getSnapshot\s*:\s*\(\)\s*=>\s*AlertsState,"
    r"\s*getServerSnapshot\s*:\s*\(\)\s*=>\s*AlertsState,"
    r"\s*\)\s*=>\s*AlertsState\s*;",
    re.S,
)
m = pat.search(raw)
print("[scan] declare const morto encontrado:", bool(m))
n_removed = 0
if m:
    raw = raw[: m.start()] + raw[m.end():]
    n_removed = 1

# 2) limpar o commentario 'a MESMA sigla' caso deixe linha vazia dupla
raw = re.sub(r"\n{3,}", "\n\n", raw)

wr(P, raw.encode("utf-8"))
print("[write] alerts.ts ok | declare removido:", n_removed,
      "| bytes:", len(raw.encode("utf-8")))

# 3) confirmacao runtime do binding
print("[check] import linha1:", re.match(
    r"import\s*\{([^}]*)\}\s*from\s*['\"]react['\"]", raw).group(1)[:90] if re.match(
    r"import\s*\{([^}]*)\}\s*from\s*['\"]react['\"]", raw) else "NAO")

# 4) oraculo byte-safe -> arquivo
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
                 r"|ReferenceError|Cannot read|Syntax Error|expected|"
                 r"RadioPlayer\.tsx:\d+|Home\.tsx:\d+|alerts\.ts:\d+)", a):
        print(a[:175])
