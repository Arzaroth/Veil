#!/usr/bin/env bash
# Install Veil into omarchy-shell in place of Omarchy's own lock screen
# (omarchy.lock), from this checkout or, without one, from a GitHub release.
#
#   scripts/install.sh                   copy the plugin, enable it, restart the shell
#   scripts/install.sh --release         install the latest release instead of this checkout
#   scripts/install.sh --version X.Y.Z   install that release
#   scripts/install.sh --uninstall       remove it and give the lock back to omarchy.lock
#   scripts/install.sh --no-restart      leave the shell running (the lock service
#                                        only loads on the next restart)
#
#   curl -fsSL https://raw.githubusercontent.com/Arzaroth/Veil/master/scripts/install.sh | bash
set -euo pipefail

SELF="${BASH_SOURCE[0]:-}"
REPO_DIR=""
if [[ -n $SELF && -f $SELF ]]; then
  REPO_DIR="$(cd "$(dirname "$SELF")/.." && pwd)"
fi

API_URL="${VEIL_API_URL:-https://api.github.com/repos/Arzaroth/Veil}"
DOWNLOAD_URL="${VEIL_DOWNLOAD_URL:-https://github.com/Arzaroth/Veil/releases/download}"

PLUGIN_ID="arzaroth.veil"
STOCK_ID="omarchy.lock"
PLUGIN_SRC="${REPO_DIR:-/nonexistent}/omarchy/$PLUGIN_ID"
PLUGIN_DIR="$HOME/.config/omarchy/plugins/$PLUGIN_ID"

if [[ -t 1 ]]; then B="\033[0;34m"; G="\033[0;32m"; Y="\033[0;33m"; R="\033[0;31m"; Z="\033[0m"; else B=""; G=""; Y=""; R=""; Z=""; fi
info()    { printf '%b\n' "${B}$*${Z}"; }
success() { printf '%b\n' "${G}$*${Z}"; }
warn()    { printf '%b\n' "${Y}$*${Z}"; }
fail()    { printf '%b\n' "${R}$*${Z}" >&2; }

MODE=install
RESTART=1
FROM_RELEASE=0
VERSION=""
PASS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
  --uninstall) MODE=uninstall ;;
  --no-restart) RESTART=0; PASS+=("$1") ;;
  --release) FROM_RELEASE=1 ;;
  --version)
    [[ $# -ge 2 ]] || { fail "--version needs a value (x.y.z)"; exit 1; }
    FROM_RELEASE=1
    VERSION="${2#v}"
    shift
    ;;
  --version=*) FROM_RELEASE=1; VERSION="${1#--version=}"; VERSION="${VERSION#v}" ;;
  -h | --help)
    echo "Usage: install.sh [--release | --version X.Y.Z] [--no-restart] | --uninstall"
    exit 0
    ;;
  *) fail "unknown option: $1"; exit 1 ;;
  esac
  shift
done

for tool in omarchy-shell omarchy-plugin-validate omarchy-plugin-enable omarchy-plugin-disable omarchy-plugin-list; do
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

install_release() {
  for tool in curl jq tar sha256sum; do
    command -v "$tool" >/dev/null 2>&1 || { fail "$tool not found - it is needed to download a release."; exit 1; }
  done
  local tag
  if [[ -n $VERSION ]]; then
    tag="v$VERSION"
  else
    info "Looking up the latest release..."
    tag="$(curl -fsSL "$API_URL/releases/latest" | jq -r '.tag_name // empty')" || true
  fi
  [[ $tag =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || { fail "no release found (got '${tag:-nothing}')."; exit 1; }
  local version="${tag#v}"
  RELEASE_WORK="$(mktemp -d)"
  trap 'rm -rf "$RELEASE_WORK"' EXIT
  local work="$RELEASE_WORK"
  info "Downloading Veil $version..."
  if ! curl -fsSL -o "$work/veil-$version.tar.gz" "$DOWNLOAD_URL/$tag/veil-$version.tar.gz" ||
    ! curl -fsSL -o "$work/SHA256SUMS" "$DOWNLOAD_URL/$tag/SHA256SUMS"; then
    fail "could not download release $tag."
    exit 1
  fi
  if ! (cd "$work" && grep -E " [*]?veil-$version\.tar\.gz\$" SHA256SUMS | sha256sum -c --status -); then
    fail "the archive does not match SHA256SUMS; nothing was installed."
    exit 1
  fi
  tar -xzf "$work/veil-$version.tar.gz" -C "$work"
  bash "$work/veil-$version/scripts/install.sh" "${PASS[@]}"
}

if [[ $FROM_RELEASE -eq 1 || -z $REPO_DIR || ! -f $PLUGIN_SRC/manifest.json ]]; then
  install_release
  exit 0
fi

info "Validating the plugin manifest..."
omarchy-plugin-validate "$PLUGIN_SRC"

info "Installing the plugin to $PLUGIN_DIR"
mkdir -p "$(dirname "$PLUGIN_DIR")"
rm -rf "$PLUGIN_DIR"
cp -aL "$PLUGIN_SRC" "$PLUGIN_DIR"
omarchy-shell -q shell rescanPlugins >/dev/null 2>&1 || true

known=0
for _ in $(seq 1 "${VEIL_RESCAN_TRIES:-50}"); do
  if omarchy-plugin-list --json 2>/dev/null | grep -q "\"id\": *\"$PLUGIN_ID\""; then
    known=1
    break
  fi
  sleep 0.1
done
[[ $known -eq 1 ]] || { fail "omarchy-shell did not pick up $PLUGIN_DIR; omarchy.lock is left as it was."; exit 1; }

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
