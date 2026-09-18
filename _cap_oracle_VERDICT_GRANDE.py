# -*- coding: utf-8 -*-
# ORACLE VEREDITO FINAL (byte-safe, completo, escreve em arquivo).
# Purga TUDO (dedurje o oracle) e mostra so o veredito + o frame do undefined.
import os, glob, re, shutil, subprocess, time

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
OUT = os.path.join(BASE, "_oracle_alerts_VERDICT_GRANDE.out")

def rd_(p_):
    with open(p_, "rb") as f_:
        return f_.read()
def asc_(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

# 1) purge turbo
purged = []
for pat in ("node_modules/.cache", "node_modules/.vite", "node_modules/.vitest",
            "node_modules/.esbuild", "node_modules/.swc", "node_modules/.vite-temp",
            "*.tsbuildinfo", "node_modules/service-worker"):
    for g_ in glob.glob(os.path.join(BASE, pat)):
        if os.path.isdir(g_):
            shutil.rmtree(g_, ignore_errors=True)
            purged.append(pat)
        elif os.path.isfile(g_):
            try:
                os.remove(g_)
            except OSError:
                pass
            purged.append(pat)
print("[purge] ->", purged or "(sujo?)")

# 2) oracle
env = dict(os.environ)
env["FORCE_COLOR"] = "0"
env["CI"] = "1"
vit = os.path.join(BASE, "node_modules", ".bin", "vitest.cmd")
t0 = time.time()
try:
    with open(OUT, "wb") as f_:
        r = subprocess.run(["cmd", "/c", vit, "run", "src/test/alerts.test.tsx",
                            "--reporter=basic", "--no-coverage"],
                           cwd=BASE, stdout=f_, stderr=subprocess.STDOUT,
                           env=env, timeout=295_000)
    print("[oracle] exit:", r.returncode, "| dur %.1f" % (time.time() - t0))
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT")

raw = rd_(OUT).decode("utf-8", errors="replace")
print("=" * 60)
for l_ in raw.splitlines():
    a_ = asc_(l_)
    if re.search(r"(Test Files|Tests |PASS|FAIL|passed|failed|getByTestId"
                 r"|player-breaking-bar|player-alert-mute|nullapsed|ReferenceError"
                 r"|Element type|got: undefined|Unable to find|toHaveBeenCalledTimes"
                 r"|URGENTE|Urgente|Aconteceu|Breaking|✓|×)", a_):
        print(a_[:180])
