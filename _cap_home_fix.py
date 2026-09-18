# -*- coding: utf-8 -*-
# Fix Home.tsx: fecha a tag de abertura do RadioHero (injeta ">") antes do
# <HomeAlertCenter /> que foi injetado como filho, e depois roda o oraculo vitest.
import subprocess, os, re

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
HOME = os.path.join(BASE, "src", "pages", "Home.tsx")

def rd_bytes(p):
    with open(p, "rb") as f:
        return f.read()

def wr_bytes(p, b):
    with open(p, "wb") as f:
        f.write(b)

raw = rd_bytes(HOME)
txt = raw.decode("utf-8", errors="replace")

# sequencia atual (errada): bannerRef + HomeAlertCenter direto (tag pai sem fechar)
BAD = "bannerRef={bannerRef}\n      <HomeAlertCenter />\n"
GOOD = "bannerRef={bannerRef}\n      >\n      <HomeAlertCenter />\n"

n = txt.count(BAD)
print("[home] sequencia problematica encontrada:", n, "x")

if n >= 1:
    txt = txt.replace(BAD, GOOD)
    wr_bytes(HOME, txt.encode("utf-8"))
    print("[home] fix aplicado: '>' injetado apos bannerRef (tag pai fechada)")

# impressao do trecho afetado
L = txt.splitlines()
print("[home] contexto 124 resisted0-1252:")
for i in range(1239, min(len(L), 1253)):
    print("%5d| %s" % (i + 1, L[i].replace("\t", "    "))[:118])

# contagem testids recente
for tid in ["home-alert-bell", "home-alert-badge", "home-alert-toast", "home-breaking-ticker", "home-alert-player"]:
    print("[home] data-testid %s: %d" % (tid, txt.count('data-testid="' + tid + '"')))

# oraculo vitest -> arquivo
outf = os.path.join(BASE, "_oracle_alerts_GREEN2.out")
env = dict(os.environ)
env["FORCE_COLOR"] = "0"
cmd = ["cmd", "/c", os.path.join(BASE, "node_modules", ".bin", "vitest.cmd"),
       "run", "src/test/alerts.test.tsx", "--reporter=basic", "--no-coverage"]
try:
    with open(outf, "wb") as f:
        r = subprocess.run(cmd, cwd=BASE, stdout=f, stderr=subprocess.STDOUT, env=env, timeout=280_000)
    print("[oracle] exit:", r.returncode)
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT 280s")

oraw = rd_bytes(outf).decode("utf-8", errors="replace")
print("=" * 62)
for l in oraw.splitlines():
    al = l.encode("ascii", errors="replace").decode("ascii")
    if re.search(r"(Test Files|Tests |passed|failed|PASS|FAIL|alerts\.tsx|Cannot read|Syntax Error|Home\.tsx:\d+|RadioPlayer\.tsx:\d+)", al):
        print(al[:175])
