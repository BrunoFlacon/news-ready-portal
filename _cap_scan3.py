# -*- coding: utf-8 -*-
# alerts.ts: diagnostico imports 1..35 + bloco useSyncExternalStoreCompat +
# aplica fix: define ReactUseSyncExternalStore runtime de verdade
# (compat leve: usa React.useSyncExternalStore se disponivel, senao snapshot).
import os, re, subprocess

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
P = os.path.join(BASE, "src", "lib", "alerts.ts")
OUTF = os.path.join(BASE, "_oracle_alerts_G5.out")

def rd(p):
    with open(p, "rb") as f:
        return f.read()

def asc(s):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s)

raw = rd(P).decode("utf-8", errors="replace")
L = raw.splitlines()

print("=" * 58)
print("[alerts.ts] imports 1..40")
for i in range(0, min(40, len(L))):
    print("%5d| %s" % (i + 1, asc(L[i])[:150]))

print("=" * 58)
print("[alerts.ts] bloco compat 120..142")
for i in range(119, min(142, len(L))):
    print("%5d| %s" % (i + 1, asc(L[i])[:150]))
