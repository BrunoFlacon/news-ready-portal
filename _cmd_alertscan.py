# -*- coding: utf-8 -*-
# Scan alerts.ts: onde aparece ReactUseSyncExternalStore / useSyncExternalStore
# e os imports nas primeiras 40 linhas. ASCII-safe, byte-safe.
import os, re

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
p = os.path.join(BASE, "src", "lib", "alerts.ts")

raw = open(p, "rb").read().decode("utf-8", errors="replace")
L = raw.splitlines()

print("=" * 58, "\n[alerts.ts] imports region 1..50")
for i in range(0, min(50, len(L))):
    a = "".join(c if 32 <= ord(c) < 127 else "?" for c in L[i])
    print("%5d| %s" % (i + 1, a[:160]))

print("=" * 58, "\n[alerts.ts] onde 'useSyncExternalStore'/'ReactUseSyncExternalStore' ocorre")
hits = 0
for i, ln in enumerate(L):
    if re.search(r"ReactUseSyncExternalStore|useSyncExternalStore|declare const|ReactUseSync", ln):
        a = "".join(c if 32 <= ord(c) < 127 else "?" for c in ln)
        print("%5d| %s" % (i + 1, a[:160]))
        hits += 1
print("[alerts] total linhas relacionadas:", hits)

print("=" * 58, "\n[alerts.ts] definicao import react? (se houver)")
for i, ln in enumerate(L):
    if re.search(r"import|from \"react\"|from 'react'", ln):
        a = "".join(c if 32 <= ord(c) < 127 else "?" for c in ln)
        print("%5d| %s" % (i + 1, a[:160]))
