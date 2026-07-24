import { describe, expect, it, beforeAll } from "vitest";

// Acceptance §8 #8: with no API key, generation fails with a clear error and no network
// call. env reads process.env at import, so clear the key before importing the module.
describe("generateBundle without an API key", () => {
  let generateBundle: (jd: string) => Promise<unknown>;

  beforeAll(async () => {
    delete process.env.ANTHROPIC_API_KEY;
    ({ generateBundle } = await import("./anthropic"));
  });

  it("rejects with a clear error", async () => {
    await expect(generateBundle("Senior Go Engineer")).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });
});
