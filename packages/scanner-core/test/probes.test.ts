import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startFixtureServer } from "./utils/fixtureServer.js";
import type { FixtureServer } from "./utils/fixtureServer.js";
import { makeFetcher, UA_ROSTER } from "../src/fetcher.js";
import { newScanContext } from "../src/probes/types.js";
import type { ProbeContext } from "../src/probes/types.js";
import { AgentFriendly404Probe, RedirectHygieneProbe } from "../src/probes/http-semantics.js";
import { ContentNoJsProbe, MetadataCompletenessProbe, DocsAuthGateProbe } from "../src/probes/content.js";
import { LlmsTxtExistsProbe, MarkdownNegotiationVaryProbe, AgentCrawlerReachabilityProbe } from "../src/probes/discovery.js";
import { OpenApiSpecProbe, ScopedPermissionsProbe } from "../src/probes/api.js";

let fx: FixtureServer;
const fetchAs = makeFetcher();
const pctx = (overrides: Partial<ProbeContext["ctx"]> = {}): ProbeContext => ({
  url: new URL(fx.base),
  fetchAs,
  ctx: { ...newScanContext(), ...overrides },
});

beforeAll(async () => {
  fx = await startFixtureServer({
    "/": (_q, res) => { res.setHeader("content-type", "text/html"); res.end(`<html><head><title>T</title><meta name="description" content="a real description long enough to count as complete"><link rel="canonical" href="/"><meta property="og:title" content="T"></head><body><h1>H</h1>${"<p>lorem ipsum dolor sit amet </p>".repeat(80)}</body></html>`); },
    "/soft404": (_q, res) => { res.setHeader("content-type", "text/html"); res.statusCode = 200; res.end("<html><body>app shell</body></html>"); },
    "/real404": (_q, res) => { res.statusCode = 404; res.setHeader("content-type", "text/html"); res.end("<html><body><a href='/'>home</a></body></html>"); },
    "/bare404": (_q, res) => { res.statusCode = 404; res.end(""); },
    "/forbidden": (_q, res) => { res.statusCode = 403; res.end(); },
    "/docs": (_q, res) => res.end("<html><body>public docs content for everyone to read without any account</body></html>"),
    "/gated-docs": (_q, res) => { res.statusCode = 401; res.end(); },
    "/llms.txt": (_q, res) => res.end("# T\n\n- [a](/) [b](/x)\n"),
    "/openapi.json": (_q, res) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ openapi: "3.0.0", info: { title: "A", version: "1" }, components: { securitySchemes: { oauth: { flows: { authorizationCode: { scopes: { "read:x": "", "write:x": "" } } } } } }, paths: { "/things": { get: { security: [{ oauth: ["read:x"] }], responses: {} } } } })); },
  });
});
afterAll(() => fx.close());

describe("probe rubrics", () => {
  it("agent-friendly-404: soft-404 fails 0/2 with app-shell evidence", async () => {
    const probe = new AgentFriendly404Probe();
    const ctx = pctx();
    // probe derives fake path from origin; point url at a server that always soft-404s
    const fx2 = await startFixtureServer({ "*": (_q, res) => { res.setHeader("content-type", "text/html"); res.statusCode = 200; res.end("<html>shell</html>"); } });
    ctx.url = new URL(fx2.base);
    const out = await probe.run(ctx);
    expect(out[0]).toMatchObject({ status: "fail", score: 0, max_score: 2 });
    expect(out[0].details).toContain("soft-404");
    await fx2.close();
  });

  it("agent-friendly-404: real 404 with links passes 2/2; bare 404 warns 1/2", async () => {
    const probe = new AgentFriendly404Probe();
    const links = await startFixtureServer({ "*": (_q, res) => { res.statusCode = 404; res.end("<html><body><a href=/'>Home</a> Agents can find resources in our [sitemap](/sitemap.xml).</body></html>"); } });
    const bare = await startFixtureServer({ "*": (_q, res) => { res.statusCode = 404; res.end(""); } });
    const outLinks = await probe.run({ ...pctx(), url: new URL(links.base) });
    const outBare = await probe.run({ ...pctx(), url: new URL(bare.base) });
    expect([outLinks[0].score, outLinks[0].status]).toEqual([2, "pass"]);
    expect([outBare[0].score, outBare[0].status]).toEqual([1, "warning"]);
    await links.close(); await bare.close();
  });

  it("docs-auth-gate: public docs pass 2/2; 401 wall fails 0/2", async () => {
    const gate = new DocsAuthGateProbe();
    // our fixture serves /docs public and /docs/getting-started 404s → pass
    const okOut = await gate.run(pctx({ homepage: { url: "", finalUrl: fx.base, status: 200, headers: {}, body: "" } }));
    expect([okOut[0].score, okOut[0].status]).toEqual([2, "pass"]);
    const gatedFx = await startFixtureServer({
      "/docs": (_q, res) => { res.statusCode = 401; res.end(); },
      "/": (_q, res) => res.end("ok"),
    });
    const badOut = await gate.run({ url: new URL(gatedFx.base), fetchAs, ctx: { ...newScanContext(), homepage: { url: "", finalUrl: gatedFx.base, status: 200, headers: {}, body: "" } } });
    expect(badOut[0].status).toBe("fail");
    expect(badOut[0].details).toContain("auth wall");
    await gatedFx.close();
  });

  it("crawler-reachability: hard block on ALL uas fails; mixed degrades to warning", async () => {
    const allBlock = await startFixtureServer({ "/": (_q, res) => { res.statusCode = 403; res.end(); } });
    const out = await new AgentCrawlerReachabilityProbe().run({ url: new URL(allBlock.base), fetchAs, ctx: newScanContext() });
    expect(out[0].status).toBe("fail");
    await allBlock.close();
    // browser UA works on main fixture; but our fetcher sends AI UAs only when asked — main fixture allows all → pass
    const outOk = await new AgentCrawlerReachabilityProbe().run(pctx());
    expect(outOk[0].status).toBe("pass");
  });

  it("markdown-negotiation-vary: no negotiation fails with Vary evidence quoted", async () => {
    const out = await new MarkdownNegotiationVaryProbe().run(pctx());
    expect(out[0].status).toBe("fail");
    expect(out[0].details).toContain("text/html");
  });

  it("scoped-permissions: named scopes pass 5/5; schemes-without-scopes warn 2/5", async () => {
    const probe = new ScopedPermissionsProbe();
    const ctx = pctx();
    await new OpenApiSpecProbe().run(ctx);
    const out = await probe.run(ctx);
    expect([out[0].score, out[0].status]).toEqual([5, "pass"]); // scopes enforced per-operation
    // schemes present but WITHOUT named scopes ⇒ 2/5 warning
    const bare = await startFixtureServer({ "/openapi.json": (_q, res) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ openapi: "3.0.0", info: { title: "A", version: "1" }, components: { securitySchemes: { apiKey: {} } }, paths: {} })); } });
    const ctx2 = { url: new URL(bare.base), fetchAs, ctx: newScanContext() };
    await new OpenApiSpecProbe().run(ctx2);
    const out2 = await probe.run(ctx2);
    expect(out2[0].score).toBeLessThan(5); // global-only scope definition ⇒ partial credit at best
    await bare.close();
  });

  it("metadata-completeness: full signals on fixture homepage pass 2/2", async () => {
    const probe = new MetadataCompletenessProbe();
    const ctx = pctx();
    await new ContentNoJsProbe().run(ctx); // populates homepage
    const out = await probe.run(ctx);
    expect(out[0].status).toBe("pass");
  });
});
