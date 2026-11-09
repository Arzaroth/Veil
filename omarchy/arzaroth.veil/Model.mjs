export const STABILIZE_MS = 150;
export const HOTPLUG_STABILIZE_MS = 500;
export const HOTPLUG_WINDOW_MS = 2000;
export const UNLOCK_FADE_MS = 450;
export const INFO_SEPARATOR = "   ·   ";
export function displayName(user) {
    const name = String(user !== null && user !== void 0 ? user : "");
    return name.charAt(0).toUpperCase() + name.slice(1);
}
export function lockedForText(lockedAtMs, nowMs) {
    if (!lockedAtMs || lockedAtMs <= 0)
        return "";
    const minutes = Math.floor((nowMs - lockedAtMs) / 60000);
    if (minutes < 1)
        return "";
    if (minutes < 60)
        return `locked ${minutes}m`;
    const rest = minutes % 60;
    return `locked ${Math.floor(minutes / 60)}h ${rest < 10 ? "0" : ""}${rest}m`;
}
export function batteryText(present, fraction, charging) {
    if (!present)
        return "";
    const level = Math.round(Number(fraction !== null && fraction !== void 0 ? fraction : 0) * 100);
    return `${charging ? "󰂄 " : "󰁹 "}${level}%`;
}
export function infoText(parts) {
    return parts.filter((part) => !!part).join(INFO_SEPARATOR);
}
export function brandingArt(text) {
    return String(text !== null && text !== void 0 ? text : "").replace(/\s+$/, "");
}
export function stabilizeDelayMs(nowMs, screensChangedAtMs) {
    return nowMs - screensChangedAtMs < HOTPLUG_WINDOW_MS ? HOTPLUG_STABILIZE_MS : STABILIZE_MS;
}
export function screenNames(screens) {
    const names = [];
    for (const screen of screens !== null && screens !== void 0 ? screens : []) {
        if (screen === null || screen === void 0 ? void 0 : screen.name)
            names.push(screen.name);
    }
    return names;
}
export function snapshotCommand(pluginDir, epoch, names) {
    return [`${pluginDir}/bin/snapshot`, "capture", String(epoch), ...names];
}
export function parseSnapshots(text) {
    const files = {};
    for (const line of String(text !== null && text !== void 0 ? text : "").split("\n")) {
        const parts = line.split("\t");
        const [output, path] = parts;
        if (parts.length === 2 && output && path)
            files[output] = path;
    }
    return files;
}
const TOML_ESCAPES = { b: "\b", t: "\t", n: "\n", f: "\f", r: "\r", "\"": "\"", "\\": "\\" };
function tomlBasicString(body) {
    let out = "";
    for (let i = 0; i < body.length; i++) {
        const c = body.charAt(i);
        if (c === "\"")
            return null;
        if (c !== "\\") {
            out += c;
            continue;
        }
        const e = body.charAt(++i);
        if (e in TOML_ESCAPES) {
            out += TOML_ESCAPES[e];
        }
        else if (e === "u" || e === "U") {
            const width = e === "u" ? 4 : 8;
            const hex = body.slice(i + 1, i + 1 + width);
            if (!/^[0-9A-Fa-f]+$/.test(hex) || hex.length !== width)
                return null;
            const code = parseInt(hex, 16);
            if (code > 0x10ffff)
                return null;
            out += String.fromCodePoint(code);
            i += width;
        }
        else {
            return null;
        }
    }
    return out;
}
function tomlValue(raw) {
    var _a, _b, _c, _d;
    const basic = /^"((?:[^"\\]|\\.)*)"\s*(?:#.*)?$/.exec(raw);
    if (basic)
        return (_b = tomlBasicString((_a = basic[1]) !== null && _a !== void 0 ? _a : "")) !== null && _b !== void 0 ? _b : undefined;
    const literal = /^'([^']*)'\s*(?:#.*)?$/.exec(raw);
    if (literal)
        return (_c = literal[1]) !== null && _c !== void 0 ? _c : "";
    const bare = /^([^\s#]+)\s*(?:#.*)?$/.exec(raw);
    const word = (_d = bare === null || bare === void 0 ? void 0 : bare[1]) !== null && _d !== void 0 ? _d : "";
    if (word === "true")
        return true;
    if (word === "false")
        return false;
    if (/^[+-]?(?:0|[1-9](?:_?\d)*)$/.test(word))
        return Number(word.replace(/_/g, ""));
    return undefined;
}
export function parseToml(text) {
    const values = {};
    const problems = [];
    let table = "";
    String(text !== null && text !== void 0 ? text : "").replace(/^﻿/, "").split(/\r?\n/).forEach((line, index) => {
        var _a;
        const at = `line ${index + 1}`;
        const trimmed = line.trim();
        if (trimmed === "" || trimmed.startsWith("#"))
            return;
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
        if (table)
            return;
        const key = pair[1];
        const value = tomlValue((_a = pair[2]) !== null && _a !== void 0 ? _a : "");
        if (value === undefined)
            problems.push(`${at}: ${key} has a value Veil cannot read; ignored`);
        else if (key in values)
            problems.push(`${at}: ${key} is set twice; the first one is kept`);
        else
            values[key] = value;
    });
    return { values, problems };
}
export const PLUGIN_ID = "arzaroth.veil";
export const BLANK_AFTER_MIN_S = 5;
export const BLANK_AFTER_MAX_S = 3600;
export const DEFAULTS = {
    timeFormat: "HH:mm",
    dateFormat: "dddd d MMMM",
    brandingPath: "~/.config/omarchy/branding/about.txt",
    blankAfter: 30,
};
const TEXT_KEYS = ["displayName", "timeFormat", "dateFormat", "brandingPath"];
const KNOWN_KEYS = new Set(["id", ...TEXT_KEYS, "branding", "blankAfter"]);
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function readSettings(configText, pluginId = PLUGIN_ID) {
    const problems = [];
    let config;
    try {
        config = JSON.parse(String(configText !== null && configText !== void 0 ? configText : ""));
    }
    catch (_a) {
        return { settings: {}, problems: ["shell.json is not valid JSON; using the defaults"] };
    }
    const plugins = isRecord(config) ? config["plugins"] : undefined;
    const entry = Array.isArray(plugins) ? plugins.find((item) => isRecord(item) && item["id"] === pluginId) : undefined;
    if (!isRecord(entry))
        return { settings: {}, problems };
    const settings = {};
    for (const key of Object.keys(entry)) {
        if (!KNOWN_KEYS.has(key))
            problems.push(`unknown setting "${key}" is ignored`);
    }
    for (const key of TEXT_KEYS) {
        const value = entry[key];
        if (value === undefined)
            continue;
        if (typeof value === "string" && value.trim().length > 0)
            settings[key] = value;
        else
            problems.push(`${key} must be a non-empty string; using the default`);
    }
    const branding = entry["branding"];
    if (branding !== undefined) {
        if (typeof branding === "boolean")
            settings.branding = branding;
        else
            problems.push("branding must be true or false; using the default");
    }
    const blankAfter = entry["blankAfter"];
    if (blankAfter !== undefined) {
        if (typeof blankAfter === "number" && Number.isInteger(blankAfter)
            && blankAfter >= BLANK_AFTER_MIN_S && blankAfter <= BLANK_AFTER_MAX_S) {
            settings.blankAfter = blankAfter;
        }
        else {
            problems.push(`blankAfter must be a whole number of seconds from ${BLANK_AFTER_MIN_S} to ${BLANK_AFTER_MAX_S}; using the default`);
        }
    }
    return { settings, problems };
}
export function expandHome(path, home) {
    if (!home)
        return path;
    if (path === "~")
        return home;
    return path.startsWith("~/") ? `${home}${path.slice(1)}` : path;
}
export function resolveSettings(settings, env) {
    var _a, _b, _c, _d, _e, _f;
    const chosen = settings !== null && settings !== void 0 ? settings : {};
    return {
        displayName: (_a = chosen.displayName) !== null && _a !== void 0 ? _a : displayName(env.user),
        timeFormat: (_b = chosen.timeFormat) !== null && _b !== void 0 ? _b : DEFAULTS.timeFormat,
        dateFormat: (_c = chosen.dateFormat) !== null && _c !== void 0 ? _c : DEFAULTS.dateFormat,
        brandingPath: expandHome((_d = chosen.brandingPath) !== null && _d !== void 0 ? _d : DEFAULTS.brandingPath, env.home),
        showBranding: (_e = chosen.branding) !== null && _e !== void 0 ? _e : true,
        blankAfterMs: ((_f = chosen.blankAfter) !== null && _f !== void 0 ? _f : DEFAULTS.blankAfter) * 1000,
    };
}
export function configPath(xdgConfigHome, home) {
    return `${xdgConfigHome || `${home !== null && home !== void 0 ? home : ""}/.config`}/omarchy/shell.json`;
}
