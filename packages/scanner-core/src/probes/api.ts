import type { Probe, ProbeResult, ProbeContext } from "./types";
import { result } from "./types";
import { specText } from "./apiUtils";

/** Developer/API probes (Task 7). openapi-spec is the REST detector. */
export class OpenApiSpecProbe implements Probe {
  ids = ["openapi-spec"] as const;
  layer = "usability" as const;
  async run({ url, fetchAs, ctx }: ProbeContext): Promise<ProbeResult[]> {
    const candidates = ["/openapi.json", "/openapi.yaml", "/api/openapi.json", "/swagger.json", "/.well-known/openapi.json"];
    for (const p of candidates) {
      const r = await fetchAs(`${url.origin}${p}`);
      if (r.status < 300 && /"?openapi"?\s*:|^\s*openapi\s*:/m.test(r.body)) {
        ctx.openapi = r;
        ctx.restSurface = true;
        ctx.restOrDocsEvidence = true;
        const valid = /"\s*paths\s*"|\bpaths\s*:/.test(r.body);
        return valid
          ? [result(this.ids[0], "pass", 7, 7, `OpenAPI spec found at ${p} and parses with a paths object.`)]
          : [result(this.ids[0], "warning", 3, 7, `Spec-like document at ${p} but no paths object.`)];
      }
    }
    ctx.openapi = null;
    return [result(this.ids[0], "fail", 0, 7, "No OpenAPI/Swagger specification found", "Publish an OpenAPI 3.x spec and link it from your docs.")];
  }
}

export class ScopedPermissionsProbe implements Probe {
  ids = ["scoped-permissions"] as const;
  layer = "usability" as const;
  async run({ ctx }: ProbeContext): Promise<ProbeResult[]> {
    const s = specText(ctx);
    const hasSecuritySchemes = /"?securitySchemes"?\s*:/i.test(s);
    const scopes = /\bscopes\b|["']?(?:read|write|admin):[\w:]+["']?/i.test(s);
    // operation-level security references: "security": inside the paths block
    const opSecurity = new RegExp('"?paths"?\\s*:\\s*\\{[\\s\\S]*?"?security"?\\s*:\\s*\\[').test(s);
    if (hasSecuritySchemes && scopes && opSecurity) return [result(this.ids[0], "pass", 5, 5, "Scoped permissions defined and enforced per-operation.")];
    if (hasSecuritySchemes && scopes) return [result(this.ids[0], "warning", 2, 5, "Scopes defined globally but not enforced per-operation.", "Reference security scopes at each operation so agents request least privilege.")];
    if (hasSecuritySchemes) return [result(this.ids[0], "warning", 2, 5, "Auth schemes defined without named scopes.")];
    return [result(this.ids[0], "fail", 0, 5, "No declared OAuth scopes, security schemes, or scoped-permission documentation found", "Define scoped permissions (read:/write:) so agents can request least privilege.")];
  }
}

export class ResponseSchemaCoverageProbe implements Probe {
  ids = ["response-schema-coverage"] as const;
  layer = "usability" as const;
  async run({ ctx }: ProbeContext): Promise<ProbeResult[]> {
    if (!ctx.restSurface) return [result(this.ids[0], "na", 0, 2, "No OpenAPI spec found - response schema coverage check not applicable.")];
    const responses = (specText(ctx).match(/"?responses"?\s*:/g) ?? []).length;
    const schemas = (specText(ctx).match(/"?(?:schema|\$ref)"?\s*:/g) ?? []).length;
    const pct = responses === 0 ? 0 : Math.min(100, Math.round((schemas / responses) * 100));
    if (pct > 60) return [result(this.ids[0], "pass", 2, 2, `Response schema coverage ~${pct}%.`)];
    if (pct > 30) return [result(this.ids[0], "warning", 1, 2, `Response schema coverage ~${pct}% — document typed responses.`)];
    return [result(this.ids[0], "fail", 0, 2, `Response schema coverage ~${pct}%.`)];
  }
}

export class RateLimitHeadersProbe implements Probe {
  ids = ["rate-limit-headers"] as const;
  layer = "usability" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    const r = await fetchAs(`${url.origin}/api`, { accept: "application/json" });
    const h = r.headers;
    const rl = h["ratelimit-limit"] ?? h["x-ratelimit-limit"] ?? h["x-rate-limit-limit"];
    const ra = h["ratelimit-remaining"] ?? h["x-ratelimit-remaining"];
    if (rl && ra) return [result(this.ids[0], "pass", 2, 2, `Rate-limit headers observed (Limit: ${rl}, Remaining: ${ra}).`)];
    if (rl || ra) return [result(this.ids[0], "warning", 1, 2, `Partial rate-limit headers (${rl ? `Limit: ${rl}` : `Remaining: ${ra}`}).`)];
    return [result(this.ids[0], "fail", 0, 2, "No REST rate-limit headers found on probed endpoints", "Return RateLimit-* headers so agents can pace requests.")];
  }
}

export class JsonErrorResponsesProbe implements Probe {
  ids = ["json-error-responses"] as const;
  layer = "usability" as const;
  async run({ url, fetchAs, ctx }: ProbeContext): Promise<ProbeResult[]> {
    // wrong-method probe against the API root
    try {
      let best = -1;
      for (const p of ["/api", "/api/v1"]) {
        const res = await fetch(`${url.origin}${p}`, {
          method: "DELETE",
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(10_000),
        });
        const ct = (res.headers.get("content-type") ?? "").toLowerCase();
        const body = await res.text();
        const jsonish = ct.includes("json") && /[{[]/.test(body);
        const isHtmlShell = ct.includes("html");
        if (res.status >= 400 && jsonish) { best = 4; break; }
        // HTML error bodies are SPA catch-alls — no API contract observable (observed eve.dev)
        if (res.status >= 400 && !isHtmlShell && best < 1) best = 1;
      }
      if (best === 4) {
        return [result(this.ids[0], "pass", 4, 4, "Errors returned as JSON problem bodies.")];
      }
      if (best === 1) {
        return [result(this.ids[0], "warning", 1, 4, "Error statuses returned but bodies are not application/json.", "Return RFC 9457 problem+json bodies on API errors.")];
      }
      return [result(this.ids[0], "fail", 0, 4, "No JSON error contract observable at /api paths.", "Return RFC 9457 problem+json bodies on API errors.")];
    } catch {
      return [result(this.ids[0], "error", 0, 4, ctx.restSurface ? "Network failure during error-probe." : "No API surface to probe for error contracts.")];
    }
  }
}

const DOC_SIGNALS: Array<[RegExp, string]> = [
  [/\/docs|documentation/i, "documentation section"],
  [/\bapi[- ]?reference\b/i, "API reference"],
  [/getting[- ]?started/i, "getting-started guide"],
  [/\bsdk\b/i, "SDK mention"],
];

export class PublicApiProbe implements Probe {
  ids = ["public-api"] as const;
  layer = "usability" as const;
  async run({ url, fetchAs, ctx }: ProbeContext): Promise<ProbeResult[]> {
    let signals = 0;
    if (ctx.restSurface) signals += 5;
    const apiPage = await fetchAs(`${url.origin}/api`, { accept: "application/json" }).catch(() => null);
    if (apiPage && apiPage.status < 400) signals += 3;
    // documented endpoints on /docs are strong public-API evidence (observed eve.dev)
    const docsPage = await fetchAs(`${url.origin}/docs`, { accept: "text/html" }).catch(() => null);
    if (docsPage && docsPage.status < 400 && /\bendpoints?\b|authentication\b|curl\s|api[- ]?key/i.test(docsPage.body)) signals += 4;
    const home = await fetchAs(url, { accept: "text/html" }).catch(() => null);
    const text = `${home?.body ?? ""}`;
    for (const [re] of DOC_SIGNALS.slice(1)) if (re.test(text)) signals++;
    if (/developers\./i.test(text) || /developer\.+/i.test(text)) signals++;
    if (signals >= 5) return [result(this.ids[0], "pass", 7, 7, "Public API reachable and referenced across the site.")];
    if (signals >= 3) return [result(this.ids[0], "warning", 4, 7, "Partial public-API signals found.")];
    return [result(this.ids[0], "fail", 0, 7, "No public API surface detected.")];
  }
}

export class PublicApiDocsProbe implements Probe {
  ids = ["public-api-docs"] as const;
  layer = "usability" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    for (const p of ["/docs/api", "/api-reference", "/reference", "/docs"]) {
      const r = await fetchAs(`${url.origin}${p}`, { accept: "text/html" });
      if (r.status < 300 && /\bendpoint|authentication|request\b/i.test(r.body)) {
        return [result(this.ids[0], "pass", 3, 3, `Public API documentation served at ${p}.`)];
      }
    }
    return [result(this.ids[0], "fail", 0, 3, "No public API documentation pages found.")];
  }
}

export class DeveloperPortalProbe implements Probe {
  ids = ["developer-portal"] as const;
  layer = "usability" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    let score = 0; const seen: string[] = [];
    for (const p of ["/developers", "/dev", "/build", "/integrations", "/docs"]) {
      const r = await fetchAs(`${url.origin}${p}`, { accept: "text/html" });
      if (r.status < 300) { score += 2; seen.push(p); }
      if (r.status < 300 && /\bquickstart|sandbox|api\s?key\b/i.test(r.body)) score += 2;
      if (score >= 6) break;
    }
    if (score >= 6) return [result(this.ids[0], "pass", 6, 6, `Developer portal present (${seen.join(", ")}) with quickstart/key guidance.`)];
    if (score >= 2) return [result(this.ids[0], "warning", 3, 6, `Developer content at ${seen.join(", ") || "homepage"} but no full portal.`)];
    return [result(this.ids[0], "fail", 0, 6, "No developer portal detected.")];
  }
}

export class OAuthSupportProbe implements Probe {
  ids = ["oauth-support"] as const;
  layer = "usability" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    for (const wkPath of ["oauth-authorization-server", "oauth-protected-resource"]) {
      const wk = await fetchAs(`${url.origin}/.well-known/${wkPath}`).catch(() => null);
      if (wk?.status === 200 && /^\s*[\{"/]/.test(wk.body)) {
        return [result(this.ids[0], "pass", 5, 5, `${wkPath} metadata responds with JSON at .well-known.`)];
      }
    }
    const home = await fetchAs(`${url.origin}/`, { accept: "text/html" }).catch(() => null);
    if (home && /oauth2?\b/i.test(home.body)) return [result(this.ids[0], "warning", 2, 5, "OAuth referenced on site but no metadata endpoint.")];
    return [result(this.ids[0], "fail", 0, 5, "No OAuth support detected.")];
  }
}
