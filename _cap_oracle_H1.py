# -*- coding: utf-8 -*-
# ASCII puro. Roda o oraculo vitest dos alertas no estado atual do disco e
# filtra (byte-seguro) apenas as linhas de veredito. Nada de heredoc.
import os, re, subprocess

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
BASE = BASE.replace("news-ready-portal", "news-ready-portal")  # no-op, clarity
OUT = os.path.join(BASE, "_oracle_alerts_H1.out")

def rd(p_):
    with open(p_, "rb") as f:
        return f.read()
def wr(p_, b_):
    with open(p_, "wb") as f:
        f.write(b_)

env = dict(os.environ)
env["FORCE_COLOR"] = "0"
env["CI"] = "1"
vit = os.path.join(BASE, "node_modules", ".bin", "vitest.cmd")
try:
    with open(OUT, "wb") as f:
        r = subprocess.run(["cmd", "/c", vit, "run", "src/test/alerts.test.tsx",
                            "--reporter=basic", "--no-coverage"],
                           cwd=BASE, stdout=f, stderr=subprocess.STDOUT,
                           env=env, timeout=280_000)
    print("[oracle] exit:", r.returncode)
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT 280s")

raw = rd(OUT).decode("utf-8", errors="replace")
ok = {}
for i, l in enumerate(raw.splitlines()):
    a = "".join(c if 32 <= ord(c) < 127 else "?" for c in l)
    if re.search(r"(Test Files|Tests |passed|failed|PASS|FAIL|alerts\.test"
                 r"|alerts\.ts:\d+|RadioPlayer\.tsx:\d+|Home\.tsx:\d+|"
                 r"ReferenceError|Cannot read|Syntax Error|Expression expected"
                 r"|Element type|got: undefined)", a):
        print(a[:168])
