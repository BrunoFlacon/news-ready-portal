# -*- coding: utf-8 -*-
# Diagnostico byte-safe rapido: lib alerts (imports e regiao 110-140)
# e RadioPlayer (imports + regiao do RadioAlertShell). Imprime ascii-only.
import os, re

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
def rd(rel):
    with open(os.path.join(BASE, rel), "rb") as f:
        return f.read().decode("utf-8", errors="replace")

def show(rel, lo, hi, tag):
    L = rd(rel).splitlines()
    print("=" * 60)
    print("[" + tag + "] " + rel + "  (linhas %s-%s)" % (lo + 1, hi))
    for i in range(lo - 1, min(hi, len(L))):
        a = "".join(c if 32 <= ord(c) < 127 else "?" for c in L[i])
        print("%5d| %s" % (i + 1, a[:150]))

# imports do alerts lib
show("src/lib/alerts.ts", 1, 35, "alerts-imports")
show("src/lib/alerts.ts", 100, 140, "alerts-body")
