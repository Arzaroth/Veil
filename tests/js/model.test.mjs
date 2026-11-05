import { describe, expect, test } from "vitest";
import * as Model from "../../src/Model.mts";

const MINUTE = 60000;

describe("displayName", () => {
  test("capitalizes the login name", () => expect(Model.displayName("arzaroth")).toBe("Arzaroth"));
  test("is empty without a user", () => {
    expect(Model.displayName(undefined)).toBe("");
    expect(Model.displayName("")).toBe("");
  });
});

describe("lockedForText", () => {
  const at = 1_000_000;
  test("says nothing before the lock time is known", () => {
    expect(Model.lockedForText(0, at)).toBe("");
    expect(Model.lockedForText(undefined, at)).toBe("");
  });
  test("says nothing in the first minute", () => expect(Model.lockedForText(at, at + 59_999)).toBe(""));
  test("counts minutes under an hour", () => {
    expect(Model.lockedForText(at, at + MINUTE)).toBe("locked 1m");
    expect(Model.lockedForText(at, at + 59 * MINUTE)).toBe("locked 59m");
  });
  test("counts hours with zero-padded minutes", () => {
    expect(Model.lockedForText(at, at + 60 * MINUTE)).toBe("locked 1h 00m");
    expect(Model.lockedForText(at, at + 62 * MINUTE)).toBe("locked 1h 02m");
    expect(Model.lockedForText(at, at + 135 * MINUTE)).toBe("locked 2h 15m");
  });
  test("a clock that went backwards is not a negative duration", () => {
    expect(Model.lockedForText(at, at - 5 * MINUTE)).toBe("");
  });
});

describe("batteryText", () => {
  test("is empty without a battery", () => expect(Model.batteryText(false, 0.5, false)).toBe(""));
  test("rounds the level and picks the discharging icon", () => expect(Model.batteryText(true, 0.804, false)).toBe("󰁹 80%"));
  test("picks the charging icon", () => expect(Model.batteryText(true, 1, true)).toBe("󰂄 100%"));
  test("reads a missing level as zero", () => expect(Model.batteryText(true, undefined, false)).toBe("󰁹 0%"));
});

describe("infoText", () => {
  test("joins what is there", () => {
    expect(Model.infoText(["󰁹 80%", "locked 3m"])).toBe(`󰁹 80%${Model.INFO_SEPARATOR}locked 3m`);
  });
  test("drops empty parts", () => {
    expect(Model.infoText(["", "locked 3m", undefined])).toBe("locked 3m");
    expect(Model.infoText(["", ""])).toBe("");
  });
});

describe("brandingArt", () => {
  test("keeps the leading indentation and trims the trailing blank lines", () => {
    expect(Model.brandingArt("  ⣿⣿\n ⣿\n\n  \n")).toBe("  ⣿⣿\n ⣿");
  });
  test("is empty for an empty or missing file", () => {
    expect(Model.brandingArt("")).toBe("");
    expect(Model.brandingArt(null)).toBe("");
  });
});

describe("stabilizeDelayMs", () => {
  const now = 10_000_000;
  test("waits the short delay on stable screens", () => {
    expect(Model.stabilizeDelayMs(now, 0)).toBe(Model.STABILIZE_MS);
    expect(Model.stabilizeDelayMs(now, now - Model.HOTPLUG_WINDOW_MS)).toBe(Model.STABILIZE_MS);
  });
  test("waits the hotplug delay right after a monitor change", () => {
    expect(Model.stabilizeDelayMs(now, now - 1)).toBe(Model.HOTPLUG_STABILIZE_MS);
  });
  test("the short delay is still long enough to be shorter than the hotplug one", () => {
    expect(Model.STABILIZE_MS).toBeLessThan(Model.HOTPLUG_STABILIZE_MS);
  });
});

describe("screenNames", () => {
  test("keeps the named screens in order", () => {
    expect(Model.screenNames([{ name: "eDP-1" }, null, { name: "" }, { name: "DP-9" }])).toEqual(["eDP-1", "DP-9"]);
  });
  test("is empty without screens", () => {
    expect(Model.screenNames(undefined)).toEqual([]);
    expect(Model.screenNames([])).toEqual([]);
  });
});

describe("snapshots", () => {
  test("the capture command passes the epoch and every output as arguments", () => {
    expect(Model.snapshotCommand("/p", 7, ["eDP-1", "DP-9"])).toEqual(["/p/bin/snapshot", "capture", "7", "eDP-1", "DP-9"]);
  });
  test("parses one output and path per line", () => {
    expect(Model.parseSnapshots("eDP-1\t/run/a.jpg\nDP-9\t/run/b.jpg\n")).toEqual({ "eDP-1": "/run/a.jpg", "DP-9": "/run/b.jpg" });
  });
  test("ignores blank and malformed lines", () => {
    expect(Model.parseSnapshots("\nDP-1\t\n\t/x\nno-tab\na\tb\tc\nok\t/y")).toEqual({ ok: "/y" });
    expect(Model.parseSnapshots(undefined)).toEqual({});
  });
});

test("the unlock fade outlasts nothing it has to wait for", () => {
  expect(Model.UNLOCK_FADE_MS).toBeGreaterThan(0);
});
