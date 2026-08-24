import { latestReport } from "@/lib/jobs";
import { vendoredCatalog } from "@agentic-scanner/core";
import { joinCatalogFlags, scoreReport } from "@agentic-scanner/core";
import type { GatedCheck } from "@agentic-scanner/core";
import { db, schema } from "@/db/index";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** GET /api/scan/markdown?host=<host> — markdown-negotiated report (Vary: Accept contract). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  let host = url.searchParams.get("host");
  if (!host) host = req.headers.get("x-markdown-host");
  void url;
  if (!host) {
    return new Response("# Missing host\n", { status: 400, headers: { "Content-Type": "text/markdown; charset=utf-8", Vary: "Accept" } });
  }
  const report = await latestReport(host);
  if (!report) {
    return new Response(`# No report yet for ${host}\n\nStart a scan first.\n`, {
      status: 404,
      headers: { "Content-Type": "text/markdown; charset=utf-8", Vary: "Accept" },
    });
  }

  const checkRows = await db.select().from(schema.checks).where(eq(schema.checks.scan_id, report.scan_id));
  const gated: GatedCheck[] = checkRows.map((c) => ({
    id: c.check_id,
    status: c.status as GatedCheck["status"],
    score: c.score ?? 0,
    max_score: c.max_score,
    details: c.details ?? "",
    eligible: c.eligible,
    na_reason: c.na_reason ?? undefined,
  }));
  const scored = joinCatalogFlags(gated, vendoredCatalog);
  const raw = scoreReport(scored);

  const lines: string[] = [];
  lines.push(`# Agentic readiness — ${report.display_target}`);
  lines.push("");
  lines.push(`**Score:** ${report.score}/100 (${report.grade}) — ${report.label ?? ""}`);
  lines.push("");
  lines.push("| Pool | Earned | Available | Passing |");
  lines.push("|---|---|---|---|");
  const sb = (report.payload as { score_breakdown?: { essential?: { earned: number }; recommended?: { earned: number } } }).score_breakdown;
  lines.push(`| Essential | ${sb?.essential?.earned ?? Math.round(raw.essentialRaw * 10) / 10} | 80 | ${raw.passing.essential}/${raw.totals.essential} |`);
  lines.push(`| Recommended | ${sb?.recommended?.earned ?? Math.round(raw.recommendedRaw * 10) / 10} | 20 | ${raw.passing.recommended}/${raw.totals.recommended} |`);
  lines.push(`| Bonus | ${raw.bonusRaw} | 5 | ${raw.bonusSignals} signals |`);
  lines.push("");

  const fails = scored.filter((c) => c.eligible && !c.essentials_bonus_only && c.status !== "pass" && c.status !== "na");
  if (fails.length) {
    lines.push("## Issues");
    lines.push("");
    for (const f of fails.slice(0, 20)) {
      lines.push(`- **${f.id}** (${f.essentials_tier}): ${f.details}`);
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", Vary: "Accept" },
  });
}
