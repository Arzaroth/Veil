# Veil

[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE)

A calm lock screen for [Omarchy](https://omarchy.org). Your windows blur into
the wallpaper as the screen locks, a clock, your name, your battery and your
branding art wait on the other side, and unlocking plays the same fade in
reverse. Password and fingerprint checks are Omarchy's own, unchanged.

**Status:** usable, daily-driven on Omarchy 4.5.

## What it does

- **Lock**: each monitor is captured just before the lock, so the lock opens on
  your windows, which blur and dissolve into the blurred wallpaper while the
  clock and the rest fade in.
- **Locked**: a large clock and the date, your name above the password field,
  a quiet line with the battery and how long the screen has been locked, and
  the braille art from `~/.config/omarchy/branding/about.txt` (the one
  fastfetch shows) at the bottom, in your theme's colours.
- **Wrong password**: a short shake of the field.
- **Unlock**: the blur clears back to your windows before the live desktop
  takes over.
- **Faster to lock**: 150 ms between the request and the lock instead of
  500 ms, unless monitors are being plugged or unplugged.
- **Stays lit longer**: 30 s before the screens blank, instead of 5 s.

## Install

Needs Omarchy 4.5 or newer.

```bash
curl -fsSL https://raw.githubusercontent.com/Arzaroth/Veil/master/scripts/install.sh | bash
```

That downloads the latest release, checks it against the release's
`SHA256SUMS`, copies the plugin into `~/.config/omarchy/plugins/`, enables
it, disables Omarchy's `omarchy.lock`, and restarts the shell (lock services
only load on a restart). Run it again to update. Options go after
`bash -s --`: `--version X.Y.Z` for a given release, `--no-restart`.

From a checkout, `scripts/install.sh` installs that checkout instead
(`--release` to install the latest release from it).

```bash
omarchy-shell lock preview      # the lock screen without locking (click to close)
scripts/install.sh --uninstall  # remove Veil and give the lock back to omarchy.lock
```

If the lock ever misbehaves, switch to a TTY (`Ctrl+Alt+F2`) and run
`curl -fsSL https://raw.githubusercontent.com/Arzaroth/Veil/master/scripts/install.sh | bash -s -- --uninstall`.

## Configuration

Settings live in `~/.config/veil/config.toml` (`$XDG_CONFIG_HOME/veil/` when
set). Create it when you want to change something; changes apply as soon as
the file is saved, even on an open lock screen.

```toml
display_name = "Arzaroth"
time_format = "HH:mm"
date_format = "dddd d MMMM"
branding = true
branding_path = "~/.config/omarchy/branding/about.txt"
blank_after = 30
```

| Key | Default | |
| --- | --- | --- |
| `display_name` | your full name from `/etc/passwd`, else your login capitalized | the name above the field |
| `time_format` | the bar clock's time, else `HH:mm` | Qt date format |
| `date_format` | the bar clock's date, else `dddd d MMMM` | Qt date format, in your locale; `ww` is the ISO week |
| `branding` | `true` | `false` hides the art and the Omarchy wordmark |
| `branding_path` | `~/.config/omarchy/branding/about.txt` | text art at the bottom; point it at your own file to replace Omarchy's. Missing or empty shows the Omarchy wordmark |
| `blank_after` | `30` | seconds without input before the screens blank, 5 to 3600 |

Without `time_format` and `date_format`, the lock follows the bar clock's
format (the one right-click cycles through): `ddd d MMM h:mm AP` gives a
`h:mm AP` clock over `ddd d MMM`. Seconds are left out. The date is taken only
when the bar shows a day and a month, so the stock `dddd HH:mm` keeps Veil's
`dddd d MMMM`.

Every key is optional. A value of the wrong type, a key Veil does not know or
a line it cannot read is ignored with a warning in `journalctl --user`
(`veil: ...`). Veil reads flat `key = value` lines only: no tables, arrays or
multi-line strings. A file created while the shell runs applies from the next
lock.

Coming from 0.1.0: settings on Veil's entry in `~/.config/omarchy/shell.json`
are no longer read, and the journal says which ones to move.

## How it works

Veil is Omarchy's `omarchy.lock` service with its view replaced. The session
lock, both PAM flows and the fingerprint retry logic are upstream's. Veil adds
a capture of each monitor during the pre-lock wait, a view that fades from it
once Hyprland shows the lock, and a 450 ms hold after a successful unlock so
the reverse fade can play. Details in [brain/BRAIN.md](brain/BRAIN.md).

## Development

```bash
mise install && pnpm install
pnpm typecheck && pnpm test  # src/Model.mts and FingerprintModel.js
pnpm build                   # compile src/Model.mts to the plugin's Model.mjs (commit it)
scripts/coverage.sh --check  # 98% line floor
tests/qml/run.sh             # LockView in a QML runtime, shell modules stubbed
tests/snapshot/run.sh        # the capture helper against a fake grim
tests/install/run.sh         # the install script against fake omarchy tools and a local release
tests/package/run.sh         # the release archive
```

See [CLAUDE.md](CLAUDE.md) for the rules a change must keep.

## Licence

MIT. Veil carries code from Omarchy's lock screen under Omarchy's MIT licence;
see [omarchy/arzaroth.veil/NOTICE](omarchy/arzaroth.veil/NOTICE).
