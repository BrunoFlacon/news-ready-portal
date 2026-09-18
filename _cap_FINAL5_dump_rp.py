# -*- coding: utf-8 -*-
# 4.2b: RadioPlayer render colapsa c/ 'Element type ... got: undefined'.
# Dump unico: (A) tags JSX <Xxx usadas em RadioPlayer.tsx vs def/export;
# (B) imports de RadioPlayer em alerts.test.tsx; nao edita nada.
import os, re

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
RP = os.path.join(BASE, "src", "components", "RadioPlayer.tsx")
T = os.path.join(BASE, "src", "test", "alerts.test.tsx")

def rd_(p_):
    with open(p_, "rb") as f:
        return f.read()
def asc_(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

rp = rd_(RP).decode("utf-8", errors="replace")
tx = rd_(T).decode("utf-8", errors="replace")

# tags JSX internas (nao self-closed; ignora <RadioPlayer</...> e builtins)
tags = {}
for m in re.finditer(r"<(\w+)", rp):
    n_ = m.group(1)
    if n_[0].islower():
        continue
    tags[n_] = tags.get(n_, 0) + 1
defs = set(re.findall(r"(?:export\s+)?(?:function|const)\s+(Radio\w+)\b", rp))
print("[RadioPlayer] tags JSX internas:")
for k in sorted(tags):
    print("   %-22s uso=%d| def=%s" % (k, tags[k], "SIM" if k in defs else "NAO"))
print("[RadioPlayer] defs/export locais:")
for k in sorted(defs):
    print("   %s" % k)

print("=" * 60)
print("[alerts.test] tem RadioPlayer:")
for i, l in enumerate(tx.splitlines()):
    if "components/RadioPlayer" in l or ("RadioPlayer" in l and "import" in l):
        print("%5d| %s" % (i + 1, asc_(l)[:170]))
