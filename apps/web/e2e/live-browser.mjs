// Live browser test: home → scan → progress → report, for each example domain.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "../../docs/validation/artifacts/browser";
mkdirSync(OUT, { recursive: true });
const domains = process.argv.slice(2).length ? process.argv.slice(2) : ["vercel.com", "eve.dev", "meta.ai", "example.org"];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// 1. Home page
await page.goto("http://localhost:3100/", { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/01-home.png`, fullPage: true });
console.log("home captured");

for (const d of domains) {
  console.log(`\n=== scanning ${d} via browser ===`);
  await page.goto("http://localhost:3100/", { waitUntil: "networkidle" });
  await page.fill('input[aria-label="Website to scan"]', d);
  await page.click('button[type="submit"]');
  // wait for navigation to /scan/<host>
  await page.waitForURL(`**/scan/${d}`, { timeout: 15000 });

  // wait for report card to appear (scan completes; poll up to 5 min)
  try {
    await page.waitForSelector(".score-big", { timeout: 300_000 });
    // let roster/details render
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/report-${d}.png`, fullPage: true });
    const score = await page.textContent(".score-big");
    const label = await page.textContent(".card p");
    console.log(`${d}: score=${score?.trim()} label=${label?.trim().slice(0, 60)}`);
    // expand roster for full-page evidence
    const details = page.locator("details.card summary").first();
    if (await details.count()) {
      await details.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${OUT}/report-${d}-roster.png`, fullPage: true });
    }
  } catch (e) {
    console.log(`${d}: TIMEOUT waiting for report — ${e.message.split("\n")[0]}`);
    await page.screenshot({ path: `${OUT}/report-${d}-timeout.png`, fullPage: true });
  }
}

// markdown negotiation check in browser context
const md = await page.evaluate(async () => {
  const r = await fetch("/scan/vercel.com", { headers: { Accept: "text/markdown" } });
  return { ct: r.headers.get("content-type"), body: (await r.text()).slice(0, 200) };
});
console.log("\nmarkdown negotiation:", JSON.stringify(md));

await browser.close();
console.log("\nDONE");
