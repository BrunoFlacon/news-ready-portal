# -*- coding: utf-8 -*-
# Byte-safe scan final: (A) em Home.tsx todas as linhas com 'export' que
# casam Alert*/Breaking*/Bell/Toast/Badge/Ticker (mostra a ASSINATURA real),
# (B) em alerts.test.tsx os imports oriundos de '@/pages/Home' e
# '@/components/RadioPlayer' (o conjunto que o teste espera), (C) o token
# exato 'nullapsed' em QUALQUER arquivo de src via os.walk (utf8 byte), 
# (D) a regiao 120..132 de alerts.test.tsx (onde o oracle aponta:124).
import os, re

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"

def rd(p_):
    with open(p_, "rb") as f:
        return f.read()
def asc(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

def walk_src():
    for dp, dns, fns in os.walk(os.path.join(BASE, "src")):
        for fn in fns:
            if fn.endswith((".ts", ".tsx")):
                yield os.path.join(dp, fn).replace(os.sep, "/")

# ---- (C) nullapsed em src inteiro ----
tot = 0
for p_ in walk_src():
    raw = rd(p_).decode("utf-8", errors="replace")
    n = raw.count("nullapsed") + raw.count("nullapsedx")
    if n:
        tot += n
        print("[nullapsed] %s -> %d" % (p_.split("news-ready-portal/")[-1], n))
print("[nullapsed] total em src:", tot)

# ---- (D) alerts.test.tsx 118..134 ----
t = rd(os.path.join(BASE, "src", "test", "alerts.test.tsx")).decode("utf-8", errors="replace")
L = t.splitlines()
print("=" * 58)
print("[alerts.test.tsx] 118..134")
for i in range(117, min(134, len(L))):
    print("%5d| %s" % (i + 1, asc(L[i])[:150]))

# ---- (A) Home.tsx linhas export *Alert* ----
h = rd(os.path.join(BASE, "src", "pages", "Home.tsx")).decode("utf-8", errors="replace")
print("=" * 58)
print("[Home.tsx] linhas inicio-com-export e que citam Alert/Breaking/Bell/Toast/Badge/Ticker:")
hl = h.splitlines()
for i, l in enumerate(hl):
    if l.lstrip().startswith("export") and re.search(r"Alert|Breaking|Bell|Toast|Badge|Ticker|Bell|=", l):
        print("%5d| %s" % (i + 1, asc(l)[:150]))

# ---- (B) alerts.test.tsx: imports de Home/RadioPlayer ----
print("=" * 58)
print("[alerts.test.tsx] imports de @/pages/Home e @/components/RadioPlayer:")
for i, l in enumerate(t.splitlines()):
    if re.search(r"import\s*\{|from\s*[\"']@/pages/Home|from\s*[\"']@/components/RadioPlayer", l):
        print("%5d| %s" % (i + 1, asc(l)[:160]))
