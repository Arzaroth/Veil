# Veil

Veil is a lock screen plugin for Omarchy's shell (omarchy-shell, Quickshell):
Omarchy's own `omarchy.lock` with a calmer face. Your windows blur into the
wallpaper on lock, the screen shows a clock, your name, battery and your
branding art, and unlocking plays the same fade in reverse. How it works lives
in `brain/` (start at `brain/BRAIN.md`); this file holds the rules a change can
break. **The brain is load-bearing (hard rule):** a change that makes a brain
doc wrong fixes that doc in the same branch, and the code wins when they
disagree. See "The brain (knowledge base)" below.

## The password path is Omarchy's, untouched (hard rule)

Veil changes what the lock looks like, never how it decides to unlock. The two
`PamContext`s (`omarchy-lock-password`, `omarchy-lock-fingerprint`),
`submitPassword`, `respondToPasswordPrompt`, `handlePasswordFailure` and the
fingerprint retry model in `FingerprintModel.js` stay as upstream wrote them.

- `finishUnlock()` runs only on `PamResult.Success`. It does not unlock: it sets
  `unlocking` and starts `unlockFadeTimer` (`Model.UNLOCK_FADE_MS`), and
  `releaseLock()` is the old `finishUnlock` body. Every visual of the unlock
  starts after authentication has succeeded, never before.
- While `unlocking`, input is off (`inputEnabled: lockRequested && !unlocking`)
  and a second success is ignored. A lock request during the fade
  (`beginLock`) stops the timer and clears `unlocking`, so the screen stays
  locked.
- A change that touches a `PamContext`, `lockRequested`, `sessionLock.locked`
  or `beginLock`'s guards is reviewed against upstream's file first
  (`.claude/skills/upstream-check`).

## Never leave the machine without a lock

- `scripts/install.sh` enables `arzaroth.veil` before it disables
  `omarchy.lock`, and disables Veil again if the stock lock will not turn off,
  so a half-done install leaves exactly one lock service. `--uninstall`
  enables the stock lock before it removes Veil. `tests/install/run.sh` asserts
  the call order.
- The pre-lock wait (`sessionLockStabilizeTimer`) is `Model.STABILIZE_MS`
  (150 ms) on stable screens, and upstream's 500 ms
  (`Model.HOTPLUG_STABILIZE_MS`) when a monitor changed in the last
  `HOTPLUG_WINDOW_MS` or changes during the wait. Upstream added the 500 ms in
  "Delay session lock during display hotplug" (omarchy `eb3cb5225`): locking
  while outputs come and go can leave a screen without a lock surface. Do not
  shorten the hotplug path.

## The snapshot is private and short-lived

The lock fades from a capture of each monitor taken during the pre-lock wait
(`bin/snapshot`, `grim`).

- Captures go to `$XDG_RUNTIME_DIR/arzaroth-veil/`, made with `umask 077`
  (directory 0700, files 0600). No runtime directory, no capture.
  `tests/snapshot/run.sh` checks both modes.
- The files are deleted `snapshotCleanTimer` (3 s) after the session locks and
  again when it unlocks (`dropSnapshots`). The lock surfaces keep the decoded
  image in memory for the unlock fade.
- A capture that finishes after the session locked is thrown away
  (`snapshotProc.onExited`), so a screen never jumps from the wallpaper to
  the windows halfway through the fade. That screen falls back to the
  wallpaper-only fade.

## The fade starts when the lock is on screen

`LockView.reveal` animates only once `presented` is true, which the service
binds to `sessionLock.secure`. The lock surfaces are created around 200 ms
before Hyprland shows them; a fade started at creation played mostly unseen
and read as a jump from the windows to a blurred wallpaper. The harness
(`tests/qml/lockview.qml`) asserts nothing is revealed before `presented`.

## Model.mjs is generated, and committed

`src/Model.mts` is the source; `pnpm build` compiles it to
`omarchy/arzaroth.veil/Model.mjs`, which the QML imports
(`import "Model.mjs" as Model`). The compiled file is committed so a clone
installs without Node. Edit the `.mts`, rebuild, and commit both; CI's `js`
job fails when they disagree. Never edit `Model.mjs` by hand.

## QML's engine accepts ES2018, not everything TypeScript emits

`tsconfig.json` targets ES2018 so `tsc` lowers newer syntax. QML's V4 engine
rejected `catch {}` without a binding (ES2019) with a syntax error, and a
`Model.mjs` that does not parse takes the whole lock view down with it. Do not
raise the target without loading the result in `tests/qml/run.sh`, which
imports `Model.mjs` the way the shell does.

## Settings are read, never trusted

`shell.json` is the user's file, edited by hand. `Model.readSettings` takes
Veil's `plugins[]` entry, keeps each key only if it has the right type and
range, and returns a problem line for everything else, which the service logs
as `veil: ...`. A broken file or a bad value never stops the lock: it falls
back to the default. `tests/js/settings.test.mjs` covers each rule.

## Lock services load on a shell restart

omarchy-shell hot-reloads plugin files, but a `service` plugin's instance only
changes on `omarchy-restart-shell`. After editing the QML, run
`scripts/install.sh` (it restarts the shell) before judging the change.
`omarchy-shell lock preview` shows the view without locking; it has no
snapshot and no unlock fade.

## The brain (knowledge base)

`brain/` describes how Veil works; keep it true. A change that makes a doc
wrong fixes the doc in the same branch, as its own `docs` layer. New feature:
a `brain/features/` doc plus its index rows. New rule a change could break: a
section here, naming the test that asserts it. Use the `brain` skill to
navigate and maintain it.

## Conventions

- Commits: `[<branch>] type(scope): subject`, layered (mechanical, then
  behaviour, then tests and docs), each one green. End with the
  `Co-Authored-By` trailer.
- `CHANGELOG.md` `[Unreleased]` gets an entry for anything a user sees, in the
  same branch.
- Gate, all green before a commit:

  ```bash
  pnpm typecheck
  pnpm build && git diff --exit-code -- omarchy/
  pnpm test
  scripts/coverage.sh --check
  tests/qml/run.sh
  tests/snapshot/run.sh
  tests/install/run.sh
  shellcheck omarchy/arzaroth.veil/bin/snapshot omarchy/arzaroth.veil/poster.sh scripts/*.sh tests/**/*.sh
  ```

  plus `qmllint` on the QML (a `[syntax]` diagnostic is the failure; see
  `ci.yml`).
- Line coverage floor: 98% over `src/**/*.mts` and the plugin's hand-written
  JS (`scripts/coverage.sh --check`, CI job `coverage`). Logic that can live in
  `src/Model.mts` lives there, so it is typed and measured; the QML is driven by
  the harness.
- Releases: the `release` skill. Upstream drift: the `upstream-check` skill.
- No em-dashes in docs or commits.
