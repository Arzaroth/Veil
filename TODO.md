# TODO

Small work, and the decisions to take before each milestone.

## Small

- The Omarchy wordmark fallback reads `$OMARCHY_PATH/logo.svg`; the QML
  harness has no logo fixture, so its first run logs a missing-file warning.
- The date line is still the weakest text over a bright wallpaper; consider a
  stronger shadow on the date alone.
- `poster.sh` (video wallpaper poster) is upstream's and untested here.
- The service's settings wiring (`settingsFile`, `shellConfigFile`,
  `fullNameProc`, `rereadMissingConfig`) runs only in the live shell: the QML
  harness loads `LockView` alone and has no `Process` stub.
- The bar localizes the digits of the `ww` week number (`I18n.formatNumber`);
  the lock prints ASCII digits.

## Decisions

- QML is not line-measured: no tool gives line coverage for QML, so the 98%
  floor covers `src/**/*.mts` and `FingerprintModel.js`, and the harness drives the QML. Revisit if
  Qt ships QML coverage.
