export const STABILIZE_MS = 150;
export const HOTPLUG_STABILIZE_MS = 500;
export const HOTPLUG_WINDOW_MS = 2000;
export const UNLOCK_FADE_MS = 450;
export const INFO_SEPARATOR = "   ·   ";

export interface Screen {
  readonly name?: string | null;
}

export type SnapshotFiles = Record<string, string>;

export function displayName(user: string | null | undefined): string {
  const name = String(user ?? "");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function lockedForText(lockedAtMs: number | null | undefined, nowMs: number): string {
  if (!lockedAtMs || lockedAtMs <= 0) return "";
  const minutes = Math.floor((nowMs - lockedAtMs) / 60000);
  if (minutes < 1) return "";
  if (minutes < 60) return `locked ${minutes}m`;
  const rest = minutes % 60;
  return `locked ${Math.floor(minutes / 60)}h ${rest < 10 ? "0" : ""}${rest}m`;
}

export function batteryText(present: boolean, fraction: number | null | undefined, charging: boolean): string {
  if (!present) return "";
  const level = Math.round(Number(fraction ?? 0) * 100);
  return `${charging ? "󰂄 " : "󰁹 "}${level}%`;
}

export function infoText(parts: ReadonlyArray<string | null | undefined>): string {
  return parts.filter((part): part is string => !!part).join(INFO_SEPARATOR);
}

export function brandingArt(text: string | null | undefined): string {
  return String(text ?? "").replace(/\s+$/, "");
}

export function stabilizeDelayMs(nowMs: number, screensChangedAtMs: number): number {
  return nowMs - screensChangedAtMs < HOTPLUG_WINDOW_MS ? HOTPLUG_STABILIZE_MS : STABILIZE_MS;
}

export function screenNames(screens: ReadonlyArray<Screen | null | undefined> | null | undefined): string[] {
  const names: string[] = [];
  for (const screen of screens ?? []) {
    if (screen?.name) names.push(screen.name);
  }
  return names;
}

export function snapshotCommand(pluginDir: string, epoch: number, names: ReadonlyArray<string>): string[] {
  return [`${pluginDir}/bin/snapshot`, "capture", String(epoch), ...names];
}

export function parseSnapshots(text: string | null | undefined): SnapshotFiles {
  const files: SnapshotFiles = {};
  for (const line of String(text ?? "").split("\n")) {
    const parts = line.split("\t");
    const [output, path] = parts;
    if (parts.length === 2 && output && path) files[output] = path;
  }
  return files;
}
