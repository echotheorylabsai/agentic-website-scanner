import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
const browser = await chromium.launch();
const page = await browser.newPage();
const out = {};
for (const d of ["vercel.com", "eve.dev", "meta.ai", "example.org"]) {
  await page.goto(`https://is-agentic.com/scan/${d}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);
  const link = await page.evaluate(() => {
    const a = [...document.querySelectorAll("a")].find(x => /journey\.ora\.ai/.test(x.href));
    return a?.href ?? null;
  });
  out[d] = link;
  console.log(d, "→", link);
}
writeFileSync("e2e/journey-analysis/journey-links.json", JSON.stringify(out, null, 1));
await browser.close();
