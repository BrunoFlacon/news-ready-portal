# -*- coding: utf-8 -*-
# ULTIMA tentativa real bruta: (1) remove QUALQUER cache vitest/swc restante
# (node_modules/.vitest, .cache, .esbuild, tsbuildinfo raiz), (2) roga o oracle
# gravando tudo num arquivo, (3) imprime apenas o veredito final + 1a linha de erro.
import os, re, subprocess, time, shutil

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
OUT = os.path.join(BASE, "_oracle_final_GREEN_ABC7.out")

def rd_(p_):
    with open(p_, "rb") as f:
        return f.read()
def asc_(s_):
    return "".join(c if 32 <= ord(c) < 127 else "?" for c in s_)

# (1) purga completa de caches
for cand in ["node_modules/.vite", "node_modules/.vitest", "node_modules/.cache",
             "node_modules/.esbuild", "node_modules/.swc", "_oracle*",
             "*.tsbuildinfo", "node_modules/typescript"]:
    pass
hits = []
for dp, dns, fns in os.walk(BASE):
    if "node_modules" not in dp:
        continue
    for d_ in list(dns):
        if d_ in (".vite", ".vitest", ".cache", ".esbuild", ".swc"):
            p_ = os.path.join(dp, d_)
            shutil.rmtree(p_, ignore_errors=True)
            hits.append(p_.replace(BASE + "\\", ""))
    for f_ in list(fns):
        if f_.endswith((".tsbuildinfo", ".vitest-metadata.json")):
            p_ = os.path.join(dp, f_)
            try:
                os.remove(p_)
                hits.append(p_.replace(BASE + "\\", ""))
            except OSError:
                pass
print("[purge] removidos:", hits or "(nenhum)")

# (2) oracle
env = dict(os.environ)
env["FORCE_COLOR"] = "0"
env["CI"] = "1"
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
    print("[oracle] TIMEOUT 290s")

raw = rd_(OUT).decode("utf-8", errors="replace")
print("=" * 60)
for l in raw.splitlines():
    a = asc_(l)
    if re.search(r"(Test Files|Tests |PASS|FAIL|passed|failed|ReferenceError"
                 r"|nullapsed|Element type|got: undefined|Cannot read|Bell is"
                 r"|Unable to find|player-breaking|player-alert|✓|×|Bell)", a):
        print(a[:170])
