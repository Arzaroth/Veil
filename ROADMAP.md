# Roadmap

Where Veil may go next. Order is not priority. Small fixes and chores go in
[TODO.md](TODO.md). When a milestone ships, its entry leaves this file and its
doc lands in `brain/features/`.

## M0 - Foundation

- [x] The lock: snapshot fade on lock and unlock, clock, name, battery, lock
  time, branding art, 150 ms pre-lock wait, 30 s before blanking.
- [x] Repository on Forgejo with the GitHub mirror, CI (unit tests, QML lint
  and harness, shellcheck, helper and install tests), 98% line coverage gate.
- [x] `scripts/install.sh` and `--uninstall`.
- [x] The brain, and the `brain`, `feature-treatment`, `release` and
  `upstream-check` skills.
- [x] Settings in `shell.json` (was M1, see `brain/features/settings.md`).

## M2 - Releases

Tagged releases with the plugin folder as an archive, and an installer that
fetches the latest one, so installing does not need a clone. Decided: the
install script stays the one way to swap the lock, the archive only replaces
the checkout.

## Later

- An info line item for unread notifications, read from omarchy-shell's
  notification service.
- A per-monitor layout: the clock and field on the focused monitor only, the
  others showing the blurred snapshot and the art.

## Not planned

- Any change to how authentication works (PAM configs, retry logic). Veil
  follows `omarchy.lock`.
- Typing effects, sounds and unlock animations in the style of hello-lock. Veil
  stays quiet on purpose.
