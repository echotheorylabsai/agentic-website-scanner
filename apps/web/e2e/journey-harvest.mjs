import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

// Trigger fresh scans via SSE and harvest the journey URL from each report page
const domains = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage();

// capture API/XHR traffic on journey pages
const journeys = {};
for (const d of domains) {
  console.log(`\n=== ${d}: triggering fresh scan via SSE ===`);
  // SSE fresh scan
  const resp = await page.request.get(`https://is-agentic.com/api/scan/stream?target=https%3A%2F%2F${d}`, {
    headers: { Accept: "text/event-stream" },
    timeout: 300000,
  });
  const body = await resp.text();
  writeFileSync(`e2e/journey-analysis/sse-${d}.txt`, body);
  // find scan_complete result + any journey id in frames
  const frames = body.split("\n").filter(l => l.startsWith("data:")).map(l => { try { return JSON.parse(l.slice(5)); } catch { return null; } }).filter(Boolean);
  const complete = frames.find(f => f.type === "scan_complete");
  const journeyId = JSON.stringify(frames).match(/journey[":\s/]+([a-f0-9-]{36})/i)?.[1]
    || complete?.result?.journeyId || complete?.result?.journey?.id || null;
  console.log(`scan_complete: score=${complete?.result?.score} journeyId=${journeyId}`);
  journeys[d] = { journeyId, result: complete?.result };
}
writeFileSync("e2e/journey-analysis/journeys.json", JSON.stringify(journeys, null, 1));
await browser.close();
console.log("\nharvest done");
