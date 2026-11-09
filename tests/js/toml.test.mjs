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

  test("CRLF and bare CR line endings", () => {
    expect(Model.parseToml("a = 1\r\nb = 'x'\r\n").values).toEqual({ a: 1, b: "x" });
    expect(Model.parseToml("a = 1\rb = 2").values).toEqual({ a: 1, b: 2 });
  });

  test("names every JS object inherits are ordinary keys", () => {
    const parsed = read("constructor = 1", "toString = 'x'", "__proto__ = 2");
    expect(parsed.problems).toEqual([]);
    expect(Object.keys(parsed.values)).toEqual(["constructor", "toString"]);
  });

  test("values it cannot read are reported and skipped", () => {
    for (const raw of ['"open', '"bad \\q escape"', '"\\u12"', '"\\U00110000"', '"\\uD800"', '"\\uDFFF"', '"a" "b"', "[1, 2]", "1.5", "01", "yes", ""]) {
      expect(read("ok = 1", `k = ${raw}`)).toEqual({ values: { ok: 1 }, problems: ["line 2: k has a value Veil cannot read; ignored"] });
    }
  });

  test("tables and their keys are ignored, once each", () => {
    expect(read("a = 1", "[colors]", "ink = 'red'", "[]", "b = 2")).toEqual({
      values: { a: 1 },
      problems: ["line 2: Veil has no tables; [colors] and its keys are ignored", "line 4: Veil has no tables; [] and its keys are ignored"],
    });
  });

  test("arrays of tables and odd headers are tables too", () => {
    expect(read("[[extra]]", "blank_after = 10", '["a]b"]', "c = 1")).toEqual({
      values: {},
      problems: ["line 1: Veil has no tables; [[extra]] and its keys are ignored", 'line 3: Veil has no tables; ["a]b"] and its keys are ignored'],
    });
  });

  test("a long unclosed header is read in linear time", () => {
    const started = Date.now();
    read("[a" + " ".repeat(300000) + "b");
    expect(Date.now() - started).toBeLessThan(1000);
  });

  test("multi-line strings are skipped whole, inner lines included", () => {
    const tick = "'".repeat(3);
    const dq = '"'.repeat(3);
    expect(read(`a = ${tick}`, 'time_format = "h:mm"', tick, "b = 1", `c = ${dq}one line${dq}`, "[t]", `d = ${dq}`, "e = 2", dq)).toEqual({
      values: { b: 1 },
      problems: [
        "line 1: a is a multi-line string, which Veil does not read; ignored",
        "line 5: c is a multi-line string, which Veil does not read; ignored",
        "line 6: Veil has no tables; [t] and its keys are ignored",
      ],
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
