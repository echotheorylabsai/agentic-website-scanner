import type { Probe, ProbeResult, ProbeContext } from "./types.js";
import { result } from "./types.js";
import { specText } from "./apiUtils.js";

/** Spec-derived + docs-derived API probes (Task 7 cont.). */
export class ApiSchemaAnalysisProbe implements Probe {
  ids = ["api-schema-analysis"] as const;
  layer = "usability" as const;
  async run({ ctx }: ProbeContext): Promise<ProbeResult[]> {
    if (!ctx.restSurface) return [result(this.ids[0], "na", 0, 2, "No OpenAPI spec found - schema analysis check not applicable.")];
    const s = specText(ctx);
    const schemas = (s.match(/"?components"?\s*:|"?definitions"?\s*:/g) ?? []).length;
    return schemas > 0
      ? [result(this.ids[0], "pass", 2, 2, "Spec carries a reusable component/definition schema section.")]
      : [result(this.ids[0], "warning", 1, 2, "Spec has paths but no reusable schema components.")];
  }
}

export class FunctionCallingCompatProbe implements Probe {
  ids = ["function-calling-compat"] as const;
  layer = "usability" as const;
  async run({ ctx }: ProbeContext): Promise<ProbeResult[]> {
    if (!ctx.restSurface) return [result(this.ids[0], "na", 0, 2, "No OpenAPI spec found - function-calling compatibility check not applicable.")];
    const s = specText(ctx);
    const ops = (s.match(/(?:get|post|put|patch|delete)\s*:\s*\{/g) ?? []).length;
    const described = (s.match(/"?description"?\s*:/g) ?? []).length;
    const ratio = ops === 0 ? 0 : described / ops;
    if (ratio >= 1.5) return [result(this.ids[0], "pass", 2, 2, `Operations richly described (${ops} ops, ${described} descriptions) — LLM function-calling ready.`)];
    if (ratio >= 0.8) return [result(this.ids[0], "warning", 1, 2, `Operation descriptions sparse (ratio ${ratio.toFixed(2)}) — add per-operation summaries for tool use.`)];
    return [result(this.ids[0], "fail", 0, 2, "Operations lack descriptions needed for LLM function calling.")];
  }
}

export class SandboxEnvironmentProbe implements Probe {
  ids = ["sandbox-environment"] as const; // bonus-only (maxScore 2)
  layer = "usability" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    const docs = await fetchAs(`${url.origin}/docs`, { accept: "text/html" }).catch(() => null);
    if (docs && /\bsandbox\b|test\s+(?:environment|mode|keys?)/i.test(docs.body)) {
      return [result(this.ids[0], "pass", 2, 2, "Sandbox / test-mode environment documented.")];
    }
    return [result(this.ids[0], "fail", 0, 2, "No sandbox or test environment documented.")];
  }
}

export class AuthMdExistsProbe implements Probe {
  ids = ["auth-md-exists"] as const; // bonus-only (emerging)
  layer = "discovery" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    for (const p of ["/auth.md", "/docs/auth.md", "/.well-known/auth.md"]) {
      const r = await fetchAs(`${url.origin}${p}`);
      if (r.status < 300 && r.body.trim()) return [result(this.ids[0], "pass", 2, 2, `Auth guidance published at ${p}.`)];
    }
    return [result(this.ids[0], "fail", 0, 2, "No auth.md agent-authentication guide found.")];
  }
}

export class CliToolProbe implements Probe {
  ids = ["cli-tool"] as const;
  layer = "usability" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    const home = await fetchAs(url, { accept: "text/html" }).catch(() => null);
    const npm = await fetchAs(`https://registry.npmjs.org/${url.hostname.replace(/^www\./, "").split(".")[0]}`).catch(() => null);
    const cliOnSite = home && /\bnpx\s+\S|npm\s+install\s+-g|brew\s+install/i.test(home.body);
    if (npm?.status === 200 && /"bin"\s*:/.test(npm.body)) {
      return [result(this.ids[0], "pass", 3, 3, "Published CLI package found on npm with a bin entry.")];
    }
    if (cliOnSite) return [result(this.ids[0], "warning", 1, 3, "CLI install commands on site but no matching npm package verified.")];
    return [result(this.ids[0], "fail", 0, 3, "No CLI tool available for this product.")];
  }
}

// --- Gated REST-dependent checks: probes emit attempts; relevance.ts N/A's them without a surface.

export class ApiErrorModelProbe implements Probe {
  ids = ["api-error-model"] as const;
  layer = "usability" as const;
  async run({ ctx }: ProbeContext): Promise<ProbeResult[]> {
    if (!ctx.restSurface) return [result(this.ids[0], "error", 0, 3, "No OpenAPI spec found - error model check not applicable.")];
    const s = specText(ctx);
    const problem = /problem\+json|"application\/problem/i.test(s);
    const errors = /"?4\d\d"?\s*:/.test(s);
    return problem || errors
      ? [result(this.ids[0], "pass", 3, 3, "Typed error responses documented across the API surface.")]
      : [result(this.ids[0], "warning", 1, 3, "Sparse error documentation in the spec.")];
  }
}

export class ApiVersioningPolicyProbe implements Probe {
  ids = ["api-versioning-policy"] as const;
  layer = "usability" as const;
  async run({ ctx }: ProbeContext): Promise<ProbeResult[]> {
    if (!ctx.restSurface) return [result(this.ids[0], "error", 0, 3, "No OpenAPI spec found - versioning policy check not applicable.")];
    const s = specText(ctx);
    return /\/v\d|"?version"?\s*:|api-version/i.test(s)
      ? [result(this.ids[0], "pass", 3, 3, "API versioning policy evident in spec paths/info.")]
      : [result(this.ids[0], "warning", 1, 3, "No explicit API versioning policy found.")];
  }
}

export class PaginationShapeProbe implements Probe {
  ids = ["pagination-shape"] as const; // bonus-only
  layer = "usability" as const;
  async run({ ctx }: ProbeContext): Promise<ProbeResult[]> {
    if (!ctx.restSurface) return [result(this.ids[0], "error", 0, 2, "No OpenAPI spec found - pagination shape check not applicable.")];
    const s = specText(ctx);
    return /cursor|page[_-]?token|offset.*limit|next[_-]?page/i.test(s)
      ? [result(this.ids[0], "pass", 2, 2, "Pagination parameters documented in list endpoints.")]
      : [result(this.ids[0], "fail", 0, 2, "List endpoints lack documented pagination shape.")];
  }
}

export class AsyncJobPatternProbe implements Probe {
  ids = ["async-job-pattern"] as const; // bonus-only
  layer = "usability" as const;
  async run({ ctx }: ProbeContext): Promise<ProbeResult[]> {
    if (!ctx.restSurface) return [result(this.ids[0], "error", 0, 2, "No OpenAPI spec found - async job pattern check not applicable.")];
    const s = specText(ctx);
    return /202|job|operation[-_ ]?(id|status)|polling/i.test(s)
      ? [result(this.ids[0], "pass", 2, 2, "Async job/operation pattern documented (202 + status polling).")]
      : [result(this.ids[0], "fail", 0, 2, "No async job pattern for long-running operations.")];
  }
}

export class RestSdkPackagesProbe implements Probe {
  ids = ["rest-sdk-packages"] as const; // bonus-only
  layer = "usability" as const;
  async run({ ctx, url }: ProbeContext): Promise<ProbeResult[]> {
    if (!ctx.restSurface) return [result(this.ids[0], "error", 0, 3, "No OpenAPI spec found - SDK packages check not applicable.")];
    const name = url.hostname.replace(/^www\./, "").split(".")[0];
    const npm = await fetch(`${`https://registry.npmjs.org/@${name}/sdk`}`).then((r) => r.ok).catch(() => false);
    const pypi = await fetch(`https://pypi.org/pypi/${name}/json`).then((r) => r.ok).catch(() => false);
    const n = Number(npm) + Number(pypi);
    if (n >= 2) return [result(this.ids[0], "pass", 3, 3, "Official SDKs published to npm and PyPI.")];
    if (n === 1) return [result(this.ids[0], "warning", 1, 3, "One official SDK registry package found.")];
    return [result(this.ids[0], "fail", 0, 3, "No official SDK packages found on npm/PyPI.")];
  }
}
