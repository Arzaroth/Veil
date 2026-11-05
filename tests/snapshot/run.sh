#!/usr/bin/env bash
# Drives omarchy/arzaroth.veil/bin/snapshot against a fake grim and a private
# runtime directory, so nothing touches the real screens or /run/user.
set -uo pipefail

here="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
snapshot="$here/../../omarchy/arzaroth.veil/bin/snapshot"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

mkdir -p "$work/bin" "$work/run"
chmod 700 "$work/run"
cat >"$work/bin/grim" <<'GRIM'
#!/usr/bin/env bash
output="" target=""
while [[ $# -gt 0 ]]; do
  case "$1" in
  -o) output="$2"; shift 2 ;;
  -t | -q) shift 2 ;;
  *) target="$1"; shift ;;
  esac
done
[[ $output == "BROKEN" ]] && exit 1
printf 'jpeg of %s' "$output" >"$target"
GRIM
chmod +x "$work/bin/grim"

export PATH="$work/bin:$PATH" XDG_RUNTIME_DIR="$work/run"
dir="$work/run/arzaroth-veil"
failures=0
check() {
  if [[ $2 == "$3" ]]; then return; fi
  failures=$((failures + 1))
  printf 'FAIL %s: expected [%s], got [%s]\n' "$1" "$3" "$2" >&2
}

out="$("$snapshot" capture 4 eDP-1 BROKEN DP-9)"
check "one line per captured output, the broken one left out" "$out" "$(printf 'eDP-1\t%s/4-0.jpg\nDP-9\t%s/4-2.jpg' "$dir" "$dir")"
check "the capture is the output's" "$(cat "$dir/4-0.jpg")" "jpeg of eDP-1"
check "the directory is private" "$(stat -c %a "$dir")" "700"
check "the files are private" "$(stat -c %a "$dir/4-2.jpg")" "600"

"$snapshot" capture 5 eDP-1 >/dev/null
check "a new capture replaces the last one" "$(ls "$dir")" "5-0.jpg"

"$snapshot" clean
check "clean removes the directory" "$([[ -e $dir ]] && echo present || echo gone)" "gone"

"$snapshot" bogus 2>/dev/null
check "an unknown command is refused" "$?" "2"

(unset XDG_RUNTIME_DIR; "$snapshot" capture 1 eDP-1 >/dev/null 2>&1)
check "no runtime directory, no capture" "$?" "1"

if [[ $failures -gt 0 ]]; then
  echo "snapshot: $failures check(s) failed" >&2
  exit 1
fi
echo "snapshot: all checks passed"
