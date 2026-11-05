# Architecture

The plugin's layers. Start with [overview.md](overview.md). Back to the root
map: [../BRAIN.md](../BRAIN.md).

| File | What's here | Grep keywords |
|---|---|---|
| [overview.md](overview.md) | Files, data flow, what is upstream's and what is Veil's | manifest, Service.qml, LockView.qml, Model.mts, Model.mjs, NOTICE |
| [lock-service.md](lock-service.md) | Lock request, pre-lock wait, snapshot capture, PAM, unlock hold, blanking | beginLock, queueSessionLock, captureSnapshots, finishUnlock, releaseLock, idleBlankTimer |
| [view.md](view.md) | Layers of the view, reveal, ink, branding art | reveal, presented, unlocking, snapshotPath, ink, brandingArt |
| [testing.md](testing.md) | Unit tests, QML harness and stubs, shell tests, coverage | vitest, Check.qml, stubs, run.sh, coverage.sh |
| [distribution.md](distribution.md) | The install script, installing from a release, packaging and the release workflow | install.sh, package.sh, release.yml, SHA256SUMS, omarchy.lock |
