import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const read = (path) => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), "utf8"));

test("the plugin manifest and package.json carry the same version", () => {
  expect(read("omarchy/arzaroth.veil/manifest.json").version).toBe(read("package.json").version);
});

test("the manifest names the plugin Veil", () => {
  const manifest = read("omarchy/arzaroth.veil/manifest.json");
  expect(manifest.id).toBe("arzaroth.veil");
  expect(manifest.entryPoints.service).toBe("Service.qml");
});
