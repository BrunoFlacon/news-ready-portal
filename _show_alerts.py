# -*- coding: utf-8 -*-
# mostra imports de alerts.ts e a def/compat, byte-safe ascii.
import os

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
p = os.path.join(BASE, "src", "lib", "alerts.ts")

def show(lo, hi, tag):
    raw = open(p, "rb").read().decode("utf-8", errors="replace")
    L = raw.splitlines()
    print("=" * 58)
    print("[%s] alerts.ts  (%d..%d)  total=%d" % (tag, lo, hi, len(L)))
    for i in range(lo - 1, min(hi, len(L))):
        a = "".join(c if 32 <= ord(c) < 127 else "?" for c in L[i])
        print("%5d| %s" % (i + 1, a[:160]))

show(1, 16, "imports")
show(118, 140, "useAlerts/compat")
