import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
const browser = await chromium.launch();
for (const [id, name] of [["a6f56374-4e80-41d0-a7b8-ce365a37e6a8","J1"],["feb11fd9-4bda-4049-ae17-02ae5278d0e5","J2"],["90dc43b6-747d-4869-a26d-bdad8c8fff6a","J3"]]) {
  const page = await browser.newPage();
  await page.goto(`https://journey.ora.ai/${id}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);
  const html = await page.content();
  writeFileSync(`e2e/journey-analysis/pages/${name}-raw.html`, html);
  // find embedded JSON payloads
  const m = html.match(/self\.__next_f\.push|__NEXT_DATA__/);
  console.log(name, "html:", html.length, "bytes | next-data:", m ? m[0] : "none");
  await page.close();
}
await browser.close();
