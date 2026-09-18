# -*- coding: utf-8 -*-
# ORACLE POS-BELL: roda vitest alerts, veredito filtrado byte-safe, sai so o
# essencial. NAO toca em fonte.
import os, re, subprocess, time

BASE_ = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
OUT_ = os.path.join(BASE_, "_oracle_alerts_POSTBELL.out")

def rd_(p_):
    with open(p_, "rb") as f:
        return f.read()
def asc_(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

env = dict(os.environ)
env["FORCE_COLOR"] = "0"
env["CI"] = "1"
vit_ = os.path.join(BASE_, "node_modules", ".bin", "vitest.cmd")
t0 = time.time()
try:
    with open(OUT_, "wb") as f:
        r = subprocess.run(["cmd", "/c", vit_, "run", "src/test/alerts.test.tsx",
                            "--reporter=basic", "--no-coverage"],
                           cwd=BASE_, stdout=f, stderr=subprocess.STDOUT,
                           env=env, timeout=290_000)
    print("[oracle] exit:", r.returncode, "| dur %.1fs" % (time.time() - t0))
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT")

raw = rd_(OUT_).decode("utf-8", errors="replace")
print("=" * 60)
for l in raw.splitlines():
    a = asc_(l)
    if re.search(r"(Test Files|Tests |PASS|FAIL|passed|failed|ReferenceError"
                 r"|nullapsed|Element type|got: undefined|Cannot read|Got: undefined"
                 r"|player-breaking-bar|player-alert-mute|player-alert-bell"
                 r"|Bell is|✓|×)", a):
        print(a[:175])
