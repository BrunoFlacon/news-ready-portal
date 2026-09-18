# -*- coding: utf-8 -*-
# PatchRadioShell_FINAL.py — byte-safe via canal write + oraculo subprocess->arquivo.
# ASCII-only fonte. Nenhum acento no codigo deste arquivo.
from pathlib import Path
import subprocess, os, re

BASE = Path(r"C:\wamp64\www\news-ready-portal\opencode\news-ready-portal")

def rd(rel): return (BASE / rel).read_bytes().decode("utf-8", errors="replace")
def wr(rel, t): (BASE / rel).write_bytes(t.encode("utf-8"))

rp = rd("src/components/RadioPlayer.tsx")
print("[rp] linhas:", rp.count("\n") + 1)

shell = r'''
/**
 * Fase D (4.2b) — central de alertas standalone do player:
 * - player-breaking-bar: tarja de breaking news truncada (mobile) sempre que
 *   ha breakingLatest() ativa; som de emergencia 1x por breaking respeitando
 *   o mute global (lib audio-alert + alerts).
 * - player-alert-mute: botao que alterna o mute global de alertas
 *   (toggleAlertMuted da lib alerts).
 */
function RadioAlertShell() {
  const alerts = useAlerts();
  const breaking = breakingLatest();
  const remindedSound = useRef<string | null>(null);

  // Som UMA vez por breaking (nao repete para o mesmo id), respeitando o mute.
  useEffect(() => {
    if (!breaking) {
      return;
    }
    if (remindedSound.current === breaking.id) {
      return;
    }
    remindedSound.current = breaking.id;
    playAlertSound?.({
      kind: "breaking",
      volume: alerts.alertVolume,
      muted: alerts.mutedAlert,
    }).catch?.(() => {});
  }, [breaking, alerts.alertVolume, alerts.mutedAlert]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 px-3 pb-3 sm:pb-4"
    >
      {breaking ? (
        <button
          type="button"
          data-testid="player-breaking-bar"
          data-breaking-id={breaking.id}
          className="pointer-events-auto w-full max-w-md truncate rounded-xl border border-red-500/70 bg-red-600 px-3 py-2 text-left text-white shadow-2xl"
        >
          <span className="inline-flex flex-1 gap-2">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            <span className="truncate text-xs font-black uppercase tracking-wide">
              Urgente &middot; {breaking.title}
            </span>
          </span>
        </button>
      ) : (
        <span className="sr-only">Sem alerta ativo</span>
      )}

      <button
        type="button"
        data-testid="player-alert-mute"
        aria-pressed={alerts.mutedAlert}
        onClick={() => toggleAlertMuted()}
        className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
      >
        {alerts.mutedAlert ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

'''

# Anchora robusta: alias final unico.
alias = "export const RadioPlayer = RadioPlayerBar;"
na = rp.count(alias)
print("[aliass] count:", na)
if na == 1 and "function RadioAlertShell(" not in rp:
    rp = rp.replace(alias, shell + alias, 1)
    print("[shell] RadioAlertShell injetado (def)")
elif "function RadioAlertShell(" in rp:
    print("[shell] ja presente")

# Render: garantir que o shell aparece (a) standalone (sem url/open) e
# (b) junto da barra principal. Primeira ancora: o guard de retorno-nulo.
guard = "  if (!url || !open) {\n    return null;\n  }"
ng = rp.count(guard)
print("[guard-!url||!open] count:", ng)
if ng == 1:
    rp = rp.replace(guard, "  if (!url || !open) {\n    return <RadioAlertShell />;\n  }", 1)
    print("[guard] standalone -> RadioAlertShell")

# (b) junto da barra principal: injetar como irmao do root radio-player-bar.
bar_anchor = 'data-testid="radio-player-bar"'
nb = rp.count(bar_anchor)
print("[bar-anchor] count:", nb)
if nb == 1 and "<RadioAlertShell />" not in rp:
    # injeta o shell como primeiro elemento do fragmento de retorno, antes do root
    # localiza a linha do root: "<div" + bar_anchor
    tmp = rp
    i = tmp.find("<div\n      " + bar_anchor) if ("<div\n      " + bar_anchor) in tmp else tmp.find(bar_anchor)
    if i >= 0:
        # volta para o inicio da tag <div do root para colocar o shell como sibling
        j = tmp.rfind("<div", 0, i)
        # se existir fragmento <> abrindo o return
        k = tmp.rfind("return (", 0, j)
        if k >= 0:
            # inserir shell logo apos "return (\n    <>\n" ou antes do primeiro <div
            seg_start = tmp.find("\n      <", j)
            rp = tmp[:j] + "\n      <RadioAlertShell />\n" + tmp[j:]
            print("[bar] shell injetado como sibling do root")
        else:
            print("[bar][warn] sem fragmento de return viavel")
    else:
        print("[bar][warn] root nao localizado")

wr("src/components/RadioPlayer.tsx", rp)
print("[rp] final | player-breaking-bar:", rp.count('data-testid="player-breaking-bar"'),
      "| player-alert-mute:", rp.count('data-testid="player-alert-mute"'),
      "| RadioAlertShell usos:", rp.count("<RadioAlertShell />"))

# ================= ORACULO (subprocess -> arquivo, byte-safe) =================
outf = BASE / "_oracle_alerts_FINAL2.out"
envd = dict(os.environ); envd["FORCE_COLOR"] = "0"; envd["CI"] = "1"
cmd = ["npx", "vitest", "run", "src/test/alerts.test.tsx", "--reporter=basic", "--no-coverage"]
try:
    with open(outf, "wb") as f:
        r = subprocess.run(cmd, cwd=BASE, stdout=f, stderr=subprocess.STDOUT, env=envd, timeout=280_000)
    print("[oracle] exit:", r.returncode)
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT 280s")

raw = outf.read_bytes().decode("utf-8", errors="replace")
for l in raw.splitlines():
    al = l.encode("ascii", errors="replace").decode("ascii")
    if al.strip() and re.search(r"(Test Files|Tests |passed|failed|PASS|FAIL|alerts\.test|Error|player-breaking|player-alert|Cannot read)", al):
        print(al[:200])
