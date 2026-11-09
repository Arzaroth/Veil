# Lock screen

What each monitor shows while locked, top to bottom:

- **Clock** (`timeFormat`, default `HH:mm`) and **date** (`dateFormat`,
  default `dddd d MMMM`, in your locale).
- **Name** (`displayName`, default your login capitalized).
- **Password field**, upstream's, with the fingerprint icon when a finger is
  enrolled. A wrong password shakes it and shows upstream's message.
- **Info line**: the battery (charging icon when plugged in) and, after a
  minute, how long the screen has been locked (`locked 14m`, `locked 1h 05m`).
  Parts without data are left out.
- **Branding art** at the bottom, from `brandingPath` (default
  `~/.config/omarchy/branding/about.txt`, the fastfetch art), watched for
  changes. Missing or empty shows the Omarchy wordmark instead, and
  `"branding": false` hides both.

All text uses the theme's lock colour lightened (`ink`) over a dimmed, blurred
wallpaper. The name, formats and art path are settings: see
[settings.md](settings.md).

## Sources

- `omarchy/arzaroth.veil/LockView.qml`, `src/Model.mts`
