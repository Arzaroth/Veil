---
name: release
description: Cut a Veil release - docs sweep (CHANGELOG, README, CLAUDE.md, brain/), version bump in package.json and the plugin manifest, full gate, [master] chore(release) commit, annotated vX.Y.Z tag, push to Forgejo, wait for the GitHub mirror, and publish the GitHub release with the changelog section as its body and the plugin folder as an archive. Use when the user says "cut a release", "release 0.2.0", "ship a version" in this repository.
---

# Cutting a Veil release

The bump is by hand; this skill knows where the version lives and how the
release reaches GitHub.

## 1. Pre-flight

- Never switch branches in the main checkout; the user works in it live.
  Release from the master worktree, noting whether this run created it:

  ```bash
  MAIN=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
  wt switch master && cd "$MAIN.worktrees/master" && git branch --show-current
  ```
- Tree clean, `git pull --ff-only`, every PR meant for the release merged
  (`gh pr list -R Arzaroth/Veil`).
- `git config user.email` is `lekva+github@arzaroth.com`.
- Previous version: `git describe --tags --abbrev=0` (none before 0.1.0).
  Next: minor for any `### Added` or user-visible `### Changed`, patch for
  fix-only. Pre-1.0: no major.

## 2. Docs sweep (against `git log v<last>..HEAD`)

- `CHANGELOG.md` `[Unreleased]` covers every user-visible change.
- `README.md`: features, configuration, install steps.
- `CLAUDE.md` / `brain/`: the `brain` skill's audit, scoped to what changed.
- `ROADMAP.md`: tick or remove what shipped.
- Commit as `[master] docs(release): ...` before the bump.

## 3. Bump

| File | Field |
| --- | --- |
| `package.json` | `version` |
| `omarchy/arzaroth.veil/manifest.json` | `version` |

`tests/js/manifest.test.mjs` fails if they disagree. Afterwards
`git grep -nF '"<old>"' -- ':!pnpm-lock.yaml' ':!CHANGELOG.md'` is empty.

`CHANGELOG.md`: rename `## [Unreleased]` to `## [x.y.z] - YYYY-MM-DD` and
open a fresh empty `## [Unreleased]` above it.

## 4. Gate

The `feature-treatment` gate (section 5), all green, plus a live
`scripts/install.sh` and one lock and unlock.

## 5. Commit, tag, push

```bash
git commit -am "[master] chore(release): x.y.z" -m "<two or three lines on the theme>"
git tag -a vx.y.z -m vx.y.z
git push origin master --follow-tags
```

End the commit with the `Co-Authored-By` trailer. Push to `origin` only. Then
wait for the mirror:

```bash
smith api repos/Arzaroth/Veil/push_mirrors          # last_update, last_error
gh api repos/Arzaroth/Veil/git/ref/tags/vx.y.z --jq .object.sha
```

Re-request the sync (`smith api -X POST repos/Arzaroth/Veil/push_mirrors-sync`)
while `last_error` is set or the tag is missing.

## 6. Publish

```bash
awk '/^## \[x.y.z\]/{f=1;next} /^## \[/{f=0} f' CHANGELOG.md > /tmp/veil-notes.md
tar -C omarchy -czf /tmp/veil-x.y.z.tar.gz arzaroth.veil
gh release create vx.y.z -R Arzaroth/Veil --title "Veil x.y.z" --notes-file /tmp/veil-notes.md /tmp/veil-x.y.z.tar.gz
gh run list -R Arzaroth/Veil -L 1   # CI on the release commit
```

## Done when

The tag is on Forgejo and GitHub, the GitHub release exists with the notes
and `veil-x.y.z.tar.gz`, and CI on the release commit is green. Report the
version, the release URL and the one-line theme. Remove the master worktree
only if this run created it.
