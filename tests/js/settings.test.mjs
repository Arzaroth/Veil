import { describe, expect, test } from "vitest";
import * as Model from "../../src/Model.mts";

const toml = (...lines) => Model.readSettings(lines.join("\n"));

describe("readSettings", () => {
  test("no file or an empty one, no settings and no complaint", () => {
    expect(Model.readSettings("")).toEqual({ settings: {}, problems: [] });
    expect(Model.readSettings(undefined)).toEqual({ settings: {}, problems: [] });
    expect(toml("# nothing set")).toEqual({ settings: {}, problems: [] });
  });

  test("reads every key", () => {
    expect(toml(
      'display_name = "Marc"',
      'time_format = "h:mm AP"',
      'date_format = "d MMM"',
      "branding = false",
      "branding_path = '~/art.txt'",
      "blank_after = 60",
    )).toEqual({ settings: { displayName: "Marc", timeFormat: "h:mm AP", dateFormat: "d MMM", branding: false, brandingPath: "~/art.txt", blankAfter: 60 }, problems: [] });
  });

  test("what the file cannot say is reported, and the rest still read", () => {
    expect(toml("[colors]", 'display_name = "Marc"')).toEqual({ settings: {}, problems: ["line 1: Veil has no [colors] table; its keys are ignored"] });
    expect(toml("time_format = HH", 'date_format = "d"')).toEqual({ settings: { dateFormat: "d" }, problems: ["line 1: time_format has a value Veil cannot read; ignored"] });
  });

  test("wrong types and blank text are dropped one by one", () => {
    const read = toml('display_name = "  "', "time_format = 12", 'date_format = "d"', "branding_path = true");
    expect(read.settings).toEqual({ dateFormat: "d" });
    expect(read.problems).toEqual([
      "display_name must be a non-empty string; using the default",
      "time_format must be a non-empty string; using the default",
      "branding_path must be a non-empty string; using the default",
    ]);
  });

  test("blank_after is whole seconds within bounds", () => {
    const blank = (value) => toml(`blank_after = ${value}`);
    expect(blank(Model.BLANK_AFTER_MIN_S).settings.blankAfter).toBe(Model.BLANK_AFTER_MIN_S);
    expect(blank(Model.BLANK_AFTER_MAX_S).settings.blankAfter).toBe(Model.BLANK_AFTER_MAX_S);
    for (const bad of [Model.BLANK_AFTER_MIN_S - 1, Model.BLANK_AFTER_MAX_S + 1, '"30"', "true"]) {
      const read = blank(bad);
      expect(read.settings.blankAfter).toBeUndefined();
      expect(read.problems).toEqual([`blank_after must be a whole number of seconds from ${Model.BLANK_AFTER_MIN_S} to ${Model.BLANK_AFTER_MAX_S}; using the default`]);
    }
  });

  test("branding is a boolean", () => {
    expect(toml("branding = true")).toEqual({ settings: { branding: true }, problems: [] });
    for (const bad of ['"false"', "0"]) {
      expect(toml(`branding = ${bad}`)).toEqual({ settings: {}, problems: ["branding must be true or false; using the default"] });
    }
  });

  test("an unknown key is reported, so a typo is not silent", () => {
    expect(toml('timeformat = "HH"', 'displayName = "x"').problems).toEqual(['unknown setting "timeformat" is ignored', 'unknown setting "displayName" is ignored']);
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
  test("the name is the full name when the system has one", () => {
    expect(Model.resolveSettings({}, { ...env, fullName: "Marc-Etienne Barrut" }).displayName).toBe("Marc-Etienne Barrut");
    expect(Model.resolveSettings({}, { ...env, fullName: "" }).displayName).toBe("Arzaroth");
    expect(Model.resolveSettings({ displayName: "Marc" }, { ...env, fullName: "Marc-Etienne Barrut" }).displayName).toBe("Marc");
  });
  test("unset formats follow the bar clock", () => {
    const bar = (clockFormat, settings = {}) => Model.resolveSettings(settings, { ...env, clockFormat });
    expect(bar("ddd d MMM h:mm AP")).toMatchObject({ timeFormat: "h:mm AP", dateFormat: "ddd d MMM" });
    expect(bar("HH:mm:ss")).toMatchObject({ timeFormat: "HH:mm", dateFormat: Model.DEFAULTS.dateFormat });
    expect(bar("d MMMM 'W'ww yyyy")).toMatchObject({ timeFormat: Model.DEFAULTS.timeFormat, dateFormat: "d MMMM 'W'ww yyyy" });
    expect(bar("ddd d MMM h:mm AP", { timeFormat: "HH", dateFormat: "d" })).toMatchObject({ timeFormat: "HH", dateFormat: "d" });
  });
  test("branding: false hides it", () => expect(Model.resolveSettings({ branding: false }, env).showBranding).toBe(false));
});

describe("shellConfigPath", () => {
  test("follows XDG_CONFIG_HOME", () => expect(Model.shellConfigPath("/x/conf", "/home/u")).toBe("/x/conf/omarchy/shell.json"));
  test("falls back to ~/.config", () => expect(Model.shellConfigPath("", "/home/u")).toBe("/home/u/.config/omarchy/shell.json"));
});

describe("configPath", () => {
  test("follows XDG_CONFIG_HOME", () => expect(Model.configPath("/x/conf", "/home/u")).toBe("/x/conf/veil/config.toml"));
  test("falls back to ~/.config", () => expect(Model.configPath("", "/home/u")).toBe("/home/u/.config/veil/config.toml"));
});
