# Settings

Veil reads its own file, `~/.config/veil/config.toml`
(`$XDG_CONFIG_HOME/veil/config.toml` when set), the same place the user's
other tools keep theirs (TokenGauge, CodeGauge). The service watches the file
and applies a save at once, including on an open lock screen. FileView only
watches a file that existed when it was read, so a missing file is read again
when a lock is requested or the preview opens (`rereadMissingConfig`): a file
created later applies from the next lock. Polling it instead would log a
Quickshell warning per attempt for every user without a config.

| Key | Type | Default |
|---|---|---|
| `display_name` | non-empty string | the GECOS full name, else the login capitalized |
| `time_format` | non-empty string, Qt format | the bar clock's time, else `HH:mm` |
| `date_format` | non-empty string, Qt format | the bar clock's date, else `dddd d MMMM` |
| `branding` | boolean | `true` |
| `branding_path` | non-empty string, `~` expanded | `~/.config/omarchy/branding/about.txt` |
| `blank_after` | whole seconds, 5 to 3600 | `30` |

The file is TOML, read by `Model.parseToml`, which takes only what Veil
needs: top-level `key = value` with basic or literal strings, integers and
booleans, and `#` comments. Any line starting with `[` opens a table, which
is reported once and its keys skipped. A multi-line string is reported and
skipped up to its closing quotes. Arrays, floats and dates are reported and
skipped line by line. In code the keys are camelCase
(`Settings.displayName`); `readSettings` maps them.

A wrong type, a value out of range, an unknown key (a typo such as
`timeformat`) or a line `parseToml` cannot read is logged as a warning
(`veil: ...` in `journalctl --user`) and the default is used. The rule is in
`CLAUDE.md` ("Settings are read, never trusted").

The defaults that come from the system are passed to `resolveSettings` in its
`Environment`: `clockFormat` (`omarchy.clock`'s `format` under
`bar.layout.<section>`, read from `shell.json` only for this, never written)
and `fullName` (from `getent passwd`). The bar's `verticalFormat` is not
followed: the lock clock is horizontal. See [lock-screen.md](lock-screen.md).

Veil's settings are not read from `shell.json`. Before 0.2.0 they lived on
Veil's `plugins[]` entry there (see [../decisions.md](../decisions.md)); an
entry that still carries keys logs one `veil:` warning naming them
(`Model.staleShellSettings`).

## Sources

- `src/Model.mts`: `parseToml`, `readSettings`, `resolveSettings`,
  `expandHome`, `configPath`, `shellConfigPath`, `barClockFormat`,
  `splitClockFormat`, `staleShellSettings`, `gecosName`, `DEFAULTS`
- `omarchy/arzaroth.veil/Service.qml`: `configPath`, `settingsRead`,
  `settings`, `applySettings`, `settingsFile`, `shellConfigFile`,
  `fullNameProc`, `rereadMissingConfig`, `warnStaleShellSettings`
- `tests/js/settings.test.mjs`, `tests/js/toml.test.mjs`,
  `tests/js/clock.test.mjs` (with Omarchy's shipped `shell.json` as a
  fixture), `tests/qml/lockview.qml`
