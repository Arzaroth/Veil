export const STABILIZE_MS = 150;
export const HOTPLUG_STABILIZE_MS = 500;
export const HOTPLUG_WINDOW_MS = 2000;
export const UNLOCK_FADE_MS = 450;
export const INFO_SEPARATOR = "   ·   ";
export function displayName(user) {
    const name = String(user ?? "");
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
    const level = Math.round(Number(fraction ?? 0) * 100);
    return `${charging ? "󰂄 " : "󰁹 "}${level}%`;
}
export function infoText(parts) {
    return parts.filter((part) => !!part).join(INFO_SEPARATOR);
}
export function brandingArt(text) {
    return String(text ?? "").replace(/\s+$/, "");
}
export function stabilizeDelayMs(nowMs, screensChangedAtMs) {
    return nowMs - screensChangedAtMs < HOTPLUG_WINDOW_MS ? HOTPLUG_STABILIZE_MS : STABILIZE_MS;
}
export function screenNames(screens) {
    const names = [];
    for (const screen of screens ?? []) {
        if (screen?.name)
            names.push(screen.name);
    }
    return names;
}
export function snapshotCommand(pluginDir, epoch, names) {
    return [`${pluginDir}/bin/snapshot`, "capture", String(epoch), ...names];
}
export function parseSnapshots(text) {
    const files = {};
    for (const line of String(text ?? "").split("\n")) {
        const parts = line.split("\t");
        const [output, path] = parts;
        if (parts.length === 2 && output && path)
            files[output] = path;
    }
    return files;
}
