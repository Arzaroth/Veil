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
restarts. Updating is pulling and running the script again.

## Sources

- `scripts/install.sh`, `tests/install/run.sh`
