# Operations

## The gate

The commands in `CLAUDE.md` Conventions; CI runs the same set.

| CI job (`.github/workflows/ci.yml`) | What it runs |
|---|---|
| `js` | `pnpm typecheck`, `pnpm build` with no diff under `omarchy/` (the committed `Model.mjs` is fresh), `pnpm test` |
| `qml` | `qmllint` over `omarchy/**/*.qml` (fails on a `[syntax]` diagnostic only, since the shell's imports cannot resolve in CI), then `tests/qml/run.sh` |
| `shell` | shellcheck, `tests/snapshot/run.sh`, `tests/install/run.sh`, `tests/package/run.sh` |
| `coverage` | `scripts/coverage.sh --check` (98% of lines over `src/**/*.mts` and the plugin's hand-written JS) |

CI runs on pull requests and on pushes to `master`, on GitHub Actions (the
mirror). Forgejo Actions are off.

## Working on the QML

Lock services only load on a shell restart. The loop is: edit, then
`scripts/install.sh` (copies the plugin and restarts the shell), then
`omarchy-shell lock preview`, or a real lock for the snapshot and unlock fade.
Lock events are logged as `omarchy lock <time> <event>` in
`journalctl --user` (`lock-requested`, `session-locked`, `secure`, `unlocked`).

## Releasing

The `release` skill: bump `package.json` and `manifest.json`, close the
changelog section, tag `vX.Y.Z`, push to Forgejo. The mirror carries the tag to
GitHub, where `.github/workflows/release.yml` packages and publishes the
release (see [architecture/distribution.md](architecture/distribution.md)).

## Upstream

`Service.qml`, `FingerprintModel.js` and `poster.sh` track Omarchy's
`shell/plugins/lock/`. The `upstream-check` skill compares them with the
baseline in `.claude/skills/upstream-check/BASELINES.md`.

## Hosts

`origin` is Forgejo (`ssh://git@box.arzaroth.com/Arzaroth/Veil.git`); it
push-mirrors to `github.com/Arzaroth/Veil` on every commit and every 8 h. Never
push to GitHub directly. If a push does not reach GitHub, force it with
`smith api -X POST repos/Arzaroth/Veil/push_mirrors-sync`.

## Sources

- `.github/workflows/ci.yml`, `.github/workflows/release.yml`,
  `scripts/coverage.sh`, `scripts/install.sh`, `scripts/package.sh`
