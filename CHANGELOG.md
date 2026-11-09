# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Settings moved from Veil's entry in `~/.config/omarchy/shell.json` to
  Veil's own `~/.config/veil/config.toml`, with snake_case keys:
  `display_name`, `time_format`, `date_format`, `branding_path`,
  `blank_after`. Settings left in `shell.json` are no longer used: the journal
  names them (`veil: ...`) so you can move them. Disabling the plugin no
  longer forgets them.
- Without `display_name`, the name is your full name from `/etc/passwd`
  (`chfn -f`), and your capitalized login only when that is empty.

### Added

- `branding = false` hides the art at the bottom, and the Omarchy wordmark
  with it. To show your own art instead of Omarchy's, point `branding_path`
  at it.
- Without `time_format` and `date_format`, the clock and the date follow the
  bar clock's format, seconds left out. The date follows only when the bar
  shows a day and a month, so the stock bar keeps the full date. `ww` in a
  date format shows the ISO week, as on the bar.

## [0.1.0] - 2026-11-05

### Added

- The lock opens on a capture of your windows, which blur and dissolve into
  the blurred wallpaper while the clock and the rest fade in; unlocking plays
  the same fade in reverse.
- A large clock and the date, your name above the password field, a line with
  the battery and how long the screen has been locked, and the branding art
  from `~/.config/omarchy/branding/about.txt` at the bottom.
- A short shake of the password field on a wrong password.
- `scripts/install.sh` to swap Omarchy's lock for Veil, and `--uninstall` to
  swap it back.
- Settings on Veil's entry in `~/.config/omarchy/shell.json`: `displayName`,
  `timeFormat`, `dateFormat`, `brandingPath` and `blankAfter` (seconds),
  applied as soon as the file is saved. Bad values and unknown keys are
  ignored with a warning in the journal.
- Releases: each version is published on GitHub as `veil-x.y.z.tar.gz` with
  `SHA256SUMS`, and `install.sh` piped from `curl` installs the latest one
  (or `--version x.y.z`) after checking its checksum, no clone needed.

### Changed

- The screen locks 150 ms after the request instead of 500 ms, unless monitors
  are being plugged or unplugged.
- The lock screen stays lit for 30 s before blanking, instead of 5 s.
- Text on the lock screen uses a lighter tint of the theme colour, so it reads
  over bright wallpapers.
