import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const OUT = "docs/validation/artifacts/browser";
for (const d of ["vercel.com", "eve.dev", "meta.ai", "example.org"]) {
  try {
    await page.goto(`https://is-agentic.com/scan/${d}`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${OUT}/official-${d}.png`, fullPage: true });
    const text = await page.textContent("body");
    const scoreMatch = text.match(/(\d+)\s*\/\s*100/);
    console.log(`${d}: official page score=${scoreMatch?.[1] ?? "?"}`);
  } catch (e) {
    console.log(`${d}: ERROR ${e.message.split("\n")[0]}`);
  }
}
await browser.close();
