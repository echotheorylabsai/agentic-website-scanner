import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const journeys = [
  ["a6f56374-4e80-41d0-a7b8-ce365a37e6a8", "J1"],
  ["feb11fd9-4bda-4049-ae17-02ae5278d0e5", "J2"],
  ["90dc43b6-747d-4869-a26d-bdad8c8fff6a", "J3"],
];

const browser = await chromium.launch();
for (const [id, name] of journeys) {
  console.log(`\n########## ${name}: ${id} ##########`);
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // capture all network JSON
  const apiResponses = [];
  page.on("response", async (res) => {
    const url = res.url();
    if (/\.(json|api\/)/.test(url) || res.headers()["content-type"]?.includes("json")) {
      try {
        const body = await res.text();
        apiResponses.push({ url, status: res.status(), body: body.slice(0, 50000) });
      } catch {}
    }
  });

  try {
    await page.goto(`https://journey.ora.ai/${id}`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `e2e/journey-analysis/pages/${name}-viewport.png`, fullPage: false });
    await page.screenshot({ path: `e2e/journey-analysis/pages/${name}-full.png`, fullPage: true });
    const text = await page.evaluate(() => document.body.innerText);
    writeFileSync(`e2e/journey-analysis/pages/${name}-text.txt`, text);
    writeFileSync(`e2e/journey-analysis/pages/${name}-api.json`, JSON.stringify(apiResponses, null, 1));
    console.log("text length:", text.length, "| api captures:", apiResponses.length);
    console.log("text head:", text.slice(0, 300).replace(/\n+/g, " | "));
  } catch (e) {
    console.log("ERROR:", e.message.split("\n")[0]);
  }
  await page.close();
}
await browser.close();
