# -*- coding: utf-8 -*-
# Oracle vitest byte-safe -> arquivo; imprime so veredito ascii.
import os, re, subprocess, time

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
OUT = os.path.join(BASE, "_oracle_alerts_FINAL4.out")

def rd_(p_):
    with open(p_, "rb") as f:
        return f.read()
def asc_(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

env = dict(os.environ)
env["FORCE_COLOR"] = "0"
env["CI"] = "1"
t0 = time.time()
vit = os.path.join(BASE, "node_modules", ".bin", "vitest.cmd")
try:
    with open(OUT, "wb") as f:
        r = subprocess.run(["cmd", "/c", vit, "run", "src/test/alerts.test.tsx",
                            "--reporter=basic", "--no-coverage"],
                           cwd=BASE, stdout=f, stderr=subprocess.STDOUT,
                           env=env, timeout=290_000)
    print("[oracle] exit:", r.returncode, "| dur %.1fs" % (time.time() - t0))
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT")

rawO = rd_(OUT).decode("utf-8", errors="replace")
print("=" * 60)
for l in rawO.splitlines():
    a = asc_(l)
    if re.search(r"(Test Files|Tests |PASS|FAIL|passed|failed|ReferenceError"
                 r"|nullapsed|Element type|Cannot read|Unable to find|Expression expected"
                 r"|Syntax Error|Received|✓|×)", a):
        print(a[:170])
