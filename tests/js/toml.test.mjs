import { describe, expect, test } from "vitest";
import * as Model from "../../src/Model.mts";

const read = (...lines) => Model.parseToml(lines.join("\n"));

describe("parseToml", () => {
  test("nothing to read", () => {
    expect(Model.parseToml("")).toEqual({ values: {}, problems: [] });
    expect(Model.parseToml(null)).toEqual({ values: {}, problems: [] });
  });

  test("strings, integers and booleans, around comments and blank lines", () => {
    expect(read(
      "﻿# Veil",
      "",
      "name = \"Marc\"  # trailing comment",
      "path = '~/art\\raw.txt'",
      "  indented = 'x'",
      "seconds = 1_800",
      "negative = -5",
      "on = true",
      "off = false # off",
    )).toEqual({
      values: { name: "Marc", path: "~/art\\raw.txt", indented: "x", seconds: 1800, negative: -5, on: true, off: false },
      problems: [],
    });
  });

  test("escapes in basic strings", () => {
    expect(read('s = "a\\"b\\\\c\\n\\t\\u00e9\\U0001F600"').values.s).toBe("a\"b\\c\n\té😀");
    expect(read('h = "a # not a comment"').values.h).toBe("a # not a comment");
  });

  test("CRLF line endings", () => {
    expect(Model.parseToml("a = 1\r\nb = 'x'\r\n").values).toEqual({ a: 1, b: "x" });
  });

  test("values it cannot read are reported and skipped", () => {
    for (const raw of ['"open', '"bad \\q escape"', '"\\u12"', '"\\U00110000"', '"a" "b"', "[1, 2]", "1.5", "01", "yes", ""]) {
      expect(read("ok = 1", `k = ${raw}`)).toEqual({ values: { ok: 1 }, problems: ["line 2: k has a value Veil cannot read; ignored"] });
    }
  });

  test("tables and their keys are ignored, once each", () => {
    expect(read("a = 1", "[colors]", "ink = 'red'", "[]", "b = 2")).toEqual({
      values: { a: 1 },
      problems: ["line 2: Veil has no [colors] table; its keys are ignored", "line 4: Veil has no [?] table; its keys are ignored"],
    });
  });

  test("lines that are not key = value", () => {
    expect(read("just words", '"quoted" = 1', "a = 1")).toEqual({
      values: { a: 1 },
      problems: ["line 1: not a key = value line; ignored", "line 2: not a key = value line; ignored"],
    });
  });

  test("a key set twice keeps the first", () => {
    expect(read("a = 1", "a = 2")).toEqual({ values: { a: 1 }, problems: ["line 2: a is set twice; the first one is kept"] });
  });
});
