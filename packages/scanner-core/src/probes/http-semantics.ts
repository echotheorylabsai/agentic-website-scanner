import type { Probe, ProbeResult, ProbeContext } from "./types.js";
import { result } from "./types.js";

/**
 * HTTP-semantics probes.
 * Rubrics from the validated catalog:
 *  - agent-friendly-404 (2pt): fake path 200-HTML-shell ⇒ 0/2 fail; 404/410 with links ⇒ 2/2;
 *    404/410 bare body ⇒ 1/2 warning; other status (401/403…) ⇒ 1/2 warning.
 *  - redirect-hygiene (1pt): ≤2 hops https ⇒ 1/1; >2 hops / loop ⇒ 0/1.
 */
export class AgentFriendly404Probe implements Probe {
  ids = ["agent-friendly-404"] as const;
  layer = "accessibility" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    const fake = `${url.origin}/definitely-not-a-real-agent-path-${Date.now()}`;
    const res = await fetchAs(fake);
    const ct = (res.headers["content-type"] ?? "").toLowerCase();
    const hasLinks = /<a[\s>]/i.test(res.body) || /\[[^\]]+\]\(/.test(res.body);
    if (res.status === 200 && ct.includes("text/html")) {
      return [result(this.ids[0], "fail", 0, 2,
        `Nonexistent paths return HTTP 200 with the app shell (soft-404). Agents probing for resources conclude every path exists. Return a real HTTP 404 status for unknown paths.`,
        `Return a real HTTP 404 (or 410) status for nonexistent paths - never a 200 with your app shell.`)];
    }
    if ((res.status === 404 || res.status === 410)) {
      return hasLinks
        ? [result(this.ids[0], "pass", 2, 2, `404 responses include navigation links (${ct || "no content-type"}).`)]
        : [result(this.ids[0], "warning", 1, 2, `404 returned but body has no links for agents to follow.`)];
    }
    return [result(this.ids[0], "warning", 1, 2, `Fake path returned HTTP ${res.status} instead of 404.`)];
  }
}

export class RedirectHygieneProbe implements Probe {
  ids = ["redirect-hygiene"] as const;
  layer = "accessibility" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    // manual redirect walk, max 5 hops
    let current = url.toString();
    let hops = 0;
    while (hops < 5) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10_000);
      let res: Response;
      try {
        res = await fetch(current, { redirect: "manual", signal: ctrl.signal });
      } catch {
        clearTimeout(timer);
        return [result(this.ids[0], "error", 0, 1, "Homepage unreachable during redirect audit.")];
      }
      clearTimeout(timer);
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const loc = res.headers.get("location");
        if (!loc) break;
        current = new URL(loc, current).toString();
        hops++;
      } else break;
    }
    const secure = current.startsWith("https://");
    if (secure && hops <= 2) {
      return [result(this.ids[0], "pass", 1, 1, hops ? `Resolves over HTTPS in ${hops} hop(s).` : "Already served over HTTPS.")];
    }
    return [result(this.ids[0], "fail", 0, 1,
      !secure ? `Redirect chain ends on non-HTTPS URL (${current}).` : `Redirect chain takes ${hops} hops (>2).`)];
  }
}
