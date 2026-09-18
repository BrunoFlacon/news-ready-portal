# -*- coding: utf-8 -*-
# Fix alerts.ts: dar valor real a ReactUseSyncExternalStore (hoje so 'declare const'
# -> ReferenceError em runtime). Injeta import nomeado do react quando faltar.
import os, re, subprocess

BASE = "C:/wamp64/www/news-ready-portal/opencode/news-ready-portal"
P = os.path.join(BASE, "src", "lib", "alerts.ts")

text = open(P, "rb").read().decode("utf-8", errors="replace")
orig = text

# 1) se nao ha import de react, adiciona um apos o primeiro import
has_react = bool(re.search(r"import[^;\n]*from\s+[\"']react[\"']", text))
print("[check] import react existente:", has_react)

if not has_react:
    # inserir o import logo apos o cabecalho de comentario inicial (primeira linha de import ou apos bloco /* */)
    lines = text.splitlines()
    anchor = None
    for i, ln in enumerate(lines):
        if ln.startswith("import "):
            anchor = i
            break
    if anchor is None:
        # sem imports nenhum? coloca antes da primeira export
        for i, ln in enumerate(lines):
            if ln.startswith("export "):
                anchor = i
                break
    if anchor is not None:
        lines.insert(anchor, 'import { useSyncExternalStore } from "react";')
        text = "\n".join(lines)
        print("[fix] import react inserido na linha", anchor + 1)
    else:
        text = 'import { useSyncExternalStore } from "react";\n' + text
        print("[fix] import react prepend")
else:
    # ja existe SOME import de react: garante que useSyncExternalStore vem dele.
    # Troca a 'declare const' por assercao pra apontar ao modulo React OU adiciona nomeado.
    # Mais deterministica: adicionar alias na primeira linha de import react.
    lines = text.splitlines()
    done = False
    for i, ln in enumerate(lines):
        m = re.match(r"(import\s+(?:\{[\s\S]*?\}|\* as \w+|\w+)\s+from\s+[\"']react[\"'])", ln)
        if m:
            base_imp = m.group(1)
            if "useSyncExternalStore" in base_imp:
                print("[info] react ja expoe useSyncExternalStore")
            else:
                lines[i] = 'import { useSyncExternalStore as ReactUseSyncExternalStore } from "react";'
                done = True
            break
    if done:
        text = "\n".join(lines)
        print("[fix] alias nomeado injetado (linha react)")
    else:
        print("[warn] caso nao tratado; usa fallback declare->const local")

# 2) garante que a chamada use o simbolo (mantem nome ReactUseSyncExternalStore na chamada)
text = text.replace(
    "declare const ReactUseSyncExternalStore:", "const ReactUseSyncExternalStore:"
)
open(P, "wb").write(text.encode("utf-8"))
print("[fix] declare const -> const (semantica ok se alias existir)")

# salvaguarda: se ainda nao houver definicao real, injeta definicao no fim do arquivo
if "const ReactUseSyncExternalStore =" not in text and "as ReactUseSyncExternalStore" not in text:
    text += (
        "\n// Bridge generica: se o import nomeado nao resolver, usa React fallback.\n"
        'import ReactFallback from "react";\n'
        "const ReactUseSyncExternalStore =\n"
        "  (ReactFallback as any).useSyncExternalStore ??\n"
        "  ((s: any, g: any, gs: any) => g());\n"
    )
    open(P, "wb").write((text).encode("utf-8"))
    print("[fix] definicao fallback anexada no fim")

# ---- oraculo ----
OUTF = os.path.join(BASE, "_oracle_alerts_G4.out")
env = dict(os.environ); env["FORCE_COLOR"] = "0"
vit = os.path.join(BASE, "node_modules", ".bin", "vitest.cmd")
r = subprocess.run(["cmd", "/c", vit, "run", "src/test/alerts.test.tsx",
                    "--reporter=basic", "--no-coverage"],
                   cwd=BASE, stdout=open(OUTF, "wb"), stderr=subprocess.STDOUT,
                   env=env, timeout=280_000)
print("[oracle] exit:", r.returncode)
raw = open(OUTF, "rb").read().decode("utf-8", errors="replace")
for l in raw.splitlines():
    a = "".join(c if 32 <= ord(c) < 127 else "?" for c in l)
    if re.search(r"(Test Files|Tests |passed|failed|PASS|FAIL|alerts\.test|ReactUseSyncExternalStore|Cannot read|RadioPlayer\.tsx:\d+|Home\.tsx:\d+|Error)", a):
        print(a[:170])
