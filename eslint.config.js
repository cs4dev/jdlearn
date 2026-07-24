import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.vite/**",
      "**/routeTree.gen.ts",
      "**/coverage/**",
      // Generated demo repos materialized at runtime — not our source.
      "**/data/**",
    ],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      // RULES R(logging): no bare console in production code.
      "no-console": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // tests + config may use console
    files: ["**/*.test.ts", "**/*.config.{ts,js}", "**/vite.config.ts"],
    rules: { "no-console": "off" },
  },
);
