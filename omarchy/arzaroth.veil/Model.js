var STABILIZE_MS = 150
var HOTPLUG_STABILIZE_MS = 500
var HOTPLUG_WINDOW_MS = 2000
var UNLOCK_FADE_MS = 450
var INFO_SEPARATOR = "   ·   "

function displayName(user) {
  var name = String(user || "")
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function lockedForText(lockedAtMs, nowMs) {
  if (!(lockedAtMs > 0)) return ""
  var minutes = Math.floor((nowMs - lockedAtMs) / 60000)
  if (minutes < 1) return ""
  if (minutes < 60) return "locked " + minutes + "m"
  var rest = minutes % 60
  return "locked " + Math.floor(minutes / 60) + "h " + (rest < 10 ? "0" : "") + rest + "m"
}

function batteryText(present, fraction, charging) {
  if (!present) return ""
  var level = Math.round(Number(fraction || 0) * 100)
  return (charging ? "󰂄 " : "󰁹 ") + level + "%"
}

function infoText(parts) {
  return parts.filter(function(part) { return !!part }).join(INFO_SEPARATOR)
}

function brandingArt(text) {
  return String(text || "").replace(/\s+$/, "")
}

function stabilizeDelayMs(nowMs, screensChangedAtMs) {
  return nowMs - screensChangedAtMs < HOTPLUG_WINDOW_MS ? HOTPLUG_STABILIZE_MS : STABILIZE_MS
}

function screenNames(screens) {
  var names = []
  for (var i = 0; i < (screens || []).length; i++) {
    if (screens[i] && screens[i].name) names.push(screens[i].name)
  }
  return names
}

function snapshotCommand(pluginDir, epoch, names) {
  return [pluginDir + "/bin/snapshot", "capture", String(epoch)].concat(names)
}

function parseSnapshots(text) {
  var files = {}
  String(text || "").split("\n").forEach(function(line) {
    var parts = line.split("\t")
    if (parts.length === 2 && parts[0].length > 0 && parts[1].length > 0) files[parts[0]] = parts[1]
  })
  return files
}

if (typeof module !== "undefined") {
  module.exports = {
    STABILIZE_MS: STABILIZE_MS,
    HOTPLUG_STABILIZE_MS: HOTPLUG_STABILIZE_MS,
    HOTPLUG_WINDOW_MS: HOTPLUG_WINDOW_MS,
    UNLOCK_FADE_MS: UNLOCK_FADE_MS,
    INFO_SEPARATOR: INFO_SEPARATOR,
    displayName: displayName,
    lockedForText: lockedForText,
    batteryText: batteryText,
    infoText: infoText,
    brandingArt: brandingArt,
    stabilizeDelayMs: stabilizeDelayMs,
    screenNames: screenNames,
    snapshotCommand: snapshotCommand,
    parseSnapshots: parseSnapshots
  }
}
