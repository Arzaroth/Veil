#!/usr/bin/env bash
# Builds the release archive into a scratch folder and checks what is in it.
set -uo pipefail

here="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

failures=0
check() {
  if [[ $2 == "$3" ]]; then return; fi
  failures=$((failures + 1))
  printf 'FAIL %s:\n  expected [%s]\n  got      [%s]\n' "$1" "$3" "$2" >&2
}

version="$(jq -r .version "$repo/package.json")"
name="veil-$version"
out="$(SOURCE_DATE_EPOCH=1700000000 "$repo/scripts/package.sh" "$work/a")"
check "the archive is named after the version" "$out" "$work/a/$name.tar.gz"
check "the checksum matches" "$(cd "$work/a" && sha256sum -c SHA256SUMS >/dev/null 2>&1; echo $?)" "0"

listing="$(tar -tzf "$work/a/$name.tar.gz" | sort)"
for path in "$name/scripts/install.sh" "$name/omarchy/arzaroth.veil/manifest.json" \
  "$name/omarchy/arzaroth.veil/Model.mjs" "$name/omarchy/arzaroth.veil/bin/snapshot" \
  "$name/omarchy/arzaroth.veil/NOTICE" "$name/LICENSE"; do
  check "the archive has $path" "$(grep -qx "$path" <<<"$listing" && echo yes)" "yes"
done
check "no sources or tests ship" "$(grep -cE '/(src|tests|node_modules)/' <<<"$listing")" "0"
check "the helper stays executable" "$(tar -tvzf "$work/a/$name.tar.gz" "$name/omarchy/arzaroth.veil/bin/snapshot" | cut -c4)" "x"

SOURCE_DATE_EPOCH=1700000000 "$repo/scripts/package.sh" "$work/b" >/dev/null
check "the archive is reproducible" "$(cat "$work/a/SHA256SUMS")" "$(cat "$work/b/SHA256SUMS")"

if [[ $failures -gt 0 ]]; then
  echo "package: $failures check(s) failed" >&2
  exit 1
fi
echo "package: all checks passed"
