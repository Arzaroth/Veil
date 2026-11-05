import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/js/**/*.test.mjs"],
    coverage: {
      provider: "v8",
      include: ["omarchy/**/*.js"],
      reporter: ["text-summary", "json-summary", "html", "lcov"],
      reportsDirectory: "coverage",
    },
  },
});
