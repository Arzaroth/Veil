# Transitions

**Lock.** Each monitor is captured during the pre-lock wait. The lock opens
on that capture, which blurs and fades out over the blurred wallpaper while
the content fades in, starting when Hyprland shows the lock. A monitor whose
capture was not ready in time gets the wallpaper-only fade: the wallpaper
blurs in under the content.

**Unlock.** After a correct password or fingerprint the lock stays up for
450 ms: the content fades out and the capture sharpens back in, then the live
desktop takes over. After a long lock the windows may have changed since the
capture, which shows as a small jump at the hand-over.

**Privacy.** Captures live in `$XDG_RUNTIME_DIR/arzaroth-veil/` (memory,
owner-only), are deleted 3 s after the lock and again on unlock. The rules are
in `CLAUDE.md` ("The snapshot is private and short-lived").

The preview (`omarchy-shell lock preview`) shows neither: no capture, no
unlock.

## Sources

- [../architecture/lock-service.md](../architecture/lock-service.md),
  [../architecture/view.md](../architecture/view.md)
- `omarchy/arzaroth.veil/bin/snapshot`
