# -*- coding: utf-8 -*-
# Home.tsx linha ~1269: `useState<"estreia" | "breaking" | null>(nullapsed);`
# <- identificador corrompido que deveria ser `null>` → `nullapsed)`.
# Fix byte-exato: substitui a PRIMEIRA ocorrencia do pivot unico
#   b"nullapsed)" -> b"null)"
# que agora existe em Home.tsx (1 ocorrencia). Nao toca mais nada.
# Depois: oracle vitest gravando em arquivo, imprime so veredito ascii.
import os, re, subprocess, time

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
H = os.path.join(BASE, "src", "pages", "Home.tsx")
OUT = os.path.join(BASE, "_oracle_alerts_GREEN_afternull.out")

def rd(p_):
    with open(p_, "rb") as f:
        return f.read()
def wr(p_, b_):
    with open(p_, "wb") as f:
        f.write(b_)
def asc(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

raw = rd(H).decode("utf-8", errors="replace")
print("[Home.tsx] ocorrencias 'nullapsed':", raw.count("nullapsed"))
print("[Home.tsx] ocorrencias 'nullapsed)':", raw.count("nullapsed)"))
print("[Home.tsx] ocorrencias 'null)':", raw.count("null)"))

n = raw.count("nullapsed)")
if n:
    # substituir apenas a primeira
    i = raw.find("nullapsed)")
    raw2 = raw[:i] + "null)" + raw[i + len("nullapsed)"):]
    wr(H, raw2.encode("utf-8"))
    chk = rd(H).decode("utf-8", errors="replace")
    print("[fix][Home] aplicado. agora 'nullapsed':", chk.count("nullapsed"),
          "| 'nullapsed)':", chk.count("nullapsed)"))
    # contexto da correcao
    lines = chk.splitlines()
    for idx, l in enumerate(lines):
        if "setActiveKind" in l and "useState" in l:
            print("[ctx] %5d| %s" % (idx + 1, asc(l)[:150]))
else:
    print("[fix][Home] nenhum 'nullapsed)' para trocar (arquivo ja c/ 'null)')")

# ---------- oracle ----------
env = dict(os.environ)
env["FORCE_COLOR"] = "0"
env["CI"] = "1"
vit = os.path.join(BASE, "node_modules", ".bin", "vitest.cmd")
t0 = time.time()
try:
    with open(OUT, "wb") as f:
        r = subprocess.run(["cmd", "/c", vit, "run", "src/test/alerts.test.tsx",
                            "--reporter=basic", "--no-coverage"],
                           cwd=BASE, stdout=f, stderr=subprocess.STDOUT,
                           env=env, timeout=290_000)
    print("[oracle] exit:", r.returncode, "| dur %.1fs" % (time.time() - t0))
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT")

rawO = rd(OUT).decode("utf-8", errors="replace")
print("=" * 60)
for l in rawO.splitlines():
    a = asc(l)
    if re.search(r"(^|[^i])(Test Files|Tests |PASS|FAIL|passed|failed"
                 r"|ReferenceError|nullapsed|Element type|Cannot read|Syntax Error"
                 r"|Expression expected|expect\(|Unable to find|Received|✓|×)", a):
        print(a[:170])
