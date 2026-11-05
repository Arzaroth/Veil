#!/usr/bin/env bash
# Line coverage of the plugin's JavaScript (omarchy/**/*.js), via vitest's v8
# provider.
#
#   scripts/coverage.sh            summary, then the files with the most
#                                  uncovered lines
#   scripts/coverage.sh --check    fail below VEIL_COVERAGE_FLOOR (default 98)
#   scripts/coverage.sh --html     write and open coverage/index.html
#   scripts/coverage.sh --lcov     write coverage/lcov.info
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FLOOR="${VEIL_COVERAGE_FLOOR:-98}"
TOP="${VEIL_COVERAGE_TOP:-15}"

if [[ -t 1 ]]; then B="\033[0;34m"; G="\033[0;32m"; Y="\033[0;33m"; R="\033[0;31m"; Z="\033[0m"; else B=""; G=""; Y=""; R=""; Z=""; fi
info()    { printf '%b\n' "${B}$*${Z}"; }
success() { printf '%b\n' "${G}$*${Z}"; }
warn()    { printf '%b\n' "${Y}$*${Z}"; }
fail()    { printf '%b\n' "${R}$*${Z}" >&2; }

MODE=summary
while [[ $# -gt 0 ]]; do
  case "$1" in
  --check) MODE=check ;;
  --html) MODE=html ;;
  --lcov) MODE=lcov ;;
  -h | --help)
    sed -n '2,10p' "${BASH_SOURCE[0]}" | sed 's/^# \?//'
    exit 0
    ;;
  *)
    fail "unknown option: $1"
    exit 1
    ;;
  esac
  shift
done

command -v pnpm >/dev/null 2>&1 || { fail "pnpm not found - run 'mise install' in the repository."; exit 1; }
[[ -d $REPO_DIR/node_modules/@vitest/coverage-v8 ]] || { fail "@vitest/coverage-v8 is not installed."; warn "  pnpm install"; exit 1; }

cd "$REPO_DIR"
args=(vitest run --coverage)
[[ $MODE == check ]] && args+=("--coverage.thresholds.lines=$FLOOR")

info "Running the unit tests with coverage..."
pnpm --silent "${args[@]}"

node - "$REPO_DIR/coverage/coverage-summary.json" "$TOP" <<'JS'
  const summary = require(process.argv[2]);
  const top = Number(process.argv[3]);
  const rows = Object.entries(summary)
    .filter(([file]) => file !== "total")
    .map(([file, s]) => [file.replace(process.cwd() + "/", ""), s.lines.total - s.lines.covered, s.lines.pct])
    .filter(([, uncovered]) => uncovered > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, top);
  console.log(`\nlines: ${summary.total.lines.pct}% (${summary.total.lines.covered}/${summary.total.lines.total})`);
  for (const [file, uncovered, pct] of rows) console.log(`  ${String(uncovered).padStart(4)} uncovered  ${pct}%  ${file}`);
JS

case "$MODE" in
check) success "Line coverage is at or above the ${FLOOR}% floor." ;;
html)
  info "coverage/index.html"
  command -v xdg-open >/dev/null 2>&1 && xdg-open "$REPO_DIR/coverage/index.html" >/dev/null 2>&1 &
  ;;
lcov) info "coverage/lcov.info" ;;
esac
