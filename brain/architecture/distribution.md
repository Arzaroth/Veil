# Distribution

omarchy-shell loads third-party plugins from `~/.config/omarchy/plugins/<id>/`
and refuses symlinks inside a plugin, so the plugin is copied there.

`scripts/install.sh`:

1. Checks for `omarchy-shell` and the `omarchy-plugin-*` tools.
2. Validates the manifest (`omarchy-plugin-validate`).
3. Replaces `~/.config/omarchy/plugins/arzaroth.veil` with a copy of
   `omarchy/arzaroth.veil`, and asks the shell to rescan.
4. Enables `arzaroth.veil`, then disables `omarchy.lock`; if that fails it
   disables Veil again.
5. Restarts the shell, since a lock service only loads on a restart
   (`--no-restart` skips it).

`--uninstall` enables `omarchy.lock`, disables Veil, removes the folder and
restarts.

## From a release

Without a checkout around it (piped from `curl`), or with `--release` or
`--version X.Y.Z`, the script:

1. Reads the latest tag from the GitHub API (`releases/latest`), or uses the
   given version.
2. Downloads `veil-X.Y.Z.tar.gz` and `SHA256SUMS` into a temporary folder and
   checks the archive; a mismatch stops it before anything is touched.
3. Runs `scripts/install.sh` from the extracted archive, which is a checkout
   for that purpose, then removes the folder.

`VEIL_API_URL` and `VEIL_DOWNLOAD_URL` point it elsewhere; the tests use
`file://` URLs.

## Releases

`scripts/package.sh` builds `veil-X.Y.Z.tar.gz` (the plugin, `scripts/install.sh`,
`LICENSE`, `README.md`, `CHANGELOG.md`) and `SHA256SUMS`, reproducibly from the
commit time. `.github/workflows/release.yml` runs on a `vX.Y.Z` tag: it checks
the tag against `package.json` and `manifest.json` and that `CHANGELOG.md` has
the section, runs the unit gate, packages, and publishes the GitHub release
with that section as the notes. Tags reach GitHub through the Forgejo mirror.

## Sources

- `scripts/install.sh`, `scripts/package.sh`, `.github/workflows/release.yml`
- `tests/install/run.sh`, `tests/package/run.sh`
