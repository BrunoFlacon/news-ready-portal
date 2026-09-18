# -*- coding: utf-8 -*-
import os, re, subprocess, time
BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
OUT = os.path.join(BASE, "_oracle_FULL_ERROR.out")
def rd_(p_):
    with open(p_, "rb") as f: return f.read()
def asc_(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)
env = dict(os.environ); env["FORCE_COLOR"]="0"; env["CI"]="1"
vit = os.path.join(BASE, "node_modules", ".bin", "vitest.cmd")
t0 = time.time()
try:
    with open(OUT, "wb") as f:
        r = subprocess.run(["cmd", "/c", vit, "run", "src/test/alerts.test.tsx",
                            "--reporter=basic", "--no-coverage"],
                           cwd=BASE, stdout=f, stderr=subprocess.STDOUT,
                           env=env, timeout=290_000)
    print("[oracle] exit:", r.returncode, "| dur %.1fs" % (time.time() - t0))
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT")
raw = rd_(OUT).decode("utf-8", errors="replace")
print("=" * 60)
for l in raw.splitlines():
    a = asc_(l)
    if re.search(r"(Unable to find|Element type|ReferenceError|toHaveTextContent|expect|play|mock|player-breaking|player-alert|FAIL|PASS|Error|Error:)", a):
        print(a[:200])