# Stack

- **QML (Qt 6)** on **Quickshell**, loaded by omarchy-shell as a `service`
  plugin (`manifest.json`, `kinds: ["service"]`, `keepLoaded: true`). Imports:
  `Quickshell`, `Quickshell.Io`, `Quickshell.Services.Pam`,
  `Quickshell.Services.UPower`, `Quickshell.Wayland`, `QtQuick.Effects`, and
  omarchy-shell's `qs.Commons` and `qs.Ui`.
- **TypeScript** 5.7 (`tsconfig.json`, strict, target ES2018 for QML's
  engine): `src/Model.mts`, Veil's logic,
  compiled to the ES module `omarchy/arzaroth.veil/Model.mjs` that QML imports.
- **JavaScript**: `FingerprintModel.js`, upstream's, a plain script with a
  `module.exports` guard so Node can load it for tests.
- **Shell**: `bin/snapshot` (bash, `grim`), `poster.sh` (upstream's, video
  wallpaper poster), `scripts/*.sh`.
- **Node 22 and pnpm 10.33.0** for the tests only (`.mise.toml`,
  `packageManager`); vitest 5 with the v8 coverage provider, which reads the
  `.mts` directly. `package.json` has no `"type"`, so `FingerprintModel.js`
  loads as CommonJS; the tests are `.mjs`.
- **shellcheck 0.11.0** pinned in `.mise.toml`.
- Runtime needs: Omarchy 4.5 or newer, Hyprland (ext-session-lock), `grim`.

## Sources

- `omarchy/arzaroth.veil/manifest.json`, `package.json`, `.mise.toml`,
  `tsconfig.json`, `vitest.config.mjs`
