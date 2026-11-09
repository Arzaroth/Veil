# Settings

Veil reads its own entry in `~/.config/omarchy/shell.json`
(`$XDG_CONFIG_HOME/omarchy/shell.json` when set): the object in `plugins[]`
whose `id` is `arzaroth.veil`. The service watches the file and applies a save
at once, including on an open lock screen.

| Key | Type | Default |
|---|---|---|
| `displayName` | non-empty string | the login, capitalized |
| `timeFormat` | non-empty string, Qt format | `HH:mm` |
| `dateFormat` | non-empty string, Qt format | `dddd d MMMM` |
| `brandingPath` | non-empty string, `~` expanded | `~/.config/omarchy/branding/about.txt` |
| `branding` | boolean | `true` |
| `blankAfter` | whole seconds, 5 to 3600 | `30` |

A wrong type, a value out of range, an unknown key (a typo such as
`timeformat`) or a file that is not JSON is logged as a warning
(`veil: ...` in `journalctl --user`) and the default is used. The rule is in
`CLAUDE.md` ("Settings are read, never trusted").

The shell keeps extra keys on a plugin's entry when it rewrites `shell.json`
(enable, bar moves), and removes the entry when the plugin is disabled, so
`omarchy plugin disable arzaroth.veil` forgets the settings.

## Sources

- `src/Model.mts`: `readSettings`, `resolveSettings`, `expandHome`,
  `configPath`, `DEFAULTS`
- `omarchy/arzaroth.veil/Service.qml`: `configPath`, `settingsRead`,
  `settings`, `applySettings`, the `FileView`
- `tests/js/settings.test.mjs`, `tests/qml/lockview.qml`
