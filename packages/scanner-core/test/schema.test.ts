import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  publicScanReport, parseSseData, vendoredCatalog, assertCatalogVersion,
  isBonusOnly,
} from "../src/schema.js";

const fx = (p: string) => readFileSync(new URL(`./fixtures/${p}`, import.meta.url), "utf8");

describe("contracts", () => {
  it("parses real is-agentic reports strictly", () => {
    for (const f of ["real-report-vercel.json", "real-report-eve.json", "real-report-meta.json"]) {
      const r = publicScanReport.parse(JSON.parse(fx(f)));
      expect(r.score).toEqual(expect.any(Number));
    }
  });

  it("rejects unknown top-level keys", () => {
    const r = JSON.parse(fx("real-report-vercel.json"));
    expect(() => publicScanReport.parse({ ...r, rogue: true })).toThrow();
  });

  it("parses every frame of the fresh SSE capture", async () => {
    const lines = fx("sse-fresh.txt").split("\n").filter((l) => l.startsWith("data:"));
    expect(lines.length).toBeGreaterThan(50);
    const events = lines.map(parseSseData);
    const names = new Set(events.map((e) => (e as any).type));
    for (const expected of ["scan_init", "check_start", "check_complete", "layer_complete", "scan_complete", "relevance_assessed", "summary_ready", "scan_archived"]) {
      expect(names, `missing ${expected}`).toContain(expected);
    }
    // canonical order spot checks
    const order = events.map((e) => (e as any).type);
    expect(order.indexOf("scan_complete")).toBeLessThan(order.indexOf("relevance_assessed"));
    expect(order[order.length - 1]).toBe("scan_archived");
  });

  it("catalog parses verbatim and pins contractVersion", () => {
    assertCatalogVersion(vendoredCatalog);
    expect(vendoredCatalog.checks).toHaveLength(124);
    // tier vocabulary check: no 'essential' value exists
    const tiers = new Set(vendoredCatalog.checks.map((c) => c.essentialsTier));
    expect([...tiers].sort()).toEqual(["emerging", "recommended", "required"]);
  });

  it("bonus-only rule matches validated expectations", () => {
    const byId = Object.fromEntries(vendoredCatalog.checks.map((c) => [c.id, c]));
    // the single exception stays in the Essential pool
    expect(isBonusOnly(byId["markdown-negotiation-vary"])).toBe(false);
    // composite rule: native bonus OR essentialsBonusOnly ⇒ bonus-only pool
    for (const id of ["llms-txt-exists", "mcp-server-card", "sitemap-lastmod"]) {
      if (byId[id]) expect(isBonusOnly(byId[id]), id).toBe(true);
    }
    // negative case: a plain Essential check is not bonus-only
    expect(isBonusOnly(byId["agent-friendly-404"])).toBe(false);
  });

  it("rejects malformed SSE frames per event type", () => {
    expect(() => parseSseData('data: {"type":"check_complete","checkId":"x"}')).toThrow(); // missing required fields
    expect(() => parseSseData('data: {"type":"error","nope":1}')).toThrow();
    // unknown upstream types pass through the guard (last union member)
    expect(parseSseData('data: {"type":"some_future_event","x":1}')).toBeDefined();
  });
});
