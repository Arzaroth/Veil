#!/usr/bin/env bash
# Build the release archive: veil-<version>.tar.gz with the plugin, the
# installer and the licence, plus SHA256SUMS, in dist/ (or the given folder).
#
#   scripts/package.sh [out-dir]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="${1:-$REPO_DIR/dist}"

fail() { printf '%s\n' "$*" >&2; exit 1; }

command -v jq >/dev/null 2>&1 || fail "jq not found."
version="$(jq -r .version "$REPO_DIR/package.json")"
manifest_version="$(jq -r .version "$REPO_DIR/omarchy/arzaroth.veil/manifest.json")"
[[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "package.json version '$version' is not x.y.z."
[[ $version == "$manifest_version" ]] || fail "package.json ($version) and manifest.json ($manifest_version) disagree."

name="veil-$version"
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT
mkdir -p "$stage/$name/scripts" "$stage/$name/omarchy"
cp -a "$REPO_DIR/omarchy/arzaroth.veil" "$stage/$name/omarchy/"
cp -a "$REPO_DIR/scripts/install.sh" "$stage/$name/scripts/"
cp -a "$REPO_DIR/LICENSE" "$REPO_DIR/README.md" "$REPO_DIR/CHANGELOG.md" "$stage/$name/"

epoch="${SOURCE_DATE_EPOCH:-$(git -C "$REPO_DIR" log -1 --format=%ct 2>/dev/null || date +%s)}"
mkdir -p "$OUT_DIR"
tar -C "$stage" --sort=name --owner=0 --group=0 --numeric-owner --mtime="@$epoch" \
  -cf - "$name" | gzip -n >"$OUT_DIR/$name.tar.gz"
(cd "$OUT_DIR" && sha256sum "$name.tar.gz" >SHA256SUMS)
echo "$OUT_DIR/$name.tar.gz"
