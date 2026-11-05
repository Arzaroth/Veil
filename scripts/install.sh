#!/usr/bin/env bash
# Install Veil into omarchy-shell from this checkout, in place of Omarchy's
# own lock screen (omarchy.lock).
#
#   scripts/install.sh               copy the plugin, enable it, restart the shell
#   scripts/install.sh --uninstall   remove it and give the lock back to omarchy.lock
#   scripts/install.sh --no-restart  leave the shell running (the lock service
#                                    only loads on the next restart)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

PLUGIN_ID="arzaroth.veil"
STOCK_ID="omarchy.lock"
PLUGIN_SRC="$REPO_DIR/omarchy/$PLUGIN_ID"
PLUGIN_DIR="$HOME/.config/omarchy/plugins/$PLUGIN_ID"

if [[ -t 1 ]]; then B="\033[0;34m"; G="\033[0;32m"; Y="\033[0;33m"; R="\033[0;31m"; Z="\033[0m"; else B=""; G=""; Y=""; R=""; Z=""; fi
info()    { printf '%b\n' "${B}$*${Z}"; }
success() { printf '%b\n' "${G}$*${Z}"; }
warn()    { printf '%b\n' "${Y}$*${Z}"; }
fail()    { printf '%b\n' "${R}$*${Z}" >&2; }

MODE=install
RESTART=1
while [[ $# -gt 0 ]]; do
  case "$1" in
  --uninstall) MODE=uninstall ;;
  --no-restart) RESTART=0 ;;
  -h | --help)
    sed -n '2,9p' "${BASH_SOURCE[0]}" | sed 's/^# \?//'
    exit 0
    ;;
  *) fail "unknown option: $1"; exit 1 ;;
  esac
  shift
done

for tool in omarchy-shell omarchy-plugin-validate omarchy-plugin-enable omarchy-plugin-disable; do
  command -v "$tool" >/dev/null 2>&1 || { fail "$tool not found - Veil needs Omarchy 4.5 or newer."; exit 1; }
done

restart_shell() {
  if [[ $RESTART -eq 0 ]]; then
    warn "Shell not restarted: the lock service changes on the next 'omarchy-restart-shell'."
    return
  fi
  info "Restarting the shell so the lock service reloads..."
  omarchy-restart-shell >/dev/null 2>&1 || warn "Could not restart the shell - run 'omarchy-restart-shell' yourself."
}

if [[ $MODE == uninstall ]]; then
  info "Giving the lock back to $STOCK_ID..."
  omarchy-plugin-enable "$STOCK_ID"
  omarchy-plugin-disable "$PLUGIN_ID" >/dev/null 2>&1 || true
  rm -rf "$PLUGIN_DIR"
  omarchy-shell -q shell rescanPlugins >/dev/null 2>&1 || true
  restart_shell
  success "Veil removed."
  exit 0
fi

[[ -d $PLUGIN_SRC ]] || { fail "plugin source not found: $PLUGIN_SRC"; exit 1; }

info "Validating the plugin manifest..."
omarchy-plugin-validate "$PLUGIN_SRC"

info "Installing the plugin to $PLUGIN_DIR"
mkdir -p "$(dirname "$PLUGIN_DIR")"
rm -rf "$PLUGIN_DIR"
cp -aL "$PLUGIN_SRC" "$PLUGIN_DIR"
omarchy-shell -q shell rescanPlugins >/dev/null 2>&1 || true

info "Enabling $PLUGIN_ID..."
omarchy-plugin-enable "$PLUGIN_ID"

if ! omarchy-plugin-disable "$STOCK_ID"; then
  fail "Could not disable $STOCK_ID; disabling $PLUGIN_ID again so only one lock service runs."
  omarchy-plugin-disable "$PLUGIN_ID" || true
  exit 1
fi

restart_shell

success "Done."
echo
echo "Try it:     omarchy-shell lock preview   (click to close)"
echo "Lock:       omarchy system lock"
echo "Undo:       scripts/install.sh --uninstall"
