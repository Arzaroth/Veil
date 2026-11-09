import { describe, expect, test } from "vitest";
import * as Model from "../../src/Model.mts";

const config = (entry, extra = {}) => JSON.stringify({ bar: {}, plugins: [{ id: "other.plugin", displayName: "x" }, entry], ...extra });

describe("readSettings", () => {
  test("no entry, no settings and no complaint", () => {
    expect(Model.readSettings(JSON.stringify({ plugins: [] }))).toEqual({ settings: {}, problems: [] });
    expect(Model.readSettings(JSON.stringify({ bar: {} }))).toEqual({ settings: {}, problems: [] });
    expect(Model.readSettings(JSON.stringify([1, 2]))).toEqual({ settings: {}, problems: [] });
  });

  test("reads Veil's own entry and nobody else's", () => {
    const read = Model.readSettings(config({ id: "arzaroth.veil", displayName: "Marc", timeFormat: "h:mm AP", dateFormat: "d MMM", brandingPath: "~/art.txt", blankAfter: 60 }));
    expect(read).toEqual({ settings: { displayName: "Marc", timeFormat: "h:mm AP", dateFormat: "d MMM", brandingPath: "~/art.txt", blankAfter: 60 }, problems: [] });
  });

  test("a plugin id can be given", () => {
    expect(Model.readSettings(config({ id: "someone.veil", timeFormat: "HH" }), "someone.veil").settings).toEqual({ timeFormat: "HH" });
  });

  test("broken JSON keeps the defaults and says so", () => {
    const read = Model.readSettings("{ nope");
    expect(read.settings).toEqual({});
    expect(read.problems).toEqual(["shell.json is not valid JSON; using the defaults"]);
    expect(Model.readSettings(undefined).problems).toHaveLength(1);
  });

  test("wrong types and blank text are dropped one by one", () => {
    const read = Model.readSettings(config({ id: "arzaroth.veil", displayName: "  ", timeFormat: 12, dateFormat: "d", brandingPath: null }));
    expect(read.settings).toEqual({ dateFormat: "d" });
    expect(read.problems).toEqual([
      "displayName must be a non-empty string; using the default",
      "timeFormat must be a non-empty string; using the default",
      "brandingPath must be a non-empty string; using the default",
    ]);
  });

  test("blankAfter is whole seconds within bounds", () => {
    const blank = (value) => Model.readSettings(config({ id: "arzaroth.veil", blankAfter: value }));
    expect(blank(Model.BLANK_AFTER_MIN_S).settings.blankAfter).toBe(Model.BLANK_AFTER_MIN_S);
    expect(blank(Model.BLANK_AFTER_MAX_S).settings.blankAfter).toBe(Model.BLANK_AFTER_MAX_S);
    for (const bad of [Model.BLANK_AFTER_MIN_S - 1, Model.BLANK_AFTER_MAX_S + 1, 12.5, "30", null]) {
      const read = blank(bad);
      expect(read.settings.blankAfter).toBeUndefined();
      expect(read.problems[0]).toMatch(/^blankAfter must be a whole number/);
    }
  });

  test("branding is a boolean", () => {
    const branding = (value) => Model.readSettings(config({ id: "arzaroth.veil", branding: value }));
    expect(branding(false)).toEqual({ settings: { branding: false }, problems: [] });
    expect(branding(true)).toEqual({ settings: { branding: true }, problems: [] });
    for (const bad of ["false", 0, null]) {
      expect(branding(bad)).toEqual({ settings: {}, problems: ["branding must be true or false; using the default"] });
    }
  });

  test("an unknown key is reported, so a typo is not silent", () => {
    expect(Model.readSettings(config({ id: "arzaroth.veil", timeformat: "HH" })).problems).toEqual(['unknown setting "timeformat" is ignored']);
  });
});

describe("expandHome", () => {
  test("expands a leading ~", () => {
    expect(Model.expandHome("~/a/b", "/home/u")).toBe("/home/u/a/b");
    expect(Model.expandHome("~", "/home/u")).toBe("/home/u");
  });
  test("leaves other paths alone", () => {
    expect(Model.expandHome("/etc/x", "/home/u")).toBe("/etc/x");
    expect(Model.expandHome("~other/x", "/home/u")).toBe("~other/x");
  });
  test("without a home there is nothing to expand", () => expect(Model.expandHome("~/x", "")).toBe("~/x"));
});

describe("resolveSettings", () => {
  const env = { user: "arzaroth", home: "/home/arzaroth" };
  test("defaults", () => {
    expect(Model.resolveSettings({}, env)).toEqual({
      displayName: "Arzaroth",
      timeFormat: "HH:mm",
      dateFormat: "dddd d MMMM",
      brandingPath: "/home/arzaroth/.config/omarchy/branding/about.txt",
      showBranding: true,
      blankAfterMs: 30000,
    });
    expect(Model.resolveSettings(undefined, env).blankAfterMs).toBe(30000);
  });
  test("settings win over the defaults", () => {
    expect(Model.resolveSettings({ displayName: "Marc", timeFormat: "h:mm", dateFormat: "d", brandingPath: "~/art.txt", blankAfter: 90 }, env)).toEqual({
      displayName: "Marc", timeFormat: "h:mm", dateFormat: "d", brandingPath: "/home/arzaroth/art.txt", showBranding: true, blankAfterMs: 90000,
    });
  });
  test("branding: false hides it", () => expect(Model.resolveSettings({ branding: false }, env).showBranding).toBe(false));
});

describe("configPath", () => {
  test("follows XDG_CONFIG_HOME", () => expect(Model.configPath("/x/conf", "/home/u")).toBe("/x/conf/omarchy/shell.json"));
  test("falls back to ~/.config", () => expect(Model.configPath("", "/home/u")).toBe("/home/u/.config/omarchy/shell.json"));
});
