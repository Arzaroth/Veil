# View

`LockView.qml`, one per monitor, also used by `omarchy-shell lock preview`.

## Layers, bottom to top

1. The wallpaper (`BackgroundMedia`) under a `MultiEffect` blur. Without a
   snapshot the blur follows `reveal`; with one it is fully blurred from the
   start.
2. The snapshot, if any: an `Image` under its own blur that sharpens as
   `reveal` falls and fades out as it rises.
3. A dim of the theme background at `0.5 * reveal`.
4. The content, at `opacity: reveal` and drifting 18 px: clock, date, name,
   the password field, the info line, the fingerprint notice, with a soft
   shadow under the column; the branding art (or the Omarchy wordmark) at the
   bottom.

## Reveal

`reveal` is 1 when `started && presented && !unlocking`, else 0, animated: in
over 700 ms ease-in-out, out over 380 ms ease-out (inside the 450 ms unlock
hold). `started` turns true just after creation. See
[decisions.md](../decisions.md#0002-start-the-fade-on-secure).

## Text

- `ink` is `Commons.Color.lock.text` tinted 60% towards white; the clock,
  date, name, info line and art use it; the field's placeholder uses it at
  60% alpha. Errors keep `lock.textError`.
- `settings` is the resolved settings object from the service (defaults when
  the view is created on its own); `displayName`, `timeFormat`, `dateFormat`,
  `brandingPath` and `showBranding` bind to it. `showBranding` gates both the
  art and the wordmark.
- `lockedForText`, `batteryText`, `infoText` and `brandingArt`
  come from `Model.mjs` (`src/Model.mts`). `now` ticks every second.
- The branding file is read with `FileView` and watched, so editing it
  updates the lock.

The password field (`TextInput` in a `BorderSurface`), its focus handling and
the fingerprint icon are upstream's; Veil adds the shake on `failedAttempts`.

## Sources

- `omarchy/arzaroth.veil/LockView.qml`, `src/Model.mts`
