import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:3100/scan/vercel.com", { waitUntil: "networkidle" });
await page.waitForSelector(".score-big", { timeout: 30000 });
await page.waitForTimeout(1000);
// expand all tier sections
for (const summary of await page.locator("details.card summary").all()) { await summary.click(); await page.waitForTimeout(300); }
await page.screenshot({ path: "../../docs/validation/artifacts/browser/report-vercel-full-roster.png", fullPage: true });
const recCount = await page.locator("text=RECOMMENDATION").count();
console.log("RECOMMENDATION blocks rendered:", recCount);
await browser.close();
