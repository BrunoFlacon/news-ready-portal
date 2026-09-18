# -*- coding: utf-8 -*-
import os, sys

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"

def show(rel, lo, hi, tag):
    p = os.path.join(BASE, rel.replace("/", os.sep))
    with open(p, "rb") as f:
        raw = f.read()
    L = raw.decode("utf-8", errors="replace").splitlines()
    print("=" * 62)
    print("[" + tag + "] " + rel + "  (%d..%d)  total=%d" % (lo + 1, hi, len(L)))
    for i in range(max(0, lo - 1), min(hi, len(L))):
        ln = L[i]
        a = "".join(c if 32 <= ord(c) < 127 else "?" for c in ln)
        print("%5d| %s" % (i + 1, a[:150]))

show("src/lib/alerts.ts", 1, 16, "imports alerts")
show("src/lib/alerts.ts", 104, 142, "useAlerts / compat")
