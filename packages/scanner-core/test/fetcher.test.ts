import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, Server } from "node:http";
import { makeFetcher } from "../src/fetcher.js";

let srv: Server; let base: string;

beforeAll(async () => {
  srv = createServer((req, res) => {
    const u = new URL(req.url ?? "/", "http://x");
    if (u.pathname === "/ua") { res.end(`ua=${req.headers["user-agent"]}`); return; }
    if (u.pathname === "/accept") { res.end(`accept=${req.headers.accept}`); return; }
    if (u.pathname === "/500") { res.statusCode = 500; res.end("boom"); return; }
    if (u.pathname === "/slow") { setTimeout(() => res.end("late"), 3000); return; }
    if (u.pathname === "/redirect") { res.statusCode = 302; res.setHeader("location", "/final"); res.end(); return; }
    if (u.pathname === "/final") { res.setHeader("vary", "Accept"); res.end("done"); return; }
    res.end("ok");
  });
  await new Promise<void>((r) => srv.listen(0, r));
  base = `http://127.0.0.1:${(srv.address() as { port: number }).port}`;
});
afterAll(() => new Promise<void>((r) => srv.close(() => r())));

describe("fetcher", () => {
  const fetchAs = makeFetcher();
  it("sends the requested UA", async () => {
    const r = await fetchAs(`${base}/ua`, { ua: "claudebot" });
    expect(r.body).toContain("ClaudeBot");
  });
  it("forwards Accept header", async () => {
    const r = await fetchAs(`${base}/accept`, { accept: "text/markdown" });
    expect(r.body).toBe("accept=text/markdown");
  });
  it("returns status codes as data, never throws", async () => {
    const r = await fetchAs(`${base}/500`);
    expect(r.status).toBe(500);
  });
  it("follows redirects and exposes finalUrl + lowercased headers", async () => {
    const r = await fetchAs(`${base}/redirect`);
    expect(r.finalUrl.endsWith("/final")).toBe(true);
    expect(r.headers["vary"]).toBe("Accept");
  });
  it("throws on timeout", async () => {
    await expect(fetchAs(`${base}/slow`, { timeoutMs: 200 })).rejects.toThrow();
  });
});
