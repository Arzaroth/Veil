---
name: upstream-check
description: Review what Omarchy's own lock screen (omacom/omarchy, shell/plugins/lock/, branch quattro) changed since Veil's baseline, and carry the fixes over to Veil's fork. Use for "did upstream move", "check omarchy", "upstream check", "backport the lock fixes", after an Omarchy update, or for a periodic drift review.
---

# Upstream check

Veil is a fork of `omarchy.lock`. Its authentication, session lock,
fingerprint model and blanking are upstream's code, so upstream's fixes to
them are Veil's to carry. Nothing tells us when they land except this check.

| Upstream file | In Veil | Carry over |
| --- | --- | --- |
| `Service.qml` | `omarchy/arzaroth.veil/Service.qml` with Veil's hooks (`brain/architecture/overview.md`) | Every change, merged around the hooks |
| `FingerprintModel.js` | byte identical | Verbatim |
| `poster.sh` | byte identical | Verbatim |
| `LockView.qml` | replaced; the password field and its focus handling are upstream's | Changes to the field, its focus, key handling and fingerprint icon |
| `manifest.json` | Veil's own | Only a new capability or kind |

Also watch omarchy-shell's plugin API (`shell/` outside `plugins/lock`):
`qs.Commons` (`Style`, `Color.lock`, `I18n`, `Util`, `Border`) and `qs.Ui`
(`BackgroundMedia`, `BorderSurface`) are imported by `LockView.qml` and
stubbed in `tests/qml/stubs/`; a renamed property there breaks the view and
the stub has to follow.

Read `BASELINES.md` first; update it at the end of every run.

## Run

```bash
gh api "repos/omacom/omarchy/commits?sha=quattro&path=shell/plugins/lock&since=<baseline date>" \
  --jq '.[] | .sha[0:12] + " " + .commit.committer.date[0:10] + " " + (.commit.message|split("\n")[0])'
gh api repos/omacom/omarchy/compare/<baseline sha>...quattro \
  --jq '.files[] | select(.filename|startswith("shell/plugins/lock/")) | .filename + "\n" + .patch'
```

The installed Omarchy is a second source: `/usr/share/omarchy/shell/plugins/lock/`
after `omarchy update`. Diff it against the baseline commit's files to see
what the user's machine now runs.

For each upstream change:

1. Classify: auth / session lock / fingerprint / blanking (carry), view
   (carry if it touches the field), i18n or cosmetic (usually skip).
2. Apply it to Veil's file on a branch, one commit per upstream commit:
   `[<branch>] fix(upstream): <upstream subject> (omarchy <sha>)`.
3. Check the hooks still hold: `CLAUDE.md` "The password path is Omarchy's"
   and the pre-lock wait.
4. Run the gate and a live lock (see `feature-treatment` section 5).

Then hand the branch to `feature-treatment`.

## Update BASELINES.md

Record the upstream sha and date checked, the Omarchy version installed, and
one line per upstream commit: carried, skipped (why), or pending.
