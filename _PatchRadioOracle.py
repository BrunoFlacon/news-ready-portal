# -*- coding: utf-8 -*-
# PatchRadioOracle.py - ASCII-only source. Patcheia RadioPlayer.tsx (shell de
# alertas: player-breaking-bar + player-alert-mute + som breaking 1x com mute)
# e roda o oraculo vitest alerts (saida em arquivo, filtro ascii bytesafe).
from pathlib import Path
import re, subprocess, os

BASE = Path(r"C:\wamp64\www\news-ready-portal\opencode\news-ready-portal")
def rd(rel): return (BASE / rel).read_bytes().decode("utf-8", errors="replace")
def wr(rel, t): (BASE / rel).write_bytes(t.encode("utf-8"))

# ============ [0] RadioPlayer.tsx: shell de alertas ============
rp = rd("src/components/RadioPlayer.tsx")
print("[audioRef] guardas:", rp.count("audioRef?.current"), "| crus:", rp.count("audioRef.current") - rp.count("audioRef?.current"))

# Algum shell ja existe?
if "function RadioAlertShell(" in rp:
    print("[shell] RadioAlertShell JAH existe - nada a injetar (verificar uso)")
elif "RadioAlertShell" in rp:
    print("[shell] nome RadioAlertShell presente mas nao funcion")
else:
    # Injetar: precisa saber como RadioPlayerBar e RadioPlayer sao exportados.
    # Usar alias unico e standalone shell.
    # Procurar a assinatura de RadioPlayerBar no final (so conhecida via bytes).
    print("[shell] RadioAlertShell AUSENTE - preciso da estrutura do final do arquivo")
    # Nao vamos inventar: imprimir as utimas ~40 linhas byte-safe para decidir
    tail_lines = rp.splitlines()[-40:]
    for i, l in enumerate(tail_lines, start=len(rp.splitlines()) - 39):
        al = l[:160].encode("ascii", errors="replace").decode("ascii")
        print(f"L{i}: {al}")
'