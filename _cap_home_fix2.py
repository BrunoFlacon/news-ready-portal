# -*- coding: utf-8 -*-
# RadioHero original era SELF-CLOSED (/>). Ajustamos: '>' -> '/>' e HomeAlertCenter
# vira IRMAO (nao filho), restaurando o layout original. Depois roda o oraculo.
import subprocess, os, re

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
HOME = os.path.join(BASE, "src", "pages", "Home.tsx")

def rd(p):
    with open(p, "rb") as f:
        return f.read()

def wr(p, b):
    with open(p, "wb") as f:
        f.write(b)

def ascii_print(s):
    for ch in s:
        if 32 <= ord(ch) < 127 or ch == "\n":
            pass
    out = "".join(ch if (32 <= ord(ch) < 127 or ch in "\n\t") else "?" for ch in s)
    print(out)

txt = rd(HOME).decode("utf-8", errors="replace")

# substituicao-alvo: '>' que adicionamos na linha 1246 -> '/' para fechar RadioHero self-closed
BAD = "        bannerRef={bannerRef}\n      >\n      <HomeAlertCenter />\n"
GOOD = "        bannerRef={bannerRef}\n      />\n      <HomeAlertCenter />\n"

n = txt.count(BAD)
print("[patch] sequencia -alvo encontrada:", n, "x")
if n >= 1:
    txt = txt.replace(BAD, GOOD)
    wr(HOME, txt.encode("utf-8"))
    print("[patch] > -> /> aplicado (RadioHero self-closed restaurado; HomeAlertCenter = irmao)")
else:
    # tenta forma com indentacao alternativa (4 espacos)
    BAD2 = "      bannerRef={bannerRef}\n      >\n      <HomeAlertCenter />\n"
    n2 = txt.count(BAD2)
    print("[patch] variante 4esp:", n2, "x")
    if n2 >= 1:
        GOOD2 = "      bannerRef={bannerRef}\n      />\n      <HomeAlertCenter />\n"
        txt = txt.replace(BAD2, GOOD2)
        wr(HOME, txt.encode("utf-8"))
        print("[patch] > -> /> aplicado (variante 4esp)")

# confirma: nao pode haver RadioHero aberto sem fechamento (sem </RadioHero>)
after = rd(HOME).decode("utf-8", errors="replace")
print("[check] ocorrencias '<RadioHero':", after.count("<RadioHero"))
print("[check] ocorrencias '</RadioHero>':", after.count("</RadioHero>"))
print("[check] nosso '      />' apos bannerRef:", after.count("        bannerRef={bannerRef}\n      />"))

# oraculo vitest byte-safe -> saida gravada + leitura filtrada
outf = os.path.join(BASE, "_oracle_alerts_finalF.out")
env = dict(os.environ)
env["FORCE_COLOR"] = "0"
cmd = ["node_modules/.bin/vitest.cmd", "run", "src/test/alerts.test.tsx",
       "--reporter=basic", "--no-coverage", "--no-color"]
try:
    with open(outf, "wb") as f:
        r = subprocess.run(cmd, cwd=BASE, stdout=f, stderr=subprocess.STDOUT,
                           env=env, shell=True, timeout=280_000)
    print("[oracle] exit:", r.returncode)
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT 280s")

raw = rd(outf).decode("utf-8", errors="replace")
print("=" * 62)
for l in raw.splitlines():
    al = "".join(c if (32 <= ord(c) < 127) else "?" for c in l)
    if re.search(r"(Test Files|Tests |passed|failed|PASS|FAIL|alerts\.test|RadioPlayer\.tsx:\d+|Home\.tsx:\d+|Cannot read|Syntax Error|Expression expected|no tests|\u2713|\u2717)", al):
        print(al[:170])
