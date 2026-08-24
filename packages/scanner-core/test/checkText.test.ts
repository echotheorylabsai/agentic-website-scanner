import { describe, it, expect } from "vitest";
import checkText from "../src/checkText.json";

/**
 * C1 golden: every adopted (checkId, status) pair in checkText.json must have its
 * text present verbatim in our probe source (the literal we emit for that outcome)
 * OR be a family na string emitted by relevance/engine gating.
 */
const FAMILY_NA = new Set([
  "No REST API surface detected on this domain",
  "No GraphQL surface detected on this domain",
  "No MCP server detected on this domain",
  "MCP server requires authentication",
  "No commerce signals detected - agent-payment protocols are optional for non-commerce sites",
]);

describe("checkText.json adopted pairs", () => {
  it("has no datum-risk strings (counts/URLs beyond static protocol paths)", () => {
    for (const pair of checkText.adopted as any[]) {
      const digits = pair.text.match(/\d+/g) ?? [];
      const allowed = new Set(["404", "410", "1.20.1", "0.2.0", "2" /* A2A protocol name */]);
      for (const d of digits) {
        expect(allowed.has(d), `${pair.checkId}/${pair.status}: live datum "${d}" in "${pair.text}"`).toBe(true);
      }
    }
  });

  it("every adopted pair's text is emitted by our code (probe literal or family na)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const probeDir = path.resolve(__dirname, "../src/probes");
    let corpus = "";
    for (const f of fs.readdirSync(probeDir)) {
      corpus += fs.readFileSync(path.join(probeDir, f), "utf8");
    }
    corpus += fs.readFileSync(path.resolve(__dirname, "../src/relevance.ts"), "utf8");
    corpus += fs.readFileSync(path.resolve(__dirname, "../src/engine.ts"), "utf8");
    for (const pair of checkText.adopted as any[]) {
      if (FAMILY_NA.has(pair.text)) continue; // family strings checked separately
      // probe literals may interpolate — match the longest static prefix (pre-backtick)
      const staticPrefix = pair.text.split("${")[0].slice(0, 60);
      expect(corpus.includes(staticPrefix), `${pair.checkId}/${pair.status}: "${staticPrefix}" not found in probe sources`).toBe(true);
    }
  });

  it("family na strings match NA_TEXT exactly", async () => {
    const { NA_TEXT } = await import("../src/relevance.js");
    for (const pair of checkText.adopted as any[]) {
      if (FAMILY_NA.has(pair.text)) {
        expect(Object.values(NA_TEXT)).toContain(pair.text);
      }
    }
  });

  it("known divergences documented", () => {
    expect((checkText as any)._meta.knownDivergences.length).toBeGreaterThanOrEqual(3);
  });
});
