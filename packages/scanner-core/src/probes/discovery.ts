import type { Probe, ProbeResult, ProbeContext } from "./types";
import { result } from "./types";

/** Discovery-file probes (Task 6). */
export class LlmsTxtExistsProbe implements Probe {
  ids = ["llms-txt-exists"] as const;
  layer = "discovery" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    const r = await fetchAs(`${url.origin}/llms.txt`);
    return r.status < 300 && r.body.trim().length > 0
      ? [result(this.ids[0], "pass", 1, 1, "/llms.txt is published.")]
      : [result(this.ids[0], "fail", 0, 1, "No /llms.txt found at the domain root.", "Publish an /llms.txt file pointing agents at your key pages.")];
  }
}

export class LlmsTxtFormattingProbe implements Probe {
  ids = ["llms-txt-formatting"] as const;
  layer = "discovery" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    const r = await fetchAs(`${url.origin}/llms.txt`);
    if (r.status >= 300) return [result(this.ids[0], "fail", 0, 2, "/llms.txt missing — agents have no formatted discovery file.", "Publish /llms.txt with an H1 and a bulleted link list.")];
    const hasH1 = /^#\s+\S/m.test(r.body);
    const linkCount = (r.body.match(/\[[^\]]+\]\([^)]+\)/g) ?? []).length;
    return hasH1 && linkCount >= 3
      ? [result(this.ids[0], "pass", 2, 2, `/llms.txt has an H1 and ${linkCount} markdown links.`)]
      : [result(this.ids[0], "warning", 1, 2, "/llms.txt exists but lacks an H1 heading or a link list (needs both).")];
  }
}

async function fetchSitemap(fetchAs: ProbeContext["fetchAs"], origin: string): Promise<{ xml: string | null; status: number }> {
  for (const p of ["/sitemap.xml", "/sitemap_index.xml"]) {
    const r = await fetchAs(`${origin}${p}`);
    if (r.status < 300 && /<(urlset|sitemapindex)[\s>]/i.test(r.body)) return { xml: r.body, status: r.status };
  }
  return { xml: null, status: 404 };
}

export class SitemapProbe implements Probe {
  ids = ["sitemap"] as const;
  layer = "discovery" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    const { xml } = await fetchSitemap(fetchAs, url.origin);
    if (!xml) return [result(this.ids[0], "fail", 0, 2, "No valid sitemap.xml found.", "Publish a valid XML sitemap at /sitemap.xml.")];
    const urls = (xml.match(/<loc>/g) ?? []).length;
    return urls > 0
      ? [result(this.ids[0], "pass", 2, 2, `Valid XML sitemap with ${urls} URL entr${urls === 1 ? "y" : "ies"}.`)]
      : [result(this.ids[0], "warning", 1, 2, "Sitemap present but contains no <loc> entries.")];
  }
}

export class SitemapLastmodProbe implements Probe {
  ids = ["sitemap-lastmod"] as const; // bonus
  layer = "discovery" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    const { xml } = await fetchSitemap(fetchAs, url.origin);
    if (!xml) return [result(this.ids[0], "na", 0, 1, "No sitemap to check for lastmod.")];
    return /<lastmod>/i.test(xml)
      ? [result(this.ids[0], "pass", 1, 1, "Sitemap includes <lastmod> freshness signals.")]
      : [result(this.ids[0], "fail", 0, 1, "Sitemap lacks <lastmod> timestamps.")];
  }
}

const AI_AGENTS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "ChatGPT-User", "DeepSeekBot", "CCBot", "anthropic-ai", "Applebot-Extended", "Bytespider"];

export class RobotsAgentUserPolicyProbe implements Probe {
  ids = ["robots-agent-user-policy"] as const; // essentialsExcluded — outside pools
  layer = "accessibility" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    const r = await fetchAs(`${url.origin}/robots.txt`);
    if (r.status >= 300) return [result(this.ids[0], "fail", 0, 2, "No robots.txt found.")];
    const explicit = AI_AGENTS.filter((a) => new RegExp(`user-agent:\\s*${a.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}`, "im").test(r.body));
    return explicit.length > 0
      ? [result(this.ids[0], "pass", 2, 2, `robots.txt carries explicit directives for AI crawlers: ${explicit.slice(0, 4).join(", ")}.`)]
      : [result(this.ids[0], "warning", 1, 2, "robots.txt exists but has no AI-agent-specific user-agent rules (falls back to *).")];
  }
}

export class RobotsAiPolicyQualityProbe implements Probe {
  ids = ["robots-ai-policy-quality"] as const; // essentialsExcluded
  layer = "accessibility" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    const r = await fetchAs(`${url.origin}/robots.txt`);
    if (r.status >= 300) return [result(this.ids[0], "fail", 0, 2, "No robots.txt found.")];
    // quality: per-agent allow/disallow rules beyond a blanket *
    const sections = r.body.split(/user-agent:/i).slice(1);
    const specific = sections.filter((s) => !/^\s*\*/.test(s)).length;
    return specific >= 2
      ? [result(this.ids[0], "pass", 2, 2, `${specific} agent-specific rule groups in robots.txt.`)]
      : [result(this.ids[0], "warning", 1, 2, "Fewer than 2 agent-specific rule groups; policy granularity is low.")];
  }
}

export class AgentInstructionProbe implements Probe {
  ids = ["agent-instruction"] as const;
  layer = "discovery" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    for (const p of ["/agents.md", "/AGENTS.md", "/agent.md", "/.well-known/agents.md", "/llms-full.txt"]) {
      const r = await fetchAs(`${url.origin}${p}`);
      if (r.status < 300 && r.body.trim()) {
        const whenToUse = /when\s+to\s+use|use\s+this\s+(?:site|page)|capabilities/i.test(r.body);
        return whenToUse
          ? [result(this.ids[0], "pass", 3, 3, `Agent instruction file at ${p} includes orientation guidance.`)]
          : [result(this.ids[0], "warning", 1, 3, `Instruction file at ${p} found but no when-to-use guidance.`)];
      }
    }
    return [result(this.ids[0], "fail", 0, 3, "No AGENTS.md or equivalent agent instruction file found.")];
  }
}

export class MarkdownNegotiationVaryProbe implements Probe {
  ids = ["markdown-negotiation-vary"] as const; // maxScore 1 — the bonus-rule exception
  layer = "accessibility" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    const r = await fetchAs(url, { accept: "text/markdown" });
    const ct = (r.headers["content-type"] ?? "").toLowerCase();
    const vary = r.headers["vary"];
    const isMd = ct.includes("text/markdown");
    if (isMd && vary && /accept/i.test(vary)) {
      return [result(this.ids[0], "pass", 1, 1, `Markdown negotiation works: Accept: text/markdown → ${ct}; Vary: ${vary}`)];
    }
    return [result(this.ids[0], "fail", 0, 1,
      `Accept: text/markdown returned ${ct || "no content type"}${vary ? `; Vary: ${vary}` : "; no Vary header"}.`,
      "Serve text/markdown when requested and set Vary: Accept on HTML responses.")];
  }
}

export class AgentCrawlerReachabilityProbe implements Probe {
  ids = ["agent-crawler-reachability"] as const;
  layer = "accessibility" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    const blocked: string[] = [];
    let okCount = 0;
    for (const ua of ["gptbot", "claudebot", "perplexitybot"] as const) {
      try {
        const r = await fetchAs(url, { ua });
        if ([401, 403, 406, 429].includes(r.status)) blocked.push(`${ua}→${r.status}`);
        else okCount++;
      } catch { blocked.push(`${ua}→network`); }
    }
    if (!okCount) return [result(this.ids[0], "fail", 0, 2, `AI crawlers hard-blocked: ${blocked.join(", ")}.`)];
    if (blocked.length) return [result(this.ids[0], "warning", 1, 2, `Some AI crawlers degraded: ${blocked.join(", ")}.`)];
    return [result(this.ids[0], "pass", 2, 2, "All probed AI crawlers reach the homepage.")];
  }
}

export class BotDetectionProbe implements Probe {
  ids = ["bot-detection"] as const;
  layer = "accessibility" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    try {
      const r = await fetchAs(url, { ua: "ora_agent" });
      const body = r.body.toLowerCase();
      const challenge = body.includes("captcha") || body.includes("just a moment") || body.includes("verify you are human") ||
        r.headers["server"]?.toLowerCase().includes("cloudflare") && r.status === 403;
      if (challenge || r.status === 403) {
        return [result(this.ids[0], "fail", 0, 2, `Bot-detection challenge served to automated agents (HTTP ${r.status}).`, "Allowlist known AI crawler user-agents at the edge.")];
      }
      return [result(this.ids[0], "pass", 2, 2, "No bot-detection challenge for agent traffic.")];
    } catch {
      return [result(this.ids[0], "error", 0, 2, "Homepage request failed during bot-detection probe.")];
    }
  }
}

export const discoveryProbes = (): Probe[] => [
  new LlmsTxtExistsProbe(), new LlmsTxtFormattingProbe(), new SitemapProbe(),
  new SitemapLastmodProbe(), new RobotsAgentUserPolicyProbe(), new RobotsAiPolicyQualityProbe(),
  new AgentInstructionProbe(), new MarkdownNegotiationVaryProbe(),
  new AgentCrawlerReachabilityProbe(), new BotDetectionProbe(),
];
