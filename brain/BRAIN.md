# BRAIN - Veil knowledge base

The map of Veil, written so a developer or AI can understand it without
reading the source. Start here, follow the links, stop when you have the
answer. Every leaf doc ends with the source files behind it.

> Product: **Veil**, a lock screen plugin for omarchy-shell (Omarchy 4.5+,
> Quickshell): Omarchy's `omarchy.lock` with a calmer view and a fade from
> your windows on lock and unlock. Stack in [stack.md](stack.md); the version
> is `version` in `package.json` and the plugin's `manifest.json`.

## How to use this

1. Know the topic? Jump to its file via the indexes below.
2. Have a question? Scan **Find by question** first.
3. Need a term? [glossary.md](glossary.md). The why behind a design?
   [decisions.md](decisions.md).
4. About to change something? The rules a change can break are in the repo's
   `CLAUDE.md`.

## Top-level docs

| Doc | What's here |
|---|---|
| [stack.md](stack.md) | QML, Quickshell, the JS models, Node and vitest, the tool pins. |
| [operations.md](operations.md) | The gate, CI jobs, coverage, installing, releasing, upstream watching. |
| [glossary.md](glossary.md) | Terms, with the synonyms to avoid. |
| [decisions.md](decisions.md) | The non-obvious decisions and why. |

## Architecture (the how) - [architecture/index.md](architecture/index.md)

| Doc | What's here |
|---|---|
| [overview.md](architecture/overview.md) | The plugin's files, what is upstream's and what is Veil's. Read first. |
| [lock-service.md](architecture/lock-service.md) | Service.qml: lock request, pre-lock wait, snapshot capture, unlock hold, blanking. |
| [view.md](architecture/view.md) | LockView.qml: layers, the reveal animation, text and colours. |
| [testing.md](architecture/testing.md) | Unit tests, the QML harness and its stubs, the shell tests, coverage. |
| [distribution.md](architecture/distribution.md) | The install script, release downloads, packaging and publishing. |

## Features (the what) - [features/index.md](features/index.md)

| Doc | What's here |
|---|---|
| [transitions.md](features/transitions.md) | The fade from your windows on lock, and back on unlock. |
| [lock-screen.md](features/lock-screen.md) | Clock, date, name, info line, branding art, the shake. |
| [settings.md](features/settings.md) | The `config.toml` keys, defaults and validation. |
| [timing.md](features/timing.md) | The 150 ms pre-lock wait and the 30 s before blanking. |

## Find by question

| If you're asking... | Go to |
|---|---|
| Can Veil unlock without a correct password? What did it change in auth? | [architecture/lock-service.md](architecture/lock-service.md) |
| Why does the lock fade from my windows, and where do the captures go? | [features/transitions.md](features/transitions.md) |
| Why did the lock fade look like a jump? | [decisions.md](decisions.md#0002-start-the-fade-on-secure) |
| How do I change the name, clock format, art or blank delay? | [features/settings.md](features/settings.md) |
| Why is my setting ignored? | [features/settings.md](features/settings.md) |
| Why 150 ms before locking, and when is it 500? | [features/timing.md](features/timing.md) |
| Why is my QML change not showing? | [operations.md](operations.md) |
| What does the coverage floor measure? | [architecture/testing.md](architecture/testing.md) |
| Which files are still Omarchy's? | [architecture/overview.md](architecture/overview.md) |
| How do I install, update or uninstall? Without cloning? | [architecture/distribution.md](architecture/distribution.md) |
| How is a release built and published? | [architecture/distribution.md](architecture/distribution.md), [operations.md](operations.md) |

## Maintaining the brain

Load-bearing: a change that makes a doc wrong fixes it in the same branch.
New feature: a `features/<name>.md`, a row in [features/index.md](features/index.md)
and here. New subsystem: an `architecture/*.md` and its rows. New term:
[glossary.md](glossary.md). New decision: [decisions.md](decisions.md).
