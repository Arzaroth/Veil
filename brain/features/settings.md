# Settings

Veil reads its own file, `~/.config/veil/config.toml`
(`$XDG_CONFIG_HOME/veil/config.toml` when set), the same place the user's
other tools keep theirs (TokenGauge, CodeGauge). The service watches the file
and applies a save at once, including on an open lock screen. FileView only
watches a file that existed when it was read, so while the file is missing
the service retries every `Model.SETTINGS_RETRY_MS` (5 s): a file created
later is picked up within that.

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
booleans, and `#` comments. Tables, arrays, floats, dates and multi-line
strings are reported line by line and skipped. In code the keys are camelCase
(`Settings.displayName`); `readSettings` maps them.

A wrong type, a value out of range, an unknown key (a typo such as
`timeformat`) or a line `parseToml` cannot read is logged as a warning
(`veil: ...` in `journalctl --user`) and the default is used. The rule is in
`CLAUDE.md` ("Settings are read, never trusted").

The defaults that come from the system are passed to `resolveSettings` in its
`Environment`: `clockFormat` (`omarchy.clock`'s `format`, read from
`shell.json` only for this, never written) and `fullName` (from
`getent passwd`). See [lock-screen.md](lock-screen.md).

Veil's settings are not read from `shell.json`. Before 0.2.0 the settings lived on Veil's
`plugins[]` entry there; see [../decisions.md](../decisions.md).

## Sources

- `src/Model.mts`: `parseToml`, `readSettings`, `resolveSettings`,
  `expandHome`, `configPath`, `shellConfigPath`, `barClockFormat`,
  `splitClockFormat`, `gecosName`, `DEFAULTS`, `SETTINGS_RETRY_MS`
- `omarchy/arzaroth.veil/Service.qml`: `configPath`, `settingsRead`,
  `settings`, `applySettings`, `settingsFile`, `settingsRetryTimer`
- `tests/js/settings.test.mjs`, `tests/js/toml.test.mjs`,
  `tests/js/clock.test.mjs`,
  `tests/qml/lockview.qml`
