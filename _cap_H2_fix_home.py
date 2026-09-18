# -*- coding: utf-8 -*-
# fix determinista Home.tsx: 1245-1247 -> RadioHero self-closed + HomeAlertCenter irmao
# byte-safe (l� bytes, escreve bytes, sem shell); depois oraculo vitest alerts
# gravando stdout em arquivo, e imprime apenas linhas de veredito (ascii-filtro).
import os, re, subprocess

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
P = os.path.join(BASE, "src", "pages", "Home.tsx")
OUT = os.path.join(BASE, "_oracle_alerts_H2.out")

def rd(p_):
    with open(p_, "rb") as f:
        return f.read()
def wr(p_, b_):
    with open(p_, "wb") as f:
        f.write(b_)
def asc(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

raw = rd(P).decode("utf-8", errors="replace")

BAD = "        bannerRef={bannerRef}\n      >\n      <HomeAlertCenter />\n"
GOOD = "        bannerRef={bannerRef}\n      />\n      <HomeAlertCenter />\n"
n = raw.count(BAD)
print("[home] sequencia BAD encontrada:", n)
if n >= 1:
    raw = raw.replace(BAD, GOOD, 1)
    wr(P, raw.encode("utf-8"))
    print("[home] fix aplicado: RadioHero self-closed; HomeAlertCenter = irmao")
else:
    print("[home] ja corrigido ou padrao diferente; checar")

# impressao byte-safe do trecho
L = raw.splitlines()
print("=" * 56)
for i in range(1235, min(1255, len(L))):
    print("%5d| %s" % (i + 1, asc(L[i])[:140]))

# oraculo
env = dict(os.environ)
env["FORCE_COLOR"] = "0"
env["CI"] = "1"
vit = os.path.join(BASE, "node_modules", ".bin", "vitest.cmd")
try:
    with open(OUT, "wb") as f:
        r = subprocess.run(
            ["cmd", "/c", vit, "run", "src/test/alerts.test.tsx",
             "--reporter=basic", "--no-coverage"],
            cwd=BASE, stdout=f, stderr=subprocess.STDOUT, env=env,
            timeout=280_000)
    print("[oracle] exit:", r.returncode)
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT 280s")

rawO = rd(OUT).decode("utf-8", errors="replace")
print("=" * 56 + "\n[oracle] resumo:")
for l in rawO.splitlines():
    a = asc(l)
    if re.search(r"(Test Files|Tests |passed|failed|PASS|FAIL|alerts\.test|"
                 r"Home\.tsx:\d+|RadioPlayer\.tsx:\d+|ReferenceError|"
                 r"Cannot read|Syntax Error|Expression expected|undefined)", a):
        print(a[:175])
