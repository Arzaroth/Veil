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

export const PLUGIN_ID = "arzaroth.veil";
export const BLANK_AFTER_MIN_S = 5;
export const BLANK_AFTER_MAX_S = 3600;

export interface Settings {
  displayName?: string;
  timeFormat?: string;
  dateFormat?: string;
  brandingPath?: string;
  blankAfter?: number;
}

export interface ResolvedSettings {
  readonly displayName: string;
  readonly timeFormat: string;
  readonly dateFormat: string;
  readonly brandingPath: string;
  readonly blankAfterMs: number;
}

export interface SettingsRead {
  readonly settings: Settings;
  readonly problems: string[];
}

export interface Environment {
  readonly user?: string | null;
  readonly home?: string | null;
}

export const DEFAULTS = {
  timeFormat: "HH:mm",
  dateFormat: "dddd d MMMM",
  brandingPath: "~/.config/omarchy/branding/about.txt",
  blankAfter: 30,
} as const;

const TEXT_KEYS = ["displayName", "timeFormat", "dateFormat", "brandingPath"] as const;
const KNOWN_KEYS = new Set<string>(["id", ...TEXT_KEYS, "blankAfter"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readSettings(configText: string | null | undefined, pluginId: string = PLUGIN_ID): SettingsRead {
  const problems: string[] = [];
  let config: unknown;
  try {
    config = JSON.parse(String(configText ?? ""));
  } catch {
    return { settings: {}, problems: ["shell.json is not valid JSON; using the defaults"] };
  }
  const plugins = isRecord(config) ? config["plugins"] : undefined;
  const entry = Array.isArray(plugins) ? plugins.find((item) => isRecord(item) && item["id"] === pluginId) : undefined;
  if (!isRecord(entry)) return { settings: {}, problems };

  const settings: Settings = {};
  for (const key of Object.keys(entry)) {
    if (!KNOWN_KEYS.has(key)) problems.push(`unknown setting "${key}" is ignored`);
  }
  for (const key of TEXT_KEYS) {
    const value = entry[key];
    if (value === undefined) continue;
    if (typeof value === "string" && value.trim().length > 0) settings[key] = value;
    else problems.push(`${key} must be a non-empty string; using the default`);
  }
  const blankAfter = entry["blankAfter"];
  if (blankAfter !== undefined) {
    if (typeof blankAfter === "number" && Number.isInteger(blankAfter)
        && blankAfter >= BLANK_AFTER_MIN_S && blankAfter <= BLANK_AFTER_MAX_S) {
      settings.blankAfter = blankAfter;
    } else {
      problems.push(`blankAfter must be a whole number of seconds from ${BLANK_AFTER_MIN_S} to ${BLANK_AFTER_MAX_S}; using the default`);
    }
  }
  return { settings, problems };
}

export function expandHome(path: string, home: string | null | undefined): string {
  if (!home) return path;
  if (path === "~") return home;
  return path.startsWith("~/") ? `${home}${path.slice(1)}` : path;
}

export function resolveSettings(settings: Settings | null | undefined, env: Environment): ResolvedSettings {
  const chosen = settings ?? {};
  return {
    displayName: chosen.displayName ?? displayName(env.user),
    timeFormat: chosen.timeFormat ?? DEFAULTS.timeFormat,
    dateFormat: chosen.dateFormat ?? DEFAULTS.dateFormat,
    brandingPath: expandHome(chosen.brandingPath ?? DEFAULTS.brandingPath, env.home),
    blankAfterMs: (chosen.blankAfter ?? DEFAULTS.blankAfter) * 1000,
  };
}

export function configPath(xdgConfigHome: string | null | undefined, home: string | null | undefined): string {
  return `${xdgConfigHome || `${home ?? ""}/.config`}/omarchy/shell.json`;
}
