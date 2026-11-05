---
name: release
description: Cut a Veil release - docs sweep (CHANGELOG, README, CLAUDE.md, brain/), version bump in package.json and the plugin manifest, full gate, [master] chore(release) commit, annotated vX.Y.Z tag, push to Forgejo, wait for the GitHub mirror, then watch the Release workflow publish the archive and SHA256SUMS, and install it with the curl one-liner. Use when the user says "cut a release", "release 0.2.0", "ship a version" in this repository.
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
wait for the mirror to carry the tag:

```bash
smith api repos/Arzaroth/Veil/push_mirrors          # last_update, last_error
gh api repos/Arzaroth/Veil/git/ref/tags/vx.y.z --jq .object.sha
```

Re-request the sync (`smith api -X POST repos/Arzaroth/Veil/push_mirrors-sync`)
while `last_error` is set or the tag is missing.

## 6. Watch

The tag triggers `.github/workflows/release.yml`: it checks the tag against
both version files and the changelog section, runs the unit gate, builds
`veil-x.y.z.tar.gz` and `SHA256SUMS` with `scripts/package.sh`, and publishes
the release with the changelog section as its notes.

```bash
gh run list -R Arzaroth/Veil --workflow release.yml -L 1
gh run watch -R Arzaroth/Veil <id> --exit-status
gh release view vx.y.z -R Arzaroth/Veil --json assets --jq '.assets[].name'
```

Then install it the way a user would, which also checks the `curl` path:

```bash
curl -fsSL https://raw.githubusercontent.com/Arzaroth/Veil/master/scripts/install.sh | bash
```

If the workflow fails after the tag is out: fix on master and cut the next
patch rather than moving a published tag.

## Done when

The tag is on Forgejo and GitHub, the release exists with `veil-x.y.z.tar.gz`
and `SHA256SUMS`, its notes are the changelog section, and the `curl` install
put that version in place. Report the version, the release URL and the
one-line theme. Remove the master worktree only if this run created it.
