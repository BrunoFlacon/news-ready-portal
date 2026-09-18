// _run_oracle_alerts.cjs — ASCII ONLY. Executa vitest programaticamente
// (evita o console Windows quebrado) e grava resultado em arquivo.
const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const BASE = path.join("C:", "wamp64", "www", "news-ready-portal", "opencode", "news-ready-portal");
const OUT = path.join(BASE, "_oracle_alerts_GREEN.out");

// vitest bin
const vitestBin = path.join(BASE, "node_modules", "vitest", "vitest.mjs");
const nodeBin = process.execPath;

const args = [
  vitestBin,
  "run",
  "src/test/alerts.test.tsx",
  "--reporter=basic",
  "--no-coverage",
];

try {
  const out = execFileSync(nodeBin, args, {
    cwd: BASE,
    encoding: "utf-8",
    env: Object.assign({}, process.env, { FORCE_COLOR: "0", CI: "1" }),
    timeout: 300000,
    maxBuffer: 50 * 1024 * 1024,
  });
  fs.writeFileSync(OUT, out, "utf-8");
  process.stdout.write("[oracle] exit 0\n");
} catch (e) {
  const msg = (e.stdout || e.message || "") + "\n" + (e.stderr || "");
  fs.writeFileSync(OUT, msg, "utf-8");
  process.stdout.write("[oracle] exit " + (e.status != null ? e.status : 1) + "\n");
}

// imprime apenas resumo filtrado ASCII (canal de saida, sem console quebrado)
let raw = "";
try { raw = fs.readFileSync(OUT, "utf-8"); } catch (_) {}
const lines = raw.split(/\r?\n/);
const re = /(Test Files|Tests |passed|failed|PASS|FAIL|alerts\.test|RadioPlayer\.tsx|Error|Cannot read|player-|home-)/;
for (const l of lines) {
  const al = l.replace(/[^\x20-\x7E]/g, "?");
  if (al.trim() && re.test(al)) process.stdout.write(al.slice(0, 200) + "\n");
}
