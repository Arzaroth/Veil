# Decisions

The non-obvious decisions and why. Decisions with real alternatives are
numbered; smaller ones are bullets.

## Shape

### 0001 Fork omarchy.lock rather than wrap it

**Decision.** Veil is a copy of `omarchy.lock` (via `omarchy plugin clone`)
with its view replaced and small hooks in `Service.qml`, not a separate
overlay on top of the stock lock.

**Why.** Only the lock service may draw on the `WlSessionLockSurface`, and the
fade needs the surface. A copy keeps upstream's authentication code verbatim.

**Rejected.** An overlay layer-shell window: the session lock hides
everything but its own surfaces. hello-lock's approach, the same fork with far
more on top: Veil wants a quiet lock.

**Cost.** Upstream fixes have to be carried over; the `upstream-check` skill
exists for that.

### 0002 Start the fade on secure

**Decision.** `LockView.reveal` starts when `presented` turns true, bound to
`sessionLock.secure`, not when the view is created.

**Why.** The surfaces are created about 200 ms before Hyprland shows them
(`session-locked` then `secure` in the log). With an ease-out curve the first
200 ms are most of the movement, so the fade looked like a jump. The fade in
is now 700 ms, ease-in-out.

### 0003 Capture with grim during the pre-lock wait

**Decision.** `bin/snapshot` runs `grim` per output while the pre-lock wait
runs, into `$XDG_RUNTIME_DIR`; a capture that lands after the lock is dropped.

**Why.** Inside the lock a screencopy would capture the lock itself, so the
capture has to happen before. The wait was already there; three outputs take
about 70 ms, inside the 150 ms.

**Rejected.** Quickshell's `ScreencopyView` in the lock view: it would see the
lock surface. Holding the lock until the capture is done: it would slow every
lock, including the one before suspend.

### 0004 TypeScript compiled to an ES module, output committed

**Decision.** Veil's logic is `src/Model.mts`, compiled by `tsc` to
`omarchy/arzaroth.veil/Model.mjs`, which QML imports as an ECMAScript module.
The compiled file is committed; CI fails if it is stale.

**Why.** QML only runs JavaScript, so the choice is what produces it. Types
catch bad input once settings come from a file the user edits. Committing the output
keeps the install a plain copy with no Node on the machine.

**Rejected.** Plain JS (no types). A C++ QML plugin: built against the exact
Qt that Quickshell runs, and a mismatch after an update means no lock service.
A Rust binary called per refresh: a process launch inside the lock path.
Building at install time: Node becomes a runtime requirement of a lock screen.

## Bullets

- Settings live in Veil's own `~/.config/veil/config.toml`, not on its
  `plugins[]` entry in `shell.json` (where 0.1.0 kept them): the user's other
  tools (TokenGauge, CodeGauge) each keep a `config.toml` of their own, the
  settings survive `omarchy plugin disable`, and the shell never rewrites the
  file. The cost is a small TOML reader in `Model.mts` and a retry while the
  file is missing.
- The blank delay is `blank_after` in seconds, like `shell.json`'s own `idle`
  keys, not `idleMs` as the QML property is named.
- `tsconfig.json` targets ES2018: QML's engine rejected ES2019's `catch {}`.

- The pre-lock wait is 150 ms on stable screens and upstream's 500 ms around a
  hotplug, rather than 500 ms always or no wait: see
  [features/timing.md](features/timing.md).
- Blanking waits 30 s, not upstream's 5 s: the lock screen is meant to be
  looked at.
- The text colour is a tint of the theme's, not a fixed white: it keeps the
  theme's hue on light and dark themes.
- Coverage counts `src/**/*.mts` and `FingerprintModel.js`. No tool measures
  QML lines; logic moves to `src/Model.mts` so it is counted, and the QML is
  driven by the harness.
- `FingerprintModel.js` stays byte for byte upstream's, `module.exports` guard
  included, so the upstream diff stays empty.
- The plugin installs by copy (`scripts/install.sh`), like TailGauge and
  TokenGauge, rather than `omarchy plugin add`: the repository root holds the
  docs and tests, and the plugin is a subfolder. Releases make the copy work
  without a clone: the same script, fed a verified archive.
- The name: a veil is drawn over the desktop, the blur, and lifted on unlock.
