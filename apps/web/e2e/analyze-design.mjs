import { chromium } from "playwright";

// Extract design tokens from a page: colors, fonts, spacing, component styles
async function extractTokens(page) {
  return page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const tokens = {
      bodyBg: body.backgroundColor, bodyColor: body.color, bodyFont: body.fontFamily.slice(0, 80),
      colors: {}, fonts: new Set(), radii: new Set(), spacing: new Set(),
      buttons: [], cards: [], progress: null, headings: [],
    };
    // walk DOM, collect color/typography usage
    const els = document.querySelectorAll("*");
    const colorCount = {};
    for (const el of els) {
      const cs = getComputedStyle(el);
      if (cs.backgroundColor !== "rgba(0, 0, 0, 0)") colorCount[cs.backgroundColor] = (colorCount[cs.backgroundColor] || 0) + 1;
      if (el.tagName.match(/^H[1-4]$/)) {
        tokens.headings.push({ tag: el.tagName, text: el.textContent.slice(0, 40), size: cs.fontSize, weight: cs.fontWeight, color: cs.color });
      }
      if (el.tagName === "BUTTON" || (el.tagName === "A" && cs.borderRadius !== "0px" && el.offsetWidth > 0)) {
        if (tokens.buttons.length < 8) tokens.buttons.push({ text: el.textContent.slice(0, 25), bg: cs.backgroundColor, color: cs.color, radius: cs.borderRadius, padding: cs.padding, border: cs.border });
      }
      const r = cs.borderRadius;
      if (r && r !== "0px") tokens.radii.add(r);
    }
    tokens.colors = Object.entries(colorCount).sort((a, b) => b[1] - a[1]).slice(0, 15);
    // progress bar
    const prog = document.querySelector("[class*='progress'], [role='progressbar'], [class*='bar']");
    if (prog) { const cs = getComputedStyle(prog); tokens.progress = { cls: String(prog.className).slice(0, 60), bg: cs.backgroundColor, h: cs.height, radius: cs.borderRadius }; }
    // cards/panels
    for (const el of document.querySelectorAll("div, section")) {
      const cs = getComputedStyle(el);
      if (cs.borderRadius.includes("px") && parseInt(cs.borderRadius) >= 8 && el.offsetWidth > 300 && el.offsetHeight > 80 && cs.backgroundColor !== "rgba(0, 0, 0, 0)") {
        if (tokens.cards.length < 6) tokens.cards.push({ tag: el.tagName, cls: String(el.className||"").slice(0, 50), bg: cs.backgroundColor, border: cs.border, radius: cs.borderRadius, padding: cs.padding, shadow: cs.boxShadow.slice(0, 60) });
      }
    }
    tokens.fonts = [...tokens.fonts];
    tokens.radii = [...tokens.radii].slice(0, 8);
    // meta: dark/light
    tokens.pageTheme = { htmlBg: getComputedStyle(document.documentElement).backgroundColor, metaTheme: document.querySelector('meta[name="theme-color"]')?.content };
    return tokens;
  });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const targets = [
  ["https://is-agentic.com/", "official-home"],
  ["https://is-agentic.com/scan/vercel.com", "official-scan-vercel"],
  ["https://is-agentic.com/scan/meta.ai", "official-scan-meta"],
];
for (const [url, name] of targets) {
  console.log(`\n########## ${name} (${url}) ##########`);
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `e2e/design-analysis/${name}-viewport.png` });
    await page.screenshot({ path: `e2e/design-analysis/${name}-full.png`, fullPage: true });
    const tokens = await extractTokens(page);
    console.log(JSON.stringify(tokens, null, 1));
  } catch (e) { console.log("ERROR:", e.message.split("\n")[0]); }
}
await browser.close();
