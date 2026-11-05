# Lock service

`Service.qml`: upstream's lock service plus Veil's hooks. The rules a change
must keep are in `CLAUDE.md` ("The password path is Omarchy's", "Never leave
the machine without a lock", "The snapshot is private").

## Lock

1. `beginLock()` refuses without the password PAM config, stops any unlock
   hold in progress, records `lockedAtMs` and calls `captureSnapshots()` on a
   fresh lock, then `queueSessionLock()`.
2. `queueSessionLock()` sets the pre-lock wait from
   `Model.stabilizeDelayMs(now, screensChangedAtMs)`: 150 ms, or 500 ms if a
   monitor changed in the last 2 s. `onScreensChanged` records the change and,
   if the wait is running, restarts it at 500 ms.
3. `requestSessionLock()` sets `sessionLock.locked = true` once the wait is
   over and a real screen exists. `secure` follows when Hyprland shows the
   surfaces; each `LockView` gets `presented: sessionLock.secure`.

## Snapshots

- `captureSnapshots()` bumps `snapshotEpoch`, clears `snapshotFiles`, and runs
  `bin/snapshot capture <epoch> <outputs...>` (`Model.snapshotCommand`,
  `Model.screenNames`).
- `snapshotProc.onExited` keeps the result (`Model.parseSnapshots`, output
  name to file) only if the epoch matches, the lock is still requested and
  the session is not locked yet. Otherwise it is dropped, and cleaned if the
  lock was abandoned.
- `snapshotCleanTimer` deletes the files 3 s after the session locks;
  `dropSnapshots()` clears the map and the files when it unlocks.
- Each lock surface passes `snapshotFiles[screen.name]` to its view.

## Unlock

Upstream's PAM flows decide. On `PamResult.Success` (password or fingerprint)
`finishUnlock()` sets `unlocking` and starts `unlockFadeTimer`
(`Model.UNLOCK_FADE_MS`, 450 ms); input is off meanwhile. `releaseLock()` is
upstream's unlock: it clears the request, stops the timers and sets
`sessionLock.locked = false`. When the session reports unlocked, the hold and
the snapshots are cleared.

## Settings

A `FileView` watches `configPath` (`shell.json`); each load goes through
`Model.readSettings` (problems logged as `veil: ...`) into `settingsRead`, and
`settings` is `Model.resolveSettings` of it with the user and home. Both the
lock surfaces' views and the preview get `settings`. See
[../features/settings.md](../features/settings.md).

## Blanking

`idleBlankTimer.idleMs` is `settings.blankAfterMs`, 30 s by default (upstream 5 s): without input for that long
the displays go off. `resumeMs` (15 s after a resume) is upstream's.

## Sources

- `omarchy/arzaroth.veil/Service.qml`: `beginLock`, `queueSessionLock`,
  `requestSessionLock`, `captureSnapshots`, `dropSnapshots`, `finishUnlock`,
  `releaseLock`, `snapshotProc`, `snapshotCleanTimer`, `unlockFadeTimer`,
  `idleBlankTimer`
- `src/Model.mts`, `omarchy/arzaroth.veil/bin/snapshot`
