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

export interface ClockFormats {
  readonly time: string;
  readonly date: string;
}

type ClockPartKind = "time" | "seconds" | "date" | "text";

interface ClockPart {
  readonly kind: ClockPartKind;
  readonly text: string;
}

const CLOCK_TOKEN = /'(?:[^']|'')*'?|AP|ap|A|a|([hHmsztdMyw])\1*|[^'APahHmsztdMyw]+/g;
const CLOCK_EDGE = /^[\s,;|/·-]+|[\s,;|/·-]+$/g;

function clockPartKind(token: string): ClockPartKind {
  if (/^(AP|ap|A|a|[hHmt]+)$/.test(token)) return "time";
  if (/^[sz]+$/.test(token)) return "seconds";
  if (/^[dMyw]+$/.test(token)) return "date";
  return "text";
}

function clockParts(format: string): ClockPart[] {
  const parts: ClockPart[] = [];
  for (const token of format.match(CLOCK_TOKEN) ?? []) {
    const kind = clockPartKind(token);
    if (kind === "seconds") {
      const before = parts[parts.length - 1];
      if (before?.kind === "text" && /^[:.,]$/.test(before.text)) parts.pop();
      continue;
    }
    parts.push({ kind, text: token });
  }
  return parts;
}

function joinParts(parts: ReadonlyArray<ClockPart>, needs: ClockPartKind): string {
  if (!parts.some((part) => part.kind === needs)) return "";
  return parts.map((part) => part.text).join("").replace(CLOCK_EDGE, "");
}

export function splitClockFormat(format: string | null | undefined): ClockFormats {
  const parts = clockParts(String(format ?? ""));
  const first = parts.findIndex((part) => part.kind === "time");
  if (first < 0) return { time: "", date: joinParts(parts, "date") };
  let last = parts.length - 1;
  while (parts[last]?.kind !== "time") last--;
  return {
    time: joinParts(parts.slice(first, last + 1), "time"),
    date: joinParts([...parts.slice(0, first), ...parts.slice(last + 1)], "date"),
  };
}

export const BAR_CLOCK_ID = "omarchy.clock";
export const BAR_CLOCK_DEFAULT_FORMAT = "dddd HH:mm";
export const BAR_SECTIONS = ["left", "centerBegin", "center", "centerEnd", "right", "tray"] as const;

export function barClockFormat(shellJson: string | null | undefined): string {
  let config: unknown;
  try {
    config = JSON.parse(String(shellJson ?? ""));
  } catch (error) {
    return "";
  }
  const bar = isRecord(config) ? config["bar"] : undefined;
  const layout = isRecord(bar) ? bar["layout"] : undefined;
  if (!isRecord(layout)) return "";
  let found = false;
  for (const name of BAR_SECTIONS) {
    const section = layout[name];
    if (!Array.isArray(section)) continue;
    for (const item of section) {
      if (!isRecord(item) || item["id"] !== BAR_CLOCK_ID) continue;
      const format = item["format"];
      if (typeof format === "string" && format.trim().length > 0) return format;
      found = true;
    }
  }
  return found ? BAR_CLOCK_DEFAULT_FORMAT : "";
}

export function isoWeek(date: Date): number {
  const day = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
  const yearStart = Date.UTC(day.getUTCFullYear(), 0, 1);
  return Math.ceil(((day.getTime() - yearStart) / 86400000 + 1) / 7);
}

export function withIsoWeek(format: string, date: Date): string {
  if (format.indexOf("ww") < 0) return format;
  const week = isoWeek(date);
  return format.replace(/ww/g, `${week < 10 ? "0" : ""}${week}`);
}

export function gecosName(passwdLine: string | null | undefined, user: string | null | undefined): string {
  const fields = String(passwdLine ?? "").trim().split(":");
  if (!user || fields[0] !== user) return "";
  const name = String(fields[4] ?? "").split(",")[0] ?? "";
  return name.replace(/&/g, displayName(user)).trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export type TomlValue = string | number | boolean;

export interface TomlRead {
  readonly values: Record<string, TomlValue>;
  readonly problems: string[];
}

const TOML_ESCAPES: Record<string, string> = { b: "\b", t: "\t", n: "\n", f: "\f", r: "\r", "\"": "\"", "\\": "\\" };

function tomlBasicString(body: string): string | null {
  let out = "";
  for (let i = 0; i < body.length; i++) {
    const c = body.charAt(i);
    if (c === "\"") return null;
    if (c !== "\\") {
      out += c;
      continue;
    }
    const e = body.charAt(++i);
    if (e in TOML_ESCAPES) {
      out += TOML_ESCAPES[e];
    } else if (e === "u" || e === "U") {
      const width = e === "u" ? 4 : 8;
      const hex = body.slice(i + 1, i + 1 + width);
      if (!/^[0-9A-Fa-f]+$/.test(hex) || hex.length !== width) return null;
      const code = parseInt(hex, 16);
      if (code > 0x10ffff) return null;
      out += String.fromCodePoint(code);
      i += width;
    } else {
      return null;
    }
  }
  return out;
}

function tomlValue(raw: string): TomlValue | undefined {
  const basic = /^"((?:[^"\\]|\\.)*)"\s*(?:#.*)?$/.exec(raw);
  if (basic) return tomlBasicString(basic[1] ?? "") ?? undefined;
  const literal = /^'([^']*)'\s*(?:#.*)?$/.exec(raw);
  if (literal) return literal[1] ?? "";
  const bare = /^([^\s#]+)\s*(?:#.*)?$/.exec(raw);
  const word = bare?.[1] ?? "";
  if (word === "true") return true;
  if (word === "false") return false;
  if (/^[+-]?(?:0|[1-9](?:_?\d)*)$/.test(word)) return Number(word.replace(/_/g, ""));
  return undefined;
}

export function parseToml(text: string | null | undefined): TomlRead {
  const values: Record<string, TomlValue> = {};
  const problems: string[] = [];
  let table = "";
  String(text ?? "").replace(/^﻿/, "").split(/\r?\n/).forEach((line, index) => {
    const at = `line ${index + 1}`;
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) return;
    const header = /^\[\s*([^\]]*?)\s*\]\s*(?:#.*)?$/.exec(trimmed);
    if (header) {
      table = header[1] || "?";
      problems.push(`${at}: Veil has no [${table}] table; its keys are ignored`);
      return;
    }
    const pair = /^([A-Za-z0-9_-]+)\s*=\s*(.*)$/.exec(trimmed);
    if (!pair) {
      problems.push(`${at}: not a key = value line; ignored`);
      return;
    }
    if (table) return;
    const key = pair[1] as string;
    const value = tomlValue(pair[2] ?? "");
    if (value === undefined) problems.push(`${at}: ${key} has a value Veil cannot read; ignored`);
    else if (key in values) problems.push(`${at}: ${key} is set twice; the first one is kept`);
    else values[key] = value;
  });
  return { values, problems };
}

export const BLANK_AFTER_MIN_S = 5;
export const BLANK_AFTER_MAX_S = 3600;

export interface Settings {
  displayName?: string;
  timeFormat?: string;
  dateFormat?: string;
  brandingPath?: string;
  branding?: boolean;
  blankAfter?: number;
}

export interface ResolvedSettings {
  readonly displayName: string;
  readonly timeFormat: string;
  readonly dateFormat: string;
  readonly brandingPath: string;
  readonly showBranding: boolean;
  readonly blankAfterMs: number;
}

export interface SettingsRead {
  readonly settings: Settings;
  readonly problems: string[];
}

export interface Environment {
  readonly user?: string | null;
  readonly home?: string | null;
  readonly clockFormat?: string | null;
  readonly fullName?: string | null;
}

export const DEFAULTS = {
  timeFormat: "HH:mm",
  dateFormat: "dddd d MMMM",
  brandingPath: "~/.config/omarchy/branding/about.txt",
  blankAfter: 30,
} as const;

const TEXT_KEYS = {
  display_name: "displayName",
  time_format: "timeFormat",
  date_format: "dateFormat",
  branding_path: "brandingPath",
} as const;
const KNOWN_KEYS = new Set<string>([...Object.keys(TEXT_KEYS), "branding", "blank_after"]);

export function readSettings(configText: string | null | undefined): SettingsRead {
  const { values, problems } = parseToml(configText);
  const settings: Settings = {};
  for (const key of Object.keys(values)) {
    if (!KNOWN_KEYS.has(key)) problems.push(`unknown setting "${key}" is ignored`);
  }
  for (const [key, field] of Object.entries(TEXT_KEYS)) {
    const value = values[key];
    if (value === undefined) continue;
    if (typeof value === "string" && value.trim().length > 0) settings[field] = value;
    else problems.push(`${key} must be a non-empty string; using the default`);
  }
  const branding = values["branding"];
  if (branding !== undefined) {
    if (typeof branding === "boolean") settings.branding = branding;
    else problems.push("branding must be true or false; using the default");
  }
  const blankAfter = values["blank_after"];
  if (blankAfter !== undefined) {
    if (typeof blankAfter === "number" && blankAfter >= BLANK_AFTER_MIN_S && blankAfter <= BLANK_AFTER_MAX_S) {
      settings.blankAfter = blankAfter;
    } else {
      problems.push(`blank_after must be a whole number of seconds from ${BLANK_AFTER_MIN_S} to ${BLANK_AFTER_MAX_S}; using the default`);
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
  const bar = splitClockFormat(env.clockFormat);
  return {
    displayName: chosen.displayName ?? (env.fullName || displayName(env.user)),
    timeFormat: chosen.timeFormat ?? (bar.time || DEFAULTS.timeFormat),
    dateFormat: chosen.dateFormat ?? (bar.date || DEFAULTS.dateFormat),
    brandingPath: expandHome(chosen.brandingPath ?? DEFAULTS.brandingPath, env.home),
    showBranding: chosen.branding ?? true,
    blankAfterMs: (chosen.blankAfter ?? DEFAULTS.blankAfter) * 1000,
  };
}

export function configPath(xdgConfigHome: string | null | undefined, home: string | null | undefined): string {
  return `${xdgConfigHome || `${home ?? ""}/.config`}/veil/config.toml`;
}

export function shellConfigPath(xdgConfigHome: string | null | undefined, home: string | null | undefined): string {
  return `${xdgConfigHome || `${home ?? ""}/.config`}/omarchy/shell.json`;
}
