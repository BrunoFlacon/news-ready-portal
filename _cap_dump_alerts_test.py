# -*- coding: utf-8 -*-
# Dump byte-safe (ascii-filtered) de src/test/alerts.test.tsx:
#  - todas as ocorrencias de identificadores nao-palavra-chave estranhos
#    ('nullapsed', e qualquer token com >13 chars nao-js na linha 120..130)
#  - regiones 95..130 (o erro aponta alerts.test.tsx:124)
#  - imports e usos de HomeAlertCenter/HomeAlertPlayer/HomeBreaking/RadioPlayer
import os, re, subprocess, sys

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
P = os.path.join(BASE, "src", "test", "alerts.test.tsx")

env = dict(os.environ)
envb = {k: os.fsencode(v) for k, v in env.items()}

def rd(p):
    with open(p, "rb") as f:
        return f.read()

def asc(s):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s)

# imprimir tambem IDEIAS: roda um grep via python puro (nao precisa subprocess)
rawT = rd(P).decode("utf-8", errors="replace")
L = rawT.splitlines()

print("[alerts.test] bytes:", len(rawT))
print("[alerts.test] tem 'nullapsed':", rawT.count("nullapsed"))

# procura tokens suspeitos ao longo do arquivo
toks = re.findall(r"[A-Za-z_$][A-Za-z0-9_$]{10,}", rawT)
from collections import Counter
cnt = Counter(toks)
susp = {t for t, c in cnt.items()
        if t.lower() not in
        {"homescreen", "homealert", "homebreaking", "alertscenter",
         "premiumpanel", "programming", "entertainment", "radiobutton",
         "homestrategy", "playalert", "alertaudio", "settingsgrad"}}
if susp:
    print("[susp] tokens estranhos:", " | ".join(sorted(susp)[:25]))
else:
    print("[susp] nenhum token estranho (sufixo ok)")

# logica do sufixo: eventos com 'nullapsed' -- mostre as linhas que contem
# o substring 'nulllapsed' OU 'nullap' (byte-safe ascii)
for i, ln in enumerate(L):
    if "nullap" in ln:
        print("%5d| %s" % (i + 1, asc(ln)[:140]))

# regiones criticas
print("=" * 60)
for lo, hi, tag in ((90, 132, "linhas 90..132 (centro do teste)"),
                    (1, 45, "imports/uso 1..45")):
    print("--- %s ---" % tag)
    for i in range(lo - 1, min(hi, len(L))):
        print("%5d| %s" % (i + 1, asc(L[i])[:130]))
