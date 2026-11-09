# Glossary

- **Lock service** - the `service` plugin that owns the session lock;
  `arzaroth.veil` when Veil is installed, `omarchy.lock` otherwise. Only one
  may be enabled. Avoid: locker, lock plugin (ambiguous with the view).
- **Upstream** - Omarchy's `shell/plugins/lock/` (`omarchy.lock`), the code
  Veil is built on. See [architecture/overview.md](architecture/overview.md).
  Avoid: stock (fine in prose, not in code), original.
- **Pre-lock wait** - the delay between a lock request and
  `sessionLock.locked = true` (`sessionLockStabilizeTimer`). See
  [features/timing.md](features/timing.md). Avoid: stabilization delay, lock
  delay.
- **Snapshot** - the capture of one monitor taken during the pre-lock wait,
  one file per output. See [features/transitions.md](features/transitions.md).
  Avoid: screenshot, screen grab.
- **Presented** - the lock surfaces are on screen, i.e. `sessionLock.secure`.
  The reveal waits for it. Avoid: shown, visible.
- **Reveal** - `LockView.reveal`, 0 to 1: how far the lock has faded in.
  Avoid: progress, opacity.
- **Unlock hold** - the `Model.UNLOCK_FADE_MS` between a successful
  authentication and `releaseLock()`. Avoid: unlock delay.
- **Blanking** - turning the displays off on the lock screen after `idleMs`
  without input. Avoid: DPMS (the mechanism, not the feature), sleep.
- **Ink** - `LockView.ink`, the theme's lock text colour tinted 60% towards
  white, used for the clock, date, name, info line and art.
- **Branding art** - the text art at the bottom, read from `branding_path`.
  Off with `branding = false`.
  Avoid: logo (that is the wordmark fallback).
- **Settings** - the keys in `~/.config/veil/config.toml`, read by
  `Model.readSettings`. See [features/settings.md](features/settings.md).
  Avoid: options, preferences.
