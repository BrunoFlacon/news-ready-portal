# -*- coding: utf-8 -*-
# Invoca o oraculo vitest do JEITO QUE JA FUNCIONOU (cmd /c + vitest.cmd absoluto),
# grava saida em arquivo e imprime resumo filtrado ascii.
import subprocess, os, re

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
OUTF = os.path.join(BASE, "_oracle_alerts_GREEN.out")

env = dict(os.environ)
env["FORCE_COLOR"] = "0"

v = os.path.join(BASE, "node_modules", ".bin", "vitest.cmd")
args = ["cmd", "/c", v, "run", "src/test/alerts.test.tsx", "--reporter=basic", "--no-coverage"]
try:
    with open(OUTF, "wb") as f:
        r = subprocess.run(args, cwd=BASE, stdout=f, stderr=subprocess.STDOUT, env=env, timeout=280_000)
    print("[oracle] exit:", r.returncode)
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT 280s")

raw = open(OUTF, "rb").read().decode("utf-8", errors="replace")
print("=" * 62)
for l in raw.splitlines():
    a = "".join(ch if 32 <= ord(ch) < 127 else "?" for ch in l)
    if re.search(r"(Test Files|Tests  |passed|failed|PASS|FAIL|alerts\.test|Cannot read|Syntax Error|Expression expected|expected|Home\.tsx:\d+|RadioPlayer\.tsx:\d+)", a):
        print(a[:165])
