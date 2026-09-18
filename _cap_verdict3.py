# -*- coding: utf-8 -*-
# Roda o oraculo alerts com saida COMPLETA em arquivo e imprime o FINAL
# (ultimas 55 linhas) em ascii-safe, SEM filtrar por regex (nada se perde).
import subprocess, os

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
OUTF = os.path.join(BASE, "_alerts_VERDICT3.out")

env = dict(os.environ)
env["FORCE_COLOR"] = "0"
env["CI"] = "1"

vit = os.path.join(BASE, "node_modules", ".bin", "vitest.cmd")
try:
    with open(OUTF, "wb") as f:
        r = subprocess.run(["cmd", "/c", vit, "run", "src/test/alerts.test.tsx",
                            "--reporter=basic", "--no-coverage"],
                           cwd=BASE, stdout=f, stderr=subprocess.STDOUT,
                           env=env, timeout=280_000)
    print("[VERDICT] exit:", r.returncode)
except subprocess.TimeoutExpired:
    print("[VERDICT] TIMEOUT 280s")

raw = open(OUTF, "rb").read().decode("utf-8", errors="replace")
lines = raw.splitlines()
print("=" * 62)
# imprime TODAS as linhas que tenham conteudo relevante: contagem e falha
n = len(lines)
print("[VERDICT] total linhas:", n)
for l in lines[-55:]:
    a = "".join(c if 32 <= ord(c) < 127 else "?" for c in l)
    print(a[:180])
