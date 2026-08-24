import { NextResponse } from "next/server";
import { db, schema } from "@/db/index";
import { eq, desc } from "drizzle-orm";
import { latestReport } from "@/lib/jobs";
import { normalizeTarget } from "@agentic-scanner/core";

export const dynamic = "force-dynamic";

/**
 * GET /api/report/full?url=<target>
 * Progressive-disclosure payload: headline + issues + full per-check roster.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ type: "about:blank", title: "Missing url", status: 400, code: "invalid_url" }, { status: 400 });
  }
  let normalized: string;
  try {
    normalized = normalizeTarget(raw).toString();
  } catch {
    return NextResponse.json({ type: "about:blank", title: "Invalid url", status: 400, code: "invalid_url" }, { status: 400 });
  }
  const report = await latestReport(normalized);
  if (!report) {
    return NextResponse.json({ type: "about:blank", title: "No report yet", status: 404, code: "report_not_found" }, { status: 404 });
  }

  const checks = await db.select().from(schema.checks)
    .where(eq(schema.checks.scan_id, report.scan_id))
    .orderBy(desc(schema.checks.fraction));

  return NextResponse.json({
    report: report.payload,
    grade: report.grade,
    label: report.label,
    prev_scan_id: report.prev_scan_id,
    scanned_at: report.scanned_at,
    roster: checks.map((c) => ({
      check_id: c.check_id,
      essentials_tier: c.essentials_tier,
      essentials_bonus_only: c.essentials_bonus_only,
      bonus: c.bonus,
      status: c.status,
      score: c.score,
      max_score: c.max_score,
      fraction: c.fraction,
      details: c.details,
      recommendation: c.recommendation,
      na_reason: c.na_reason,
      eligible: c.eligible,
    })),
  });
}
