import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts"],
    // Generated demo repos materialized at runtime are not our tests.
    exclude: ["**/node_modules/**", "**/dist/**", "**/data/**"],
  },
});
