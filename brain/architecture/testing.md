# Testing

| Suite | What it covers | Command |
|---|---|---|
| `tests/js/*.test.mjs` | `Model.js` and `FingerprintModel.js`, loaded with `createRequire`; the manifest | `pnpm test` |
| `tests/qml/lockview.qml` | The real `LockView` in a QML runtime: name, info line, branding file, reveal before and after `presented`, fade out on `unlocking`, charging icon, missing art | `tests/qml/run.sh` |
| `tests/snapshot/run.sh` | `bin/snapshot` with a fake `grim`: output lines, a failed output left out, 0700/0600 modes, replace, clean, no runtime dir | `tests/snapshot/run.sh` |
| `tests/install/run.sh` | `scripts/install.sh` with fake `omarchy-*` tools: call order, rollback, uninstall, refusals | `tests/install/run.sh` |

## The QML harness

`tests/qml/stubs/` stands in for what the shell provides: `qs.Commons`
(`Style`, `Color`, `I18n`, `Util`, `Border`), `qs.Ui` (`BackgroundMedia`,
`BorderSurface`), `Quickshell` (`env`), `Quickshell.Io` (`FileView`, read
through XHR), `Quickshell.Services.UPower`. `Check.qml` runs a list of steps a
timer tick apart and exits with the result. `Service.qml` is not loaded: PAM
and the Wayland lock have no stub, and the auth path is upstream's.

## Coverage

`scripts/coverage.sh` runs vitest with v8 coverage over `omarchy/**/*.js`;
`--check` fails under 98% of lines (`VEIL_COVERAGE_FLOOR`). QML is not
line-measured (see [decisions.md](../decisions.md)).

## Sources

- `tests/`, `scripts/coverage.sh`, `vitest.config.mjs`
