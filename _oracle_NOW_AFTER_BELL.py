# -*- coding: utf-8 -*-
# Oracle vitest byte-safe p/ o ESTADO ATUAL (apos add Bell no Home).
# So imprime as linhas-relevantes, VERIFOCA na FONTE q o Home tem 'Bell'.
import os, re, subprocess, time

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
OUT = os.path.join(BASE, "_oracle_alerts_NOW.out")
H = os.path.join(BASE, "src", "pages", "Home.tsx")

def rd_(p_):
    with open(p_, "rb") as f:
        return f.read()
def wr_(p_, b_):
    with open(p_, "wb") as f:
        f.write(b_)
def asc_(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

h = rd_(H).decode("utf-8", errors="replace")
lines = h.splitlines()
print("[Home] linhas totais:", len(lines))
print("[Home] 'Bell' import ocorrencias:", h.count("Bell"))
# caixa: uso de <HomeAlertCenter> como if
for i, l in enumerate(lines):
    if "HomeAlertCenter" in l or "player-alert" in l or "player-breaking" in l \
       or "useAlerts(" in l or "player-alert-mute" in l:
        print("%5d| %s" % (i + 1, asc_(l)[:150]))

env = dict(os.environ); env["FORCE_COLOR"] = "0"; env["CI"] = "1"
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

rawO = rd_(OUT).decode("utf-8", errors="replace")
print("=" * 60)
for l in rawO.splitlines():
    a = asc_(l)
    if re.search(r"(Test Files|Tests |PASS|FAIL|passed|failed|ReferenceError"
                 r"|nullapsed|Bell is|Element type|got: undefined|Cannot read"
                 r"|Unable to find|Expression expected|alerts.test|✓|×)", a):
        print(a[:172])
