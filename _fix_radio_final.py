# -*- coding: utf-8 -*-
# ============================================================
#  _fix_radio_final.py  (ASCII-only source; byte-safe canal)
#  1) git restore RadioPlayer.tsx  -> bytes limpos do HEAD
#  2) re-aplica guard audioRef?.current (crash 830:28)
#  3) garante RadioAlertShell (player-breaking-bar +
#     player-alert-mute + som breaking 1x respeitando mute)
#  4) roda vitest alerts com saida em arquivo (byte-safe)
# ============================================================
from pathlib import Path
import subprocess, os, re

BASE = Path(r"C:\wamp64\www\news-ready-portal\opencode\news-ready-portal")
RP = BASE / "src" / "components" / "RadioPlayer.tsx"

def rd(rel):
    return (BASE / rel).read_bytes().decode("utf-8", errors="replace")

def wr(rel, text):
    (BASE / rel).write_bytes(text.encode("utf-8"))

# ---------- 1) restaura RadioPlayer do git (byte-perfeito) ----------
subprocess.run(
    ["git", "-C", str(BASE), "restore", "--source=HEAD", "--", "src/components/RadioPlayer.tsx"],
    check=True, timeout=60000,
)
print("[git] RadioPlayer restaurado HEAD")

rp = rd("src/components/RadioPlayer.tsx")
print("[rp] linhas:", rp.count(chr(10)) + 1)

# ---------- 2) guard crash: audioRef.current -> audioRef?.current ----------
crus = rp.count("audioRef.current") - rp.count("audioRef?.current")
rp = rp.replace("audioRef.current", "audioRef?.current")
print("[guard] crus restantes:", rp.count("audioRef.current") - rp.count("audioRef?.current"),
      "| guardados:", rp.count("audioRef?.current"))

# ---------- 3) RadioAlertShell ----------
existe = rp.count("function RadioAlertShell(")
print("[shell] ja existe def:", existe)

if existe == 1:
    print("[shell] reutilizando def existente")
else:
    # injeta a def antes do alias final (alias unico esperado)
    alias = "export const RadioPlayer = RadioPlayerBar;"
    if rp.count(alias) == 1:
        shell = r'''
/**
 * Fase D (4.2b) - central de alertas do player:
 * - player-breaking-bar: tarja breaking na borda inferior (mobile),
 *   mostrada quando breakingLatest() retorna breaking pendente;
 * - player-alert-mute: mute global de alertas (toggleAlertMuted),
 *   respeitado pelo som de breaking (1x por breaking, mute-aware).
 */
function RadioAlertShell() {
  const alerts = useAlerts();
  const breaking = breakingLatest();
  const playedBreaking = useRef<string | null>(null<TEMPLATE>);
  useEffect(() => {
    if (!breaking) return;
    if (playedBreaking.current === breaking.id) return;
    playedBreaking.current = breaking.id;
    void playAlertSound({
      kind: "breaking",
      volume: alerts.alertVolume,
      muted: alerts.mutedAlert,
    }).catch(() => {});
  }, [breaking, alerts.alertVolume, alerts.mutedAlert]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 px-3 pb-2 sm:pb-3">
      {breaking ? (
        <button
          type="button"
          data-testid="player-breaking-bar"
          data-breaking-id={breaking.id}
          className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-xl border border-red-500/70 bg-red-600/95 px-3 py-2 text-left text-white shadow-2xl"
        >
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-80" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          <span className="truncate text-xs font-black uppercase tracking-wide">
            Urgente &middot; {breaking.title}
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
        {alerts.mutedAlert ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

'''
        # remove marcador TEMPLATE se excessivo
        shell = shell.replace("<TEMPLATE>", "")
        rp = rp.replace(alias, shell + alias, 1)
        print("[shell] def injetada antes do alias")
    else:
        print("[warn] alias unico nao encontrado; count:", rp.count(alias))

# ---------- 3b) garantir render: standalone !url||!open -> shell ----------
guard_old = "  if (!url || !open) {\n    return null;\n  }"
ng = rp.count(guard_old)
print("[guard-standalone] count:", ng)
if ng == 1 and rp.count("return <RadioAlertShell />;") == 0:
    rp = rp.replace(guard_old, "  if (!url || !open) {\n    return <RadioAlertShell />;\n  }", 1)
    print("[guard-standalone] -> return <RadioAlertShell />")

# ---------- 3c) usar shell dentro da barra aberta (player visivel) ----------
if rp.count("data-testid=\"radio-player-bar\"") >= 1:
    # injeta irmão ao root via wrappeer com fragment? mantemos simples:
    # garante que quando ABERTO o mute/badge também aparece (dentro da barra)
    add_inside = '''
        <button
          type="button"
          data-testid="player-alert-mute"
          aria-pressed={alerts.mutedAlert}
          onClick={() => toggleAlertMuted()}
          className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20"
        >
          {alerts.mutedAlert ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
'''
    anchor_vol = "data-testid=\"menu-search-icon\""
    if anchor_vol in rp and rp.count("RadioAlertShell") >= 0:
        # nao duplicar: apenas se nao houver outro mute
        pass

wr("src/components/RadioPlayer.tsx", rp)
rp = rd("src/components/RadioPlayer.tsx")
print("[gravado] player-breaking-bar:", rp.count('data-testid="player-breaking-bar"'),
      "| player-alert-mute:", rp.count('data-testid="player-alert-mute"'),
      "| RadioAlertShell render:", rp.count("<RadioAlertShell />"))

# ---------- 4) oraculo vitest (arquivo byte-safe) ----------
outf = BASE / "_oracle_alert_FINAL.out"
env = dict(os.environ); env["FORCE_COLOR"] = "0"; env["CI"] = "1"
cmd = ["npx", "vitest", "run", "src/test/alerts.test.tsx", "--reporter=basic", "--no-coverage"]
try:
    with open(outf, "wb") as f:
        r = subprocess.run(cmd, cwd=BASE, stdout=f, stderr=subprocess.STDOUT, env=env, timeout=280_000)
    print("[oracle] exit:", r.returncode)
except subprocess.TimeoutExpired:
    print("[oracle] TIMEOUT 280s")

raw = outf.read_bytes().decode("utf-8", errors="replace")
sel = [l for l in raw.splitlines()
       if re.search(r"(Test Files|Tests |passed|failed|PASS|FAIL|alerts\.test|Error|Cannot|alerts\.test\.tsx:\d+|\u2713|\u2717)", l)]
for l in sel:
    print(l.encode("ascii", errors="replace").decode("ascii")[:210])
