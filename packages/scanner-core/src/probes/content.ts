import type { Probe, ProbeResult, ProbeContext } from "./types.js";
import { result } from "./types.js";

function stripTags(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
}

/** Content & metadata probes (Task 5). */
export class ContentNoJsProbe implements Probe {
  ids = ["content-no-js"] as const;
  layer = "accessibility" as const;
  async run({ url, fetchAs, ctx }: ProbeContext): Promise<ProbeResult[]> {
    const home = await fetchAs(url, { accept: "text/html" });
    ctx.homepage = home;
    const text = stripTags(home.body).replace(/\s+/g, " ").trim();
    const chars = text.length;
    const h1 = /<h1[\s>]/i.test(home.body);
    const depth = (text.match(/\b[a-z]{4,}\b/gi) ?? []).length >= 150;
    if (chars >= 500 && h1 && depth) {
      return [result(this.ids[0], "pass", 3, 3, `Server HTML carries ${chars} chars of readable copy with an H1 heading.`)];
    }
    if (chars >= 500 && h1) {
      return [result(this.ids[0], "warning", 2, 3, `Readable copy present (${chars} chars) but shallow content depth without JS.`)];
    }
    return [result(this.ids[0], "fail", 0, 3, chars < 500
      ? `Only ${chars} chars of server-rendered text — agents that never run JavaScript see an empty page.`
      : `Server HTML lacks an H1 heading; agents can't identify the page subject.`)];
  }
}

export class MetadataCompletenessProbe implements Probe {
  ids = ["metadata-completeness"] as const;
  layer = "discovery" as const;
  async run({ ctx }: ProbeContext): Promise<ProbeResult[]> {
    const home = ctx.homepage;
    if (!home) return [result(this.ids[0], "error", 0, 2, "Homepage not fetched.")];
    const signals = [
      /<title[^>]*>[^<\s][^<]*<\/title>/i,
      /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{20,}/i,
      /<link[^>]+rel=["']canonical["']/i,
      /<meta[^>]+property=["']og:title["']/i,
    ].filter((re) => re.test(home.body)).length;
    if (signals === 4) return [result(this.ids[0], "pass", 2, 2, "Title tag, meta description, canonical URL and og:title all present.")];
    if (signals === 3) return [result(this.ids[0], "warning", 1, 2, "3 of 4 metadata signals present (missing one of title/description/canonical/og:title).")];
    return [result(this.ids[0], "fail", 0, 2, `Only ${signals} of 4 core metadata signals found in server HTML.`)];
  }
}

interface JsonLdNode { ["@type"]?: string | string[]; name?: string; url?: string; sameAs?: unknown }

function ldNodes(html: string): { nodes: JsonLdNode[]; parseErrors: number } {
  const nodes: JsonLdNode[] = [];
  let parseErrors = 0;
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const data = JSON.parse(m[1]);
      const arr = Array.isArray(data) ? data : [data];
      for (const d of arr) {
        if (d && typeof d === "object") nodes.push(...(((d as { "@graph"?: JsonLdNode[] })["@graph"]) ?? [d]));
      }
    } catch { parseErrors++; }
  }
  return { nodes, parseErrors };
}

const IDENTITY_TYPES = ["organization", "localbusiness", "website", "product", "webpage", "person", "softwareapplication"];

export class JsonLdProbe implements Probe {
  ids = ["json-ld"] as const;
  layer = "usability" as const;
  async run({ ctx }: ProbeContext): Promise<ProbeResult[]> {
    const home = ctx.homepage;
    if (!home) return [result(this.ids[0], "error", 0, 4, "Homepage not fetched.")];
    const { nodes, parseErrors } = ldNodes(home.body);
    const identity = nodes.find((n) => {
      const t = Array.isArray(n["@type"]) ? n["@type"][0]?.toLowerCase() : n["@type"]?.toLowerCase();
      return t && IDENTITY_TYPES.includes(t);
    });
    if (identity && identity.name && identity.url) {
      return [result(this.ids[0], "pass", 4, 4, `Valid JSON-LD identity node (${String(Array.isArray(identity["@type"]) ? identity["@type"]![0] : identity["@type"])}) with name and url.`)];
    }
    if (nodes.length > parseErrors * 2) {
      return [result(this.ids[0], "warning", 2, 4, `JSON-LD present (${nodes.length} nodes) but no complete identity entity with name+url.`)];
    }
    return [result(this.ids[0], "fail", 0, 4, parseErrors
      ? `${parseErrors} JSON-LD script(s) failed to parse.`
      : "No JSON-LD structured data found on the homepage.")];
  }
}

export class JsonLdEntityLinkingProbe implements Probe {
  ids = ["json-ld-entity-linking"] as const; // bonus-only (maxScore 2)
  layer = "usability" as const;
  async run({ ctx }: ProbeContext): Promise<ProbeResult[]> {
    const home = ctx.homepage;
    if (!home) return [result(this.ids[0], "error", 0, 2, "Homepage not fetched.")];
    const { nodes } = ldNodes(home.body);
    const linked = nodes.find((n) =>
      Array.isArray(n.sameAs) && n.sameAs.some((u) => typeof u === "string" && /^https?:\/\//.test(u)));
    return linked
      ? [result(this.ids[0], "pass", 2, 2, "sameAs links connect the identity entity to external references.")]
      : [result(this.ids[0], "fail", 0, 2, "JSON-LD lacks sameAs entity linking.")];
  }
}

export class OrgSchemaCompletenessProbe implements Probe {
  ids = ["org-schema-completeness"] as const;
  layer = "usability" as const;
  async run({ ctx }: ProbeContext): Promise<ProbeResult[]> {
    const home = ctx.homepage;
    if (!home) return [result(this.ids[0], "error", 0, 2, "Homepage not fetched.")];
    const { nodes } = ldNodes(home.body);
    const org = nodes.find((n) => {
      const t = Array.isArray(n["@type"]) ? n["@type"].map(String) : [String(n["@type"] ?? "")];
      return t.some((x) => x.toLowerCase().includes("organization") || x.toLowerCase().includes("business"));
    }) as ({ contactPoint?: unknown; address?: unknown } | undefined);
    if (!org) return [result(this.ids[0], "fail", 0, 2, "No Organization schema node found.")];
    const both = Boolean(org.contactPoint && org.address);
    return both
      ? [result(this.ids[0], "pass", 2, 2, "Organization schema includes contactPoint and address.")]
      : [result(this.ids[0], "warning", 1, 2, "Organization schema found but missing contactPoint or address.")];
  }
}

export class TrustAnchorsProbe implements Probe {
  ids = ["trust-anchors"] as const;
  layer = "usability" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    const paths = ["/about", "/contact", "/privacy"];
    const ok = await Promise.all(paths.map(async (p) => {
      try {
        const r = await fetchAs(`${url.origin}${p}`);
        return r.status < 300 && stripTags(r.body).replace(/\s+/g, " ").trim().length >= 500;
      } catch { return false; }
    }));
    const n = ok.filter(Boolean).length;
    if (n === 3) return [result(this.ids[0], "pass", 2, 2, "About, Contact and Privacy pages all resolve with substantial content.")];
    if (n === 2) return [result(this.ids[0], "warning", 1, 2, "2 of 3 trust pages (about/contact/privacy) resolve with substance.")];
    return [result(this.ids[0], "fail", 0, 2, `Only ${n} of 3 trust-anchor pages carry substantive content.`)];
  }
}

export class DocsAuthGateProbe implements Probe {
  ids = ["docs-auth-gate"] as const;
  layer = "accessibility" as const;
  async run({ url, fetchAs, ctx }: ProbeContext): Promise<ProbeResult[]> {
    if (!ctx.homepage || ctx.homepage.status >= 400) {
      return [result(this.ids[0], "na", 0, 2, "Homepage unreachable; docs auth-gate cannot be assessed.")];
    }
    const paths = ["/docs", "/docs/getting-started", "/developers"];
    for (const p of paths) {
      try {
        const r = await fetchAs(`${url.origin}${p}`, { accept: "text/html" });
        const loginWall = r.status === 401 || r.status === 403 ||
          /log\s?in|sign\s?in/i.test(r.finalUrl) ||
          (r.status < 300 && /(?:please )?(?:sign|log)[- ]?in to (?:view|continue|access)/i.test(stripTags(r.body).slice(0, 2000)) && stripTags(r.body).replace(/\s+/g, "").length < 800);
        if (loginWall) {
          return [result(this.ids[0], "fail", 0, 2, `Documentation behind an auth wall at ${p} (HTTP ${r.status}); agents cannot read gated docs.`, "Serve public, unauthenticated documentation pages.")];
        }
      } catch { /* unreachable path — not evidence of gating */ }
    }
    return [result(this.ids[0], "pass", 2, 2, "Documentation paths serve content without authentication.")];
  }
}

export class PageTokenBudgetProbe implements Probe {
  ids = ["page-token-budget"] as const;
  layer = "usability" as const;
  async run({ ctx }: ProbeContext): Promise<ProbeResult[]> {
    const home = ctx.homepage;
    if (!home) return [result(this.ids[0], "error", 0, 1, "Homepage not fetched.")];
    // rough token estimate: words ≈ tokens for English prose; HTML overhead counted via stripped text
    const tokens = Math.ceil(stripTags(home.body).split(/\s+/).length * 1.3);
    return tokens <= 60_000
      ? [result(this.ids[0], "pass", 1, 1, `Homepage fits agent context budgets (~${tokens.toLocaleString()} tokens).`)]
      : [result(this.ids[0], "fail", 0, 1, `Homepage is ~${tokens.toLocaleString()} tokens — exceeds practical context budgets.`)];
  }
}

export class CodeFenceValidityProbe implements Probe {
  ids = ["code-fence-validity"] as const;
  layer = "usability" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    // look for markdown surfaces and verify ``` fences are balanced
    for (const p of ["/llms.txt", "/docs.md", "/README.md"]) {
      try {
        const r = await fetchAs(`${url.origin}${p}`);
        if (r.status < 300 && /```/.test(r.body)) {
          const fences = (r.body.match(/^```/gm) ?? []).length;
          return fences % 2 === 0
            ? [result(this.ids[0], "pass", 1, 1, "Code fences are balanced in served markdown.")]
            : [result(this.ids[0], "fail", 0, 1, "Unbalanced code fences in served markdown — agents render broken code blocks.")];
        }
      } catch { /* skip */ }
    }
    return [result(this.ids[0], "pass", 1, 1, "No markdown surfaces published; nothing to violate.")];
  }
}

export const contentProbes = (): Probe[] => [
  new ContentNoJsProbe(), new MetadataCompletenessProbe(), new JsonLdProbe(),
  new JsonLdEntityLinkingProbe(), new OrgSchemaCompletenessProbe(), new TrustAnchorsProbe(),
  new DocsAuthGateProbe(), new PageTokenBudgetProbe(), new CodeFenceValidityProbe(),
];
