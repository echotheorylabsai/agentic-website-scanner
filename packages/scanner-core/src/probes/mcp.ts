import type { Probe, ProbeResult, ProbeContext } from "./types.js";
import { result } from "./types.js";

/** MCP + payments presence probes (Task 8). */

const PAYMENT_IDS = {
  mpp: ["mpp-support", 2], x402: ["x402-support", 2], ucp: ["ucp-support", 3],
  acp: ["acp-support", 3], acpDelegate: ["acp-delegate-payment", 3], ap2: ["ap2-support", 3],
} as const;

const PAYMENT_PATTERNS: Record<keyof typeof PAYMENT_IDS, RegExp> = {
  mpp: /machine[- ]?and[- ]?agent[- ]?payments|\.well-known\/payto|mpp\b/i,
  x402: /\bx402\b|x-payment|payment-required.*402/i,
  ucp: /\buniversal\s+commerce\s+protocol\b|\bucp\b/i,
  acp: /\bagent\s+commerce\s+protocol\b|\bacp\b/i,
  acpDelegate: /delegate[- ]?payment/i,
  ap2: /\bagent\s+payments\s+protocol\b|\bap2\b/i,
};

export class McpWellKnownDiscoveryProbe implements Probe {
  ids = ["mcp-well-known-discovery"] as const; // bonus
  layer = "usability" as const;
  async run({ url, fetchAs, ctx }: ProbeContext): Promise<ProbeResult[]> {
    for (const p of ["/.well-known/mcp.json", "/.well-known/mcp", "/mcp.json"]) {
      const r = await fetchAs(`${url.origin}${p}`);
      if (r.status < 300 && r.body.trim().startsWith("{")) {
        ctx.mcpManifest = r;
        return [result(this.ids[0], "pass", 2, 2, `MCP manifest published at ${p}.`)];
      }
    }
    ctx.mcpManifest = null;
    return [result(this.ids[0], "fail", 0, 2, "No MCP discovery manifest at .well-known paths.")];
  }
}

export class McpServerProbe implements Probe {
  ids = ["mcp-server"] as const; // 6pt — the Recommended-pool anchor
  layer = "usability" as const;
  async run({ url, fetchAs, ctx }: ProbeContext): Promise<ProbeResult[]> {
    const endpoints = ["/mcp", "/api/mcp", "/.well-known/mcp"];
    for (const p of endpoints) {
      try {
        const init = await fetch(`${url.origin}${p}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/event-stream",
          },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "is-agentic-clone", version: "1.0" } } }),
        });
        const body = await init.text();
        if (init.status === 401 || init.status === 403) {
          ctx.mcpHandshake = "auth-gated";
          return [result(this.ids[0], "warning", 5, 6, `MCP server live at ${p} but initialize requires authentication (HTTP ${init.status}).`)];
        }
        if (body.includes('"result"') && /serverInfo|protocolVersion/.test(body)) {
          ctx.mcpHandshake = "ok";
          ctx.restOrDocsEvidence = true;
          return [result(this.ids[0], "pass", 6, 6, `MCP server answered initialize over Streamable HTTP at ${p}.`)];
        }
      } catch { /* next endpoint */ }
    }
    ctx.mcpHandshake = "none";
    return [result(this.ids[0], "fail", 0, 6, "No MCP server responded to an initialize handshake.", "Expose an MCP server so agents can integrate programmatically.")];
  }
}

export class McpServerCardProbe implements Probe {
  ids = ["mcp-server-card"] as const; // bonus
  layer = "usability" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    const r = await fetchAs(`${url.origin}/.well-known/mcp-card.json`);
    if (r.status < 300 && /"description"|"tools"/i.test(r.body)) {
      return [result(this.ids[0], "pass", 2, 2, "MCP server card describes tools for agents.")];
    }
    return [result(this.ids[0], "fail", 0, 2, "No MCP server card found.")];
  }
}

export class A2aAgentCardProbe implements Probe {
  ids = ["a2a-agent-card"] as const; // bonus
  layer = "discovery" as const;
  async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
    const r = await fetchAs(`${url.origin}/.well-known/agent.json`);
    if (r.status < 300 && /"name"|"capabilities"/i.test(r.body)) {
      return [result(this.ids[0], "pass", 2, 2, "A2A agent card published at .well-known/agent.json.")];
    }
    return [result(this.ids[0], "fail", 0, 2, "No A2A agent card found.")];
  }
}

/** Payments family: one probe per protocol (all bonus-only per catalog). */
function makePaymentsProbe(key: keyof typeof PAYMENT_IDS): Probe {
  const [id, max] = PAYMENT_IDS[key];
  const pattern = PAYMENT_PATTERNS[key];
  class PaymentsProbeImpl implements Probe {
    ids = [id] as unknown as readonly [string];
    layer = "payments" as const;
    async run({ url, fetchAs }: ProbeContext): Promise<ProbeResult[]> {
      try {
        const home = await fetchAs(url, { accept: "text/html" });
        const wk = await fetchAs(`${url.origin}/.well-known/${key === "mpp" ? "payto" : key}`).catch(() => null);
        const hit = pattern.test(home?.body ?? "") || (wk ? wk.status < 300 : false);
        return hit
          ? [result(id, "pass", max as number, max as number, `${id} signals detected on the site.`)]
          : [result(id, "fail", 0, max as number, `No ${id} evidence found.`)];
      } catch {
        return [result(id, "error", 0, max as number, "Homepage unreachable during payments probe.")];
      }
    }
  }
  return new PaymentsProbeImpl();
}

export const mcpProbes = (): Probe[] => [
  new McpWellKnownDiscoveryProbe(), new McpServerProbe(), new McpServerCardProbe(),
  new A2aAgentCardProbe(),
  ...(Object.keys(PAYMENT_IDS) as Array<keyof typeof PAYMENT_IDS>).map(makePaymentsProbe),
];
