import { describe, expect, test } from "vitest";
import * as Model from "../../src/Model.mts";

describe("splitClockFormat", () => {
  test.each([
    ["ddd d MMM HH:mm", "HH:mm", "ddd d MMM"],
    ["ddd d MMM h:mm AP", "h:mm AP", "ddd d MMM"],
    ["dddd HH:mm", "HH:mm", "dddd"],
    ["dddd h:mm:ss AP", "h:mm AP", "dddd"],
    ["dddd HH:mm:ss", "HH:mm", "dddd"],
    ["HH:mm", "HH:mm", ""],
    ["h:mm AP", "h:mm AP", ""],
    ["d MMMM 'W'ww yyyy", "", "d MMMM 'W'ww yyyy"],
    ["yyyy-MM-dd HH:mm", "HH:mm", "yyyy-MM-dd"],
    ["HH:mm, d MMM", "HH:mm", "d MMM"],
    ["HH:mm:ss.zzz", "HH:mm", ""],
    ["'at' HH 'h' mm", "HH 'h' mm", ""],
    ["ss", "", ""],
    ["", "", ""],
  ])("%j is time %j and date %j", (format, time, date) => {
    expect(Model.splitClockFormat(format)).toEqual({ time, date });
  });

  test("a missing format is empty", () => expect(Model.splitClockFormat(undefined)).toEqual({ time: "", date: "" }));
  test("an unclosed quote is kept as text", () => expect(Model.splitClockFormat("d MMM 'oops")).toEqual({ time: "", date: "d MMM 'oops" }));
});

describe("barClockFormat", () => {
  const shell = (bar) => JSON.stringify({ bar, plugins: [] });

  test("the clock's format, wherever it sits on the bar", () => {
    expect(Model.barClockFormat(shell({ left: [{ id: "omarchy.menu" }], center: [{ id: "omarchy.clock", format: "ddd d MMM HH:mm" }] }))).toBe("ddd d MMM HH:mm");
    expect(Model.barClockFormat(shell({ position: "top", right: [{ id: "omarchy.clock", format: "h:mm AP" }] }))).toBe("h:mm AP");
  });

  test("a clock without a format shows the bar's default", () => {
    expect(Model.barClockFormat(shell({ center: [{ id: "omarchy.clock" }] }))).toBe(Model.BAR_CLOCK_DEFAULT_FORMAT);
    expect(Model.barClockFormat(shell({ center: [{ id: "omarchy.clock", format: " " }] }))).toBe(Model.BAR_CLOCK_DEFAULT_FORMAT);
  });

  test("no clock, no bar or no JSON gives nothing", () => {
    expect(Model.barClockFormat(shell({ center: [{ id: "omarchy.menu" }, null] }))).toBe("");
    expect(Model.barClockFormat(JSON.stringify({ plugins: [] }))).toBe("");
    expect(Model.barClockFormat(JSON.stringify([1]))).toBe("");
    expect(Model.barClockFormat("{ nope")).toBe("");
    expect(Model.barClockFormat(undefined)).toBe("");
  });
});

describe("withIsoWeek", () => {
  test("replaces ww with the two-digit ISO week", () => {
    expect(Model.withIsoWeek("d MMMM 'W'ww yyyy", new Date(2026, 10, 9))).toBe("d MMMM 'W'46 yyyy");
    expect(Model.withIsoWeek("'W'ww", new Date(2026, 0, 1))).toBe("'W'01");
  });
  test("weeks that straddle the year", () => {
    expect(Model.isoWeek(new Date(2027, 0, 1))).toBe(53);
    expect(Model.isoWeek(new Date(2024, 11, 30))).toBe(1);
  });
  test("leaves a format without ww alone", () => expect(Model.withIsoWeek("dddd", new Date(2026, 10, 9))).toBe("dddd"));
});

describe("gecosName", () => {
  const line = (gecos) => `arzaroth:x:1000:1000:${gecos}:/home/arzaroth:/bin/zsh`;
  test("the full name, before the other comma fields", () => {
    expect(Model.gecosName(line("Marc-Etienne Barrut,,,"), "arzaroth")).toBe("Marc-Etienne Barrut");
    expect(Model.gecosName(line(" Marc "), "arzaroth")).toBe("Marc");
  });
  test("& stands for the login", () => expect(Model.gecosName(line("& Admin"), "arzaroth")).toBe("Arzaroth Admin"));
  test("empty when unset, for someone else or with no user", () => {
    expect(Model.gecosName(line(""), "arzaroth")).toBe("");
    expect(Model.gecosName(line("Marc"), "other")).toBe("");
    expect(Model.gecosName(line("Marc"), "")).toBe("");
    expect(Model.gecosName("arzaroth:x", "arzaroth")).toBe("");
    expect(Model.gecosName(undefined, "arzaroth")).toBe("");
  });
});
