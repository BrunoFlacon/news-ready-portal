# -*- coding: utf-8 -*-
# NADA edita. So roda o oracle e extrai TODAS as linhas-de-erro + frames
# 'at <arquivo>.tsx:<N>|<.tsx:<N>' do runtime 4.2b, gravando em arquivo.
import os, re, subprocess, time

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
OUT = os.path.join(BASE, "_oracle_alerts_JSTACK.out")
ENV = dict(os.environ)
ENV["FORCE_COLOR"] = "0"
ENV["CI"] = "1"
vit = os.path.join(BASE, "node_modules", ".bin", "vitest.cmd")
t0 = time.time()
try:
    with open(OUT, "wb") as f:
        r = subprocess.run(["cmd", "/c", vit, "run", "src/test/alerts.test.tsx",
                            "--reporter=basic", "--no-coverage"],
                           cwd=BASE, stdout=f, stderr=subprocess.STDOUT,
                           env=ENV, timeout=280_000)
    print("[oracle] exit:", r.returncode, "| dur %.1f" % (time.time() - t0))
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT")

def asc_(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

raw = open(OUT, "rb").read().decode("utf-8", errors="replace")
lines = raw.splitlines()
print("=" * 58)
# 1) todas as linhas '  at ' com frame .tsx/.ts  (as que vitest mostra do teste)
for i, l in enumerate(lines):
    a = asc_(l)
    if ("  at " in a) and (".tsx:" in a or ".ts:" in a or "test/" in a):
        m = re.search(r"at\s+((?:\w+\s+)?\S+\.tsx?:\d+:\d+)", a)
        if m:
            print("FRAME %s" % m.group(1))
# 2) a(s) linha(s) do error que citam o token
print("-" * 58)
for i, l in enumerate(lines):
    a = asc_(l)
    if re.search(r"(ReferenceError|Element type|got: undefined|is not defined|not defined|Expression expected|expected.*but got)", a):
        print("%5d| %s" % (i + 1, a[:150]))
