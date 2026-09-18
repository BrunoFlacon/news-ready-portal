# -*- coding: utf-8 -*-
# Byte-safe: grepa 'export'/'import' dos componentes suspeitos por TODO src,
# imprime numeros (def/uso) e o trecho do return de RadioPlayer.tsx,
# e grava 3 oraculos vitest (dumps byte-safe por app + suite completa).
import os, glob, re, subprocess

SRC = r"C:\wamp64\www\news-ready-portal\opencode\news-ready-portal\src"
OUTSUITES = r"C:\wamp64\www\news-ready-portal\opencode\news-ready-portal\_cap_suites_alerts_b.out"

def rd(p_):
    with open(p_, "rb") as f:
        return f.read()

def rd_all(sub):
    mapa = {}
    for dp, _, fn in os.walk(os.path.join(SRC, sub)):
        for name in fn:
            if name.endswith((".ts", ".tsx")):
                p_ = os.path.join(dp, name)
                mapa[os.path.relpath(p_, SRC)] = rd(p_).decode("utf-8", errors="replace")
    return mapa

comps = [
    "HomeAlertCenter", "HomeAlertShell", "HomeAlertBell", "HomeAlertBadge",
    "HomeAlertToast", "HomeAlertPlayer", "HomeBreakingTicker",
    "HomeBreakingTickerBar", "RadioAlertShell", "RadioAlertMute",
    "BreakingTicker", "RadioPlayer", "RadioHero", "HomeBreakingBadge",
    "RadioAlertToggle", "HomeAlertToggle",
]

allmap = {}
for sub in ("pages", "components", "lib", "test", "hooks"):
    allmap.update(rd_all(sub))

for c in comps:
    ndef = 0
    nuse = 0
    oc = 0
    for rel, txt in allmap.items():
        df = 0
        for m in re.finditer(r"(?:export\s+(?:default\s+)?)?(?:function\s+|const\s+|let\s+)%s\s*[=(:<(]" % c, txt):
            df += 1
        # uso como componente JSX
        us = len(re.findall(r"<%s[\s/>]" % c, txt))
        ndef += df
        nuse += us
        oc += 1
    print("[%s] def=%d uso=%d arquivos=%d" % (c, ndef, nuse, oc))

# posicao do return em RadioPlayer.tsx (onde RadioAlertShell deveria entrar)
rp = os.path.join(SRC, "components", "RadioPlayer.tsx")
rawRP = rd(rp).decode("utf-8", errors="replace")
L = rawRP.splitlines()
print("=" * 68)
print("[RadioPlayer.tsx] defs RadioAlertShell:", "RadioAlertShell" in rawRP)
print("[RadioPlayer.tsx] occurrences RadioAlertShell:", rawRP.count("RadioAlertShell"))
print("[RadioPlayer.tsx] occurrences player-breaking-bar:", rawRP.count("player-breaking-bar"))
print("[RadioPlayer.tsx] occurrences player-alert-mute:", rawRP.count("player-alert-mute"))
# primeiro return
for i, l in enumerate(L):
    if re.match(r"\s*return\s*\(|return\s*$|return \(", l):
        print("[return] primeira linha de return em: %d" % (i + 1))
        for j in range(i, min(i + 26, len(L))):
            a = "".join(ch if 32 <= ord(ch) < 127 else "?" for ch in L[j])
            print("%5d| %s" % (j + 1, a[:150]))
        break
