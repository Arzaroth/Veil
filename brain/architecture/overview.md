# Overview

Veil is one omarchy-shell `service` plugin, `omarchy/arzaroth.veil/`. The
shell loads `Service.qml` at start and keeps it loaded; it owns the Wayland
session lock and creates one `LockView` per monitor on lock.

| File | Whose | Role |
|---|---|---|
| `manifest.json` | Veil | Plugin id `arzaroth.veil`, `kinds: ["service"]`, the `authentication` capability |
| `Service.qml` | upstream, with Veil's hooks | Lock request, the session lock, PAM, fingerprint, blanking, IPC (`omarchy-shell lock ...`) |
| `LockView.qml` | Veil, keeping upstream's password field | What each monitor shows |
| `Model.mjs` | Veil, compiled from `src/Model.mts` | Pure functions and constants the QML calls |
| `FingerprintModel.js` | upstream, unchanged | Fingerprint retry and availability model |
| `poster.sh` | upstream, unchanged | Poster frame for video wallpapers |
| `bin/snapshot` | Veil | Captures each monitor with `grim`, and cleans up |
| `NOTICE` | | Omarchy's MIT notice, shipped with the plugin |

Data flow on lock: `omarchy-shell lock lock` (or idle, or before suspend)
calls `beginLock`, which records `lockedAtMs`, starts `bin/snapshot`, and
queues the session lock; after the pre-lock wait the session locks, Hyprland
shows the surfaces (`secure`), and each `LockView` reveals. On a correct
password or fingerprint, `finishUnlock` holds the lock for the reverse fade,
then `releaseLock` unlocks.

Veil's hooks in `Service.qml` are listed in
[lock-service.md](lock-service.md); everything else there is upstream's, which
is what the `upstream-check` skill diffs.

## Sources

- `omarchy/arzaroth.veil/`
- Upstream: `shell/plugins/lock/` in basecamp/omarchy
