# -*- coding: utf-8 -*-
# Byte-safe exaustivo: localizar a origem do token runtime 'nullapsed' — um
# identificador/string corrompido gerado pelo swc a partir de bytes >127 em
# QUALQUER arquivo .ts/.tsx de src. Tambem: listar linhas de Home.tsx/RadioPlayer
# que contem bytes nao-ascii DENTRO de <identificador JSX> (uso de token) para
# achar qual componente esta quebrado, e o status do return do Home.
import os, re

BASE_ABS = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
SRC = os.path.join(BASE_ABS, "src")

def rd(p_):
    with open(p_, "rb") as f:
        return f.read()
def wr(p_, b_):
    with open(p_, "wb") as f:
        f.write(b_)
def asc(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

# ---- (A) scan global por 'nullaps' ate agora ----
print("=" * 36, "[global] procurando 'nullapsed' / substr nascii")
totnull = 0
for dp, dns, fns in os.walk(SRC):
    if "node_modules" in dp:
        continue
    for fn in fns:
        if not fn.endswith((".ts", ".tsx")):
            continue
        p_ = os.path.join(dp, fn)
        try:
            raww = rd(p_)
        except OSError:
            continue
        for k, m in enumerate(re.finditer(rb"nullapsed|nullaps", raww)):
            totnull += 1
            # contexto byte
            a = max(0, m.start() - 46)
            b = min(len(raww), m.end() + 46)
            ctx = raww[a:b].decode("utf-8", errors="replace")
            print("   [%s] +%d: ...%s..." % (asc(fn), k + 1, asc(ctx)[:94]))
print("[global] ocorrencias de 'nullaps*':", totnull)

# ---- (B) bytes 0xC0..0xFF longe de strings/comentarios em Home e RadioPlayer ----
def suspicious_bytes(rel, tag_):
    p_ = os.path.join(BASE_ABS, rel.replace("/", os.sep))
    raww = rd(p_)
    txt = raww.decode("utf-8", errors="replace")
    outliers = []
    for i, l in enumerate(txt.splitlines()):
        # pega linha, acha espaços entre primeiro < e '>' ou dentro de "..." 
        # heuristica simples: se a linha tem '<' referencia de componente e bytes>127
        if "<" in l and any(ord(c) > 127 for c in l):
            # lista os tokens <...> com bytes invalidos
            for m in re.finditer(r"<([A-Za-z][A-Za-z0-9_]*)", l):
                pass
        # bytes >127 fora de aspas/backtick/comentario (aproximado simples)
        strip = re.sub(r"//.*$", "", l)
        strip = re.sub(r"/\*.*?\*/", "", strip)
        strip = re.sub(r"['\"].*?['\"]", "", strip)
        if any(ord(c) > 127 for c in strip):
            bl = [hex(ord(c)) for c in strip if ord(c) > 127]
            outliers.append((i + 1, l, bl))
    print("=" * 36)
    print("[%s] linhas c/ byte>127 fora de strings/coment do tipo componente:" % tag_)
    for ln, l2, bl in outliers[:16]:
        print("   %5d| %s   << %s" % (ln, asc(l2[:128]), ",".join(bl[:6])))
    if not outliers:
        print("   (nenhuma)")

suspicious_bytes("src/pages/Home.tsx", "Home")
suspicious_bytes("src/components/RadioPlayer.tsx", "RadioPlayer")

# ---- (C) verificar o return do Home: HomeAlertCenter irmão e RadioHero fechado ----
hp = os.path.join(BASE_ABS, "src", "pages", "Home.tsx")
rawh = rd(hp).decode("utf-8", errors="replace")
L = rawh.splitlines()
print("=" * 36, "[Home] 1235..1255 (ascii)")
for i in range(1234, min(1255, len(L))):
    a = asc(L[i])
    print("%5d| %s" % (i + 1, a[:120]))
