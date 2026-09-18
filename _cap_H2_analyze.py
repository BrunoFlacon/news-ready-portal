# -*- coding: utf-8 -*-
# Byte-safe completo (asc-only out). Objetivo: resolver de UMA chamada as 3
# falhas do oracle alerts (4.1/4.2/4.2b). Passos:
#  (1) analisar HOME: quais componentes o alerts.test importa do @/pages/Home
#      e se existem exports; imprimir o bloco do return (RadioHero self-closed?).
#  (2) analisar RadioPlayer similar.
#  (3) aplicar fix no Home.tsx caso <HomeAlertCenter /> esteja APOS um
#      '<RadioHero ...bannerRef={bannerRef}>' NAO self-closed (correcao:
#      adicionar '/' ao '>'). O panic '> ; self-closed' e o que o oracle acusa
#      ("Element type is invalid ... forgot to export", "Expression expected").
#      Varrermos multiplas heuristi byte-level e aplicamos a mais conservadora.
#  (4) rodar oracle vitest gravando em arquivo; imprimir so linhas-veredito.
import os, re, subprocess

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
if not os.path.isdir(BASE):
    print("[base] FALHOU:", BASE)
    raise SystemExit(1)

def rd(p_):
    with open(p_, "rb") as f:
        return f.read()
def wr(p_, b_):
    with open(p_, "wb") as f:
        f.write(b_)
def asc(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

H = os.path.join(BASE, "src", "pages", "Home.tsx")
RP = os.path.join(BASE, "src", "components", "RadioPlayer.tsx")
T = os.path.join(BASE, "src", "test", "alerts.test.tsx")

rawH = rd(H).decode("utf-8", errors="replace")
rawRP = rd(RP).decode("utf-8", errors="replace")
rawT = rd(T).decode("utf-8", errors="replace")

compK = [
    "HomeAlertCenter", "HomeAlertBell", "HomeAlertBadge", "HomeAlertToast",
    "HomeAlertPlayer", "HomeBreakingTicker", "HomeBreakingTickerBar",
    "RadioAlertShell", "RadioAlertMute", "RadioAlertMuteButton",
    "BreakingTicker", "RadioPlayer", "RadioHero", "HomeAlertCenterCompat",
]

print("=" * 62)
print("[anexo] componentes: import-test | export-Home | export-RP | usoHome | usoRP")
for c in compK:
    im = rawT.count(c)                       # qualquer mencao no teste
    exH = rawH.count("export " + c) + rawH.count("export {" + c)
    exH += rawH.count(c + ",")               # export { A, B }
    rpH = rawH.count("<" + c)
    exRP = rawRP.count("export " + c) + rawRP.count("export {" + c) + rawRP.count(c + ",")
    rpRP = rawRP.count("<" + c)
    print("  %-24s impT=%-2d exH=%-2d exRP=%-2d usoH=%-2d usoRP=%-2d"
          % (c, im, exH, exRP, rpH, rpRP))

# ---- blocos de export do Home ----
print("=" * 62)
print("[Home] linhas com 'export ' (defs):")
for i, l in enumerate(rawH.splitlines()):
    if re.search(r"export\s+(function|const|default|interface|type|class)", l):
        a = asc(l)
        print("%5d| %s" % (i + 1, a[:130]))

# ---- return do Home: RadioHero self-closed? ----
print("=" * 62)
print("[Home] arquivo quebra se <RadioHero> nao fechar antes de HomeAlertCenter.")
print("[Home] buscando '<RadioHero' e o que vem depois:")
for m in re.finditer(r"<RadioHero", rawH):
    seg = rawH[m.start() : m.start() + 500]
    # acha a primeira linha que contem '>' e imprime 3 linhas em volta
    lines = seg.splitlines()
    for j, l in enumerate(lines):
        if "bannerRef" in l or (">" in l and j > 0 and len(lines) > j):
            print("    + %02d| %s" % (j, asc(l)[:110]))
    print("    ---- proxima tag (<...>):")
    mm = re.search(r"<[A-Z][A-Za-z0-9]*", rawH[m.end():])
    if mm:
        print("    prox tag:", asc(rawH[m.end() + mm.start() : m.end() + mm.end()]))
    print("    ---- contexto bruto 200 chars:")
    print("    ", asc(rawH[m.start() : m.start() + 260]).replace("?", "?"))
