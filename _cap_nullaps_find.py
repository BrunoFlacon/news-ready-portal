# -*- coding: utf-8 -*-
# Caça a ORIGEM de 'nullapsed': grep byte-safe por 'nullapsed' (e variantes
# proximas 'nullasp', 'ullapse' que o swc pode ter transformado) em TODO src/,
# listando arquivo:linha. Tambem: exports de RadioPlayer.tsx e imports do
# mesmo em Home/alerts para achar o componente 'undefined' (4.2b).
import os, re

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"

def rd(p_):
    with open(p_, "rb") as f_:
        return f_.read()

def text_from_walk(root):
    out = []
    for dp, dn, fn in os.walk(root):
        for name in fn:
            if not (name.endswith((".ts", ".tsx", ".js", ".jsx", ".json"))):
                continue
            if name in ("package-lock.json") or "node_modules" in dp:
                continue
            p_ = os.path.join(dp, name)
            out.append(p_)
    return out

# 1) grep 'nullapsed'/'nullasp'
pats = [re.compile(rb"nullapsed"), re.compile(rb"nullasp"), re.compile(rb"ullapse")]
hits = []
for p_ in text_from_walk(os.path.join(BASE, "src")):
    try:
        raw = rd(p_)
    except OSError:
        continue
    for ln_i, ln in enumerate(raw.split(b"\n")):
        for pat in pats:
            m = pat.search(ln)
            if m:
                start = max(0, m.start() - 34)
                ctx = raw.decode("utf-8", errors="replace")  # nao usar, caro
                break
        else:
            continue
        # so imprime se achou; monta contexto asc-afeito localmente
        a = "".join(c if 32 <= ord(c) < 127 else "?" for c in ln.decode("latin-1"))
        hits.append((p_, ln_i + 1, a[:120]))
        break

print("[grep nullapsed/ullapse] total:", len(hits))
for p_, ln, a in hits[:40]:
    print("  %s:%d | %s" % (os.path.relpath(p_, BASE), ln, a))

# 2) exports do RadioPlayer e imports respectivos
print("=" * 56)
RP = os.path.join(BASE, "src", "components", "RadioPlayer.tsx")
rawRP = rd(RP).decode("utf-8", errors="replace")
print("[RadioPlayer] exports visiveis:")
for m in re.finditer(r"^export\s+(?:default\s+)?(?:function|const)\s+([A-Za-z0-9_]+)", rawRP, re.M):
    print("   export:", m.group(1))

HOME = os.path.join(BASE, "src", "pages", "Home.tsx")
rawH = rd(HOME).decode("utf-8", errors="replace")
print("[Home] imports de RadioPlayer/alertas:")
for m in re.finditer(r"import\s+\{([^}]*)\}\s+from\s+[\"'][^\"']*(RadioPlayer|alerts|audio)[^\"']*[\"']", rawH):
    inner = m.group(1)
    print("   {", "".join(c if 32 <= ord(c) < 127 else "?" for c in inner).strip()[:90], "}")
