import { describe, it, expect } from "vitest";
import { runScan } from "../src/engine.js";
import { startFixtureServer } from "./utils/fixtureServer.js";

/**
 * Regression guard (review B1): the phase-3 gating skip must not prevent
 * payments probes from running — commerce signals are discovered by the
 * phase-1 CommerceSignalsDetector reading ctx.homepage.
 */
const HOME = `<html><head><title>T</title></head><body><h1>Shop</h1>
<p>We support x402 payments, UCP and ACP protocols, AP2 delegate payments and MPP.
Check our pricing, cart and checkout.</p>${"<p>lorem ipsum dolor sit amet </p>".repeat(40)}</body></html>`;

describe("commerce regression (engine-level)", () => {
  it("payments probes run and pass when homepage carries commerce signals", async () => {
    const fx = await startFixtureServer({ "/": (_q, res) => { res.setHeader("content-type", "text/html"); res.end(HOME); } });
    let out: any = null;
    for await (const ev of runScan(fx.base, { onComplete: async (o) => { out = o; } })) { void ev; }
    const x402 = out!.gated.find((g) => g.id === "x402-support");
    expect(x402!.status).toBe("pass"); // probe ran (not blanket-na)
    await fx.close();
  }, 60_000);

  it("payments checks are gated na on non-commerce sites", async () => {
    const fx = await startFixtureServer({
      "/": (_q, res) => { res.setHeader("content-type", "text/html"); res.end(`<html><head><title>T</title></head><body><h1>T</h1>${"<p>lorem ipsum </p>".repeat(50)}</body></html>`); },
    });
    let out: any = null;
    for await (const ev of runScan(fx.base, { onComplete: async (o) => { out = o; } })) { void ev; }
    const x402 = out!.gated.find((g) => g.id === "x402-support");
    expect(x402!.status).toBe("na");
    expect(x402!.details).toContain("No commerce signals detected");
    await fx.close();
  }, 60_000);
});
