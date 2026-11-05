#!/usr/bin/env bash
# Runs scripts/install.sh against fake omarchy commands that log what they
# were asked, in a throwaway HOME.
set -uo pipefail

here="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
install="$here/../../scripts/install.sh"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

mkdir -p "$work/bin" "$work/home"
log="$work/calls"
cat >"$work/bin/omarchy-plugin-list" <<FAKE
#!/usr/bin/env bash
[[ -f "$work/home/.config/omarchy/plugins/arzaroth.veil/manifest.json" && -z "\${VEIL_NEVER_KNOWN:-}" ]] && echo '[{"id": "arzaroth.veil", "enabled": false}]' || echo '[]'
FAKE
chmod +x "$work/bin/omarchy-plugin-list"
for tool in omarchy-shell omarchy-plugin-validate omarchy-plugin-enable omarchy-plugin-disable omarchy-restart-shell; do
  cat >"$work/bin/$tool" <<FAKE
#!/usr/bin/env bash
echo "$tool \$*" >>"$log"
[[ "$tool \$*" == "\${VEIL_FAIL_CALL:-}" ]] && exit 1
exit 0
FAKE
  chmod +x "$work/bin/$tool"
done

export PATH="$work/bin:$PATH" HOME="$work/home"
plugin="$work/home/.config/omarchy/plugins/arzaroth.veil"
failures=0
check() {
  if [[ $2 == "$3" ]]; then return; fi
  failures=$((failures + 1))
  printf 'FAIL %s:\n  expected [%s]\n  got      [%s]\n' "$1" "$3" "$2" >&2
}
calls() { grep -v rescanPlugins "$log" | tr '\n' ';'; }

"$install" >/dev/null
check "install exits cleanly" "$?" "0"
check "the plugin is copied" "$([[ -f $plugin/manifest.json && -x $plugin/bin/snapshot ]] && echo yes)" "yes"
check "validate, enable Veil, then disable the stock lock, then restart" "$(calls)" \
  "omarchy-plugin-validate $repo/omarchy/arzaroth.veil;omarchy-plugin-enable arzaroth.veil;omarchy-plugin-disable omarchy.lock;omarchy-restart-shell ;"

: >"$log"
VEIL_FAIL_CALL="omarchy-plugin-disable omarchy.lock" "$install" >/dev/null 2>&1
check "a stock lock that will not disable fails the install" "$?" "1"
check "and Veil is disabled again so one lock runs" "$(calls)" \
  "omarchy-plugin-validate $repo/omarchy/arzaroth.veil;omarchy-plugin-enable arzaroth.veil;omarchy-plugin-disable omarchy.lock;omarchy-plugin-disable arzaroth.veil;"

: >"$log"
"$install" --uninstall --no-restart >/dev/null 2>&1
check "uninstall exits cleanly" "$?" "0"
check "uninstall enables the stock lock before removing Veil" "$(calls)" \
  "omarchy-plugin-enable omarchy.lock;omarchy-plugin-disable arzaroth.veil;"
check "the plugin folder is gone" "$([[ -e $plugin ]] && echo present || echo gone)" "gone"

"$install" --bogus >/dev/null 2>&1
check "an unknown option is refused" "$?" "1"

"$install" --help >/dev/null
check "help exits cleanly" "$?" "0"

rm -rf "$plugin"
: >"$log"
VEIL_NEVER_KNOWN=1 VEIL_RESCAN_TRIES=2 "$install" >/dev/null 2>&1
check "a plugin the shell never picks up fails the install" "$?" "1"
check "and nothing is enabled or disabled" "$(calls)" \
  "omarchy-plugin-validate $repo/omarchy/arzaroth.veil;"

version="$(jq -r .version "$repo/package.json")"
srv="$work/srv"
mkdir -p "$srv/api/releases" "$srv/download/v$version"
SOURCE_DATE_EPOCH=1700000000 "$repo/scripts/package.sh" "$srv/download/v$version" >/dev/null
printf '{"tag_name": "v%s"}\n' "$version" >"$srv/api/releases/latest"
export VEIL_API_URL="file://$srv/api" VEIL_DOWNLOAD_URL="file://$srv/download"
mkdir -p "$work/tmp"
export TMPDIR="$work/tmp"
extracted="omarchy-plugin-validate $work/tmp/.*/veil-$version/omarchy/arzaroth.veil;omarchy-plugin-enable arzaroth.veil;omarchy-plugin-disable omarchy.lock;"

rm -rf "$plugin"
: >"$log"
(cd "$work" && bash -s -- --no-restart <"$repo/scripts/install.sh") >/dev/null 2>&1
check "piped into bash with no checkout, it installs the latest release" "$?" "0"
check "from the extracted release" "$(calls | grep -cE "^$extracted\$")" "1"
check "the plugin is in place" "$([[ -f $plugin/Model.mjs ]] && echo yes)" "yes"
check "and the download is cleaned up" "$(find "$work/tmp" -mindepth 1 | wc -l)" "0"

rm -rf "$plugin"
: >"$log"
"$install" --version "$version" --no-restart >/dev/null 2>&1
check "--version installs that release even from a checkout" "$(calls | grep -cE "^$extracted\$")" "1"

rm -rf "$plugin"
: >"$log"
archive="$srv/download/v$version/veil-$version.tar.gz"
cp "$archive" "$work/archive"
printf 'x' >>"$archive"
"$install" --release >/dev/null 2>&1
check "an archive that does not match its checksum is refused" "$?" "1"
check "and nothing is touched" "$(calls)$([[ -e $plugin ]] && echo present)" ""
cp "$work/archive" "$archive"

printf '{"message": "Not Found"}\n' >"$srv/api/releases/latest"
"$install" --release >/dev/null 2>&1
check "no release to install is an error" "$?" "1"

"$install" --version 9.9.9 >/dev/null 2>&1
check "a release that does not exist is an error" "$?" "1"

"$install" --version >/dev/null 2>&1
check "--version without a value is refused" "$?" "1"

rm "$work/bin/omarchy-plugin-enable"
"$install" >/dev/null 2>&1
check "missing Omarchy tooling is refused" "$?" "1"

if [[ $failures -gt 0 ]]; then
  echo "install: $failures check(s) failed" >&2
  exit 1
fi
echo "install: all checks passed"
