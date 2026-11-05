# Timing

**Pre-lock wait.** 150 ms (`Model.STABILIZE_MS`) between a lock request and
the session lock, long enough for the captures (about 70 ms for three
monitors). If a monitor was added or removed in the last 2 s
(`HOTPLUG_WINDOW_MS`), or changes during the wait, it is upstream's 500 ms
(`HOTPLUG_STABILIZE_MS`) instead: locking while outputs come and go can leave
one without a lock surface. Before suspend this matters most, as the lid or
the dock often changes the outputs then.

**Unlock hold.** 450 ms (`Model.UNLOCK_FADE_MS`) after a successful
authentication, for the reverse fade.

**Blanking.** 30 s without input on the lock screen turns the displays off
(`blankAfter` in [settings.md](settings.md), `idleBlankTimer.idleMs`;
upstream 5 s). After a resume it waits 15 s
(`resumeMs`, upstream's).

## Sources

- `src/Model.mts`, `omarchy/arzaroth.veil/Service.qml`
