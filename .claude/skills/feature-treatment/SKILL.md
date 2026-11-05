---
name: feature-treatment
description: Ship a finished Veil feature branch the full way - rebase onto master, run a max-effort multi-agent review with Veil's lenses (the password path, never losing the lock, snapshot privacy, upstream drift, QML correctness, tests), fix everything confirmed as new layers, update the brain, pass the full gate, open the PR and babysit it to a merge, cut a release, and remove the worktree. Use when the user says "feature treatment", "treat this branch", "review and merge this feature", or names a worktree or branch to ship.
---

# Feature treatment

**rebase -> max review -> fix -> update the brain -> gate -> PR and merge ->
release -> clean up**. Nothing merges without an adversarial review and a green
gate.

The branch comes from the argument; otherwise `wt list` and pick the
non-master worktree under `<main checkout>.worktrees/`, asking if there is
more than one. Work inside that worktree, never in the main checkout:

```bash
MAIN=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
WT="$MAIN.worktrees/<branch>"
```

## 1. Rebase onto master

If the branch is pushed with a reviewed PR
(`gh pr list -R Arzaroth/Veil --head <branch>`), do not rebase: merge
`origin/master` in, or ask. Otherwise:

```bash
cd "$WT" && git fetch origin && git rebase origin/master
```

Then the size rule: `git diff --name-only origin/master...HEAD | wc -l` must be
at most 149. Over it, propose a split before reviewing.

## 2. Max-effort review (parallel finders)

Diff: `git diff origin/master...HEAD -- . ':(exclude)pnpm-lock.yaml'`.

Spawn independent finders in one message, each over the same diff with one
lens, and give each the named `CLAUDE.md` section(s). 4-6 is typical.

- **Password path** (`CLAUDE.md` "The password path is Omarchy's") - any
  change to a `PamContext`, `submitPassword`, `finishUnlock` /
  `releaseLock`, `lockRequested` or `sessionLock.locked`; a visual that starts
  before `PamResult.Success`; input accepted during `unlocking`; a lock
  request during the unlock hold that ends unlocked.
- **Never without a lock** - a path where both lock services are disabled, or
  both enabled; the hotplug wait shortened; a new delay before
  `requestSessionLock` on the suspend path; `install.sh` order changed.
- **Snapshot privacy** - files outside `$XDG_RUNTIME_DIR/arzaroth-veil`,
  modes looser than 0700/0600, a path where captures survive an unlock or a
  cancelled lock, a capture accepted after the session locked, output names
  used as file names, shell injection in `bin/snapshot` or `Model.snapshotCommand`.
- **Upstream drift** - an edit to upstream's code in `Service.qml`,
  `FingerprintModel.js` or `poster.sh` that is not one of Veil's hooks
  (`brain/architecture/overview.md`); `FingerprintModel.js` no longer byte
  identical to the baseline in `.claude/skills/upstream-check/BASELINES.md`.
- **QML correctness** - bindings that loop, a property read before it exists,
  `presented` / `unlocking` / `reveal` interplay (the fade must not start
  before `secure`), Text bound to untrusted text without
  `textFormat: Text.PlainText`, an animation longer than
  `Model.UNLOCK_FADE_MS` on the way out.
- **Tests / reuse** - logic left in QML that belongs in `Model.js` (and so
  escapes the coverage floor), a new branch without a test, a harness step the
  change should add, a stub that now lies about the shell.

Each finder returns `{file, line, severity, summary, failure_scenario}`,
quoting the line, most severe first, and fixes nothing.

## 3. Fix what is confirmed

Re-verify each claim against the code. Fix every confirmed password-path,
lock, privacy or correctness finding and the worthwhile quality ones. Real but
out of scope goes to `TODO.md`. Fixes land as new layers:
`[<branch>] fix(<area>): ...`.

## 4. Update the brain

Run the `brain` skill's maintain checklist over what changed, plus
`CHANGELOG.md` `[Unreleased]` for anything a user sees. Commit as its own
`docs(...)` layer.

## 5. Gate

```bash
pnpm install --frozen-lockfile && pnpm test
scripts/coverage.sh --check
tests/qml/run.sh
tests/snapshot/run.sh
tests/install/run.sh
shellcheck omarchy/arzaroth.veil/bin/snapshot omarchy/arzaroth.veil/poster.sh scripts/*.sh tests/**/*.sh
```

plus qmllint over `omarchy/**/*.qml` (a `[syntax]` diagnostic is the failure;
see `ci.yml`). Then a live check: `scripts/install.sh`, a real lock and
unlock, and `journalctl --user --since -2min | grep 'omarchy lock'` for the
event sequence. Re-count files against the 149 limit.

## 6. PR and merge

Push the branch to `origin` (Forgejo) only; the mirror carries it to GitHub.
Open the PR on `Arzaroth/Veil` (always `-R Arzaroth/Veil`) and hand it to the
`babysit-pr` skill. Merge locally with `git merge --no-ff` (subject
`[master] Merge branch '<branch>'`) and push `master` to `origin`; the mirror
marks the GitHub PR merged. If the mirror lags:
`smith api -X POST repos/Arzaroth/Veil/push_mirrors-sync`.

## 7. Release

Run the `release` skill: minor for a user-facing feature, patch for fix-only.
Skip only if the user says to batch it.

## 8. Clean up

```bash
wt remove <branch>
```

## Done when

Merged on master, docs updated, gate green, tag pushed (unless skipped),
worktree gone. Report the PR, the version, and one line on what the review
caught.
