---
name: brain
description: Use and maintain the brain/ knowledge base - the committed docs describing how Veil works (architecture, features, decisions, glossary) - together with CLAUDE.md, which holds the rules a change can break. Invoke when the user asks how or where something works ("how does the unlock fade work", "where do the captures go", "why 150 ms"), when onboarding, or when asked to update, audit or fix the brain after a change. Read brain/BRAIN.md first; navigate via the indexes, not a whole-tree grep.
---

# The brain

`brain/` is the committed knowledge base: how Veil works, written so you can
answer without reading the source. `CLAUDE.md` is its companion: the rules a
change can break, each with the incident or constraint behind it.

## Navigating (to answer a question)

1. Open `brain/BRAIN.md`: topic tables and a **Find by question** table.
2. Drill via `brain/architecture/index.md` (the how) and
   `brain/features/index.md` (the what).
3. Land on the leaf doc; it ends with `## Sources`. Follow those only if the
   doc is not enough or you suspect drift.
4. Terms: `brain/glossary.md`. Rationale: `brain/decisions.md` (`### NNNN`).
5. About to change code: read the matching `CLAUDE.md` section
   (`grep -n '^##' CLAUDE.md`): the password path, never leaving the machine
   without a lock, the snapshot, the fade timing, the restart rule.

```
brain/BRAIN.md                 root index + find-by-question
brain/stack.md  operations.md  glossary.md  decisions.md
brain/architecture/index.md    overview lock-service view testing distribution
brain/features/index.md        transitions lock-screen timing
```

## Maintaining (after a change)

The code is the source of truth.

- A change that makes a doc wrong fixes it **in the same branch**, as its own
  `docs` layer on top of the behaviour commit.
- New feature: `brain/features/<name>.md`, a row in `brain/features/index.md`
  and in `brain/BRAIN.md` (plus a Find-by-question row if it answers a new
  question). Change to `Service.qml`'s hooks: `architecture/lock-service.md`.
  Change to the view's layers or reveal: `architecture/view.md`.
- A new Veil hook in `Service.qml` is also listed in
  `architecture/overview.md`'s "what is Veil's" so `upstream-check` knows it
  is ours.
- New decision with real alternatives: next `### NNNN` in `decisions.md`;
  smaller ones are bullets.
- New term: `glossary.md`, with an `Avoid:` list.
- New rule a change could break: a section in `CLAUDE.md` naming the test that
  asserts it.
- Toolchain change: `stack.md`; gate, CI, install or release change:
  `operations.md`.
- User-visible change: `README.md` and `CHANGELOG.md` `[Unreleased]`.
- Style: dense, present tense, plain prose, no em-dashes, relative links, cite
  source paths and test names rather than restating code.

## Auditing (drift check on request)

1. Scope to the relevant leaf docs.
2. For each, read its `## Sources` and confirm the claims: function names
   (`git grep`), constants in `src/Model.mts` and their values, timer intervals in
   `Service.qml`, file paths, test names.
3. The code wins: correct the doc and say what changed.
4. Update the indexes if a doc was added, moved or removed.
5. Check every relative link resolves.
