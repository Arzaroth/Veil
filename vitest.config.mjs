import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/js/**/*.test.mjs"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.mts", "omarchy/**/*.js", "omarchy/**/*.mjs"],
      exclude: ["omarchy/**/Model.mjs"],
      reporter: ["text-summary", "json-summary", "html", "lcov"],
      reportsDirectory: "coverage",
    },
  },
});
