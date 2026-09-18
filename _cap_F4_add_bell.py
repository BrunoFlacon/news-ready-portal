# -*- coding: utf-8 -*-
# Home.tsx usa <Bell /> (lucide) mas 'Bell' nao esta no import lucide-react.
# 1) listar linha(s) c/ <Bell e o import lucide atual (byte-safe).
# 2) se 'Bell' ausente do import, adicionar mantendo ordem alfabetica ascii.
import os, re

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
H = os.path.join(BASE, "src", "pages", "Home.tsx")

def rd_(p_):
    with open(p_, "rb") as f:
        return f.read()
def asc_(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

raw = rd_(H).decode("utf-8", errors="replace")
lines = raw.splitlines()
print("[Home] linhas com uso de <Bell / Bell):")
for i, l in enumerate(lines):
    if re.search(r"\bBell\b", l):
        print("%5d| %s" % (i + 1, asc_(l)[:150]))
print("[Home] import lucide-react atual:")
for i, l in enumerate(lines):
    if "lucide-react" in l:
        print("%5d| %s" % (i + 1, asc_(l)[:200]))

# adicionar Bell se faltar
if re.search(r"\bBell\b", raw) and not re.search(r"lucide-react[\s\S]*\bBell\b", raw):
    m = re.search(r'from\s*"lucide-react"', raw)
    if not m:
        m = re.search(r"from\s*'lucide-react'", raw)
    if m:
        # achar o import statement bloco: voltar ate 'import {'
        line_start = raw.rfind("\n", 0, m.start()) + 1
        cur = raw[line_start:m.start()]
        # inserir Bell ordenado
        import re as _re
        body = cur
        ea = re.search(r"\{(.*?)\}", body, re.S)
        if ea:
            items = [x.strip() for x in ea.group(1).split(",") if x.strip()]
            if "Bell" not in items:
                items.append("Bell")
                items.sort()
                newbody = "{ " + ", ".join(items) + " }"
                body2 = body[: ea.start()] + newbody + body[ea.end():]
                raw = raw[:line_start] + body2 + raw[m.start():]
                with open(H, "wb") as f:
                    f.write(raw.encode("utf-8"))
                print("[fix][Bell] adicionado ao import lucide-react")
            else:
                print("[fix][Bell] ja presente")
