# -*- coding: utf-8 -*-
# Diagnostico byte-safe definitivo:
#  (1) detectar bytes nao-ascii em Home.tsx / RadioPlayer.tsx / alerts.ts
#      (o swc transforma UTF-8 estranho em identificador vitiado 'nullapsed').
#  (2) mapear uso <X ...> vs definicao (function X/const X/export X) para
#      HomeAlertCenter, HomeAlertBell, HomeAlertToast, HomeBreaking*, RadioPlayer,
#      RadioAlertShell e afins.
#  (3) via subprocess-file: rodar vitest e imprimir referencias a nullapsed
#      + contexto, para saber QUAL arquivo originou o binding quebrado.
import os, re, subprocess, sys

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
OUT_ORACLE = os.path.join(BASE, "_cap_nullapsed_oracle.out")
OUT_RAW = os.path.join(BASE, "_cap_nullapsed_source.out")

def rd(p_):
    f = open(p_, "rb"); b = f.read(); f.close(); return b
def wr(p_, b_):
    f = open(p_, "wb"); f.write(b_); f.close()
def asc(s_):
    return "".join(c if 32 <= ord(c) < 127 else ("<HX%s>" % hex(ord(c)).lstrip("0x")) if ord(c) > 127 else "?" for c in s_)

FILES = [
    ("Home.tsx", "src/pages/Home.tsx"),
    ("RadioPlayer.tsx", "src/components/RadioPlayer.tsx"),
    ("alerts.ts", "src/lib/alerts.ts"),
]

# ---- (1) bytes estranhos ----
for name, rel in FILES:
    raw = rd(os.path.join(BASE, rel.replace("/", os.sep))).decode("utf-8", errors="replace")
    L = raw.splitlines()
    bad = 0
    print("=" * 60)
    print("[%s] bytes nao-ascii (linhas)" % name)
    for i, ln in enumerate(L):
        # bytes > 127 que NAO sao de comentario? detecta qualquer um, mostra hex
        h = [hex(ord(c)) for c in ln if ord(c) > 127]
        if h:
            bad += 1
            a = asc(ln)
            print("  %5d| %s   << %s" % (i + 1, a[:100], ",".join(h[:5])))
    print("[%s] total linhas com bytes>127: %d" % (name, bad))

# ---- (2) uso vs def ----
comps = ["HomeAlertCenter", "HomeAlertBell", "HomeAlertToast", "HomeAlertPlayer",
         "HomeBreakingTicker", "HomeBreakingTickerBar", "RadioAlertShell",
         "RadioPlayer", "RadioHero", "RadioAlertMute", "BreakingTicker",
         "HomeAlertBadge", "HomeBreakingBadge"]

for name, rel in FILES:
    raw = rd(os.path.join(BASE, rel.replace("/", os.sep))).decode("utf-8", errors="replace")
    print("=" * 60)
    print("[%s] componentes: def vs uso" % name)
    for c in comps:
        # definicao: 'function C('  ou  'const C ='  ou  'export function C('
        ndef = len(re.findall(r"function\s+%s\s*\(" % c, raw)) + \
               len(re.findall(r"(?:const|let)\s+%s\s*=" % c, raw))
        # uso: '<C '  ou  '<C/'  ou  'C(' (chamada)
        nuse = len(re.findall(r"<%s[\s/>]" % c, raw)) + len(re.findall(r"\b%s\s*\(" % c, raw))
        print("    %-22s def=%-2d uso=%-3d" % (c, ndef, nuse))

    # curto dump da regiao do RadioPlayer return (450..560) para ver a estrutura
    L = raw.splitlines()
    print("-- %s dump 462..540 --" % name)
    for i in range(461, min(540, len(L))):
        print("%5d| %s" % (i + 1, asc(L[i])[:110]))

# ---- (3) oraculo vitest, stdout em arquivo ----
exe = os.path.join(BASE, "node_modules", ".bin", "vitest.cmd")
env = dict(os.environ); env["FORCE_COLOR"] = "0"; env["CI"] = "1"
try:
    f = open(OUT_ORACLE, "wb")
    r = subprocess.run(["cmd", "/c", exe, "run", "src/test/alerts.test.tsx",
                        "--reporter=basic", "--no-coverage"],
                       cwd=BASE, stdout=f, stderr=subprocess.STDOUT, env=env,
                       timeout=280_000)
    f.close()
    print("[oracle] exit:", r.returncode)
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT")

raw = rd(OUT_ORACLE).decode("utf-8", errors="replace")
print("=" * 60)
print("[oracle] refs a 'nullapsed' e contexto:")
for i, l in enumerate(raw.splitlines()):
    a = asc(l)
    if "nullapsed" in a or re.search(r"(FAIL|PASS|Tests |Tests |passed|failed|"
                                     r"alerts\.test|Cannot read|Element type|"
                                     r"ReferenceError|ReactUseSync|Syntax)", a):
        print(a[:170])
