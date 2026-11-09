# Lock screen

What each monitor shows while locked, top to bottom:

- **Clock** (`time_format`) and **date** (`date_format`, in your locale).
  Unset, both follow the bar clock (`omarchy.clock`'s `format` in
  `shell.json`, `Model.barClockFormat`), split by `Model.splitClockFormat`
  into its time and date parts with seconds dropped; a part the bar lacks
  falls back to `HH:mm` / `dddd d MMMM`. `ww` in the date is the ISO week
  (`Model.withIsoWeek`), as the bar does it.
- **Name** (`display_name`). Unset, the GECOS full name (`getent passwd`,
  `Model.gecosName`, `&` is the login), else the login capitalized.
- **Password field**, upstream's, with the fingerprint icon when a finger is
  enrolled. A wrong password shakes it and shows upstream's message.
- **Info line**: the battery (charging icon when plugged in) and, after a
  minute, how long the screen has been locked (`locked 14m`, `locked 1h 05m`).
  Parts without data are left out.
- **Branding art** at the bottom, from `branding_path` (default
  `~/.config/omarchy/branding/about.txt`, the fastfetch art), watched for
  changes. Missing or empty shows the Omarchy wordmark instead, and
  `branding = false` hides both.

All text uses the theme's lock colour lightened (`ink`) over a dimmed, blurred
wallpaper. The name, formats and art path are settings: see
[settings.md](settings.md).

## Sources

- `omarchy/arzaroth.veil/LockView.qml`, `src/Model.mts`
