#!/usr/bin/env bash
# Loads Veil's QML in a plain QML runtime with omarchy-shell's and Quickshell's
# modules stubbed (tests/qml/stubs), and drives it. Every *.qml here except
# Check.qml is a harness.
set -uo pipefail

here="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"

qml=""
for candidate in qml6 /usr/lib/qt6/bin/qml qml; do
  if command -v "$candidate" >/dev/null 2>&1; then
    qml="$candidate"
    break
  fi
done
if [[ -z $qml ]]; then
  echo "qml: no Qt QML runtime found." >&2
  echo "  Arch:   pacman -S qt6-declarative" >&2
  echo "  Ubuntu: apt install qml-qt6 qml6-module-qtquick" >&2
  exit 1
fi

export QT_QPA_PLATFORM=offscreen
export QT_FORCE_STDERR_LOGGING=1
export QML_XHR_ALLOW_FILE_READ=1

status=0
for harness in "$here"/*.qml; do
  name="$(basename "$harness" .qml)"
  [[ $name == "Check" ]] && continue
  if ! timeout 60 "$qml" -I "$here/stubs" -I "$here" "$harness"; then
    echo "::error::the $name harness failed" >&2
    status=1
  fi
done
exit $status
