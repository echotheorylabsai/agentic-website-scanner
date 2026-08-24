import { NextResponse } from "next/server";
import { latestReport } from "@/lib/jobs";
import { normalizeTarget } from "@agentic-scanner/core";
import { publicScanReport } from "@agentic-scanner/core";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/report?url=<target>
 * Wire-compatible with is-agentic.com/api/v1/report — the official CLI polls
 * this up to 5×2s after a stream ends.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("url");
  if (!raw) {
    return NextResponse.json(
      { type: "about:blank", title: "Missing url parameter", status: 400, code: "invalid_url" },
      { status: 400 },
    );
  }

  let normalized: string;
  try {
    normalized = normalizeTarget(raw).toString();
  } catch {
    return NextResponse.json({ type: "about:blank", title: "Invalid url", status: 400, code: "invalid_url" }, { status: 400 });
  }
  const report = await latestReport(normalized);
  if (!report) {
    return NextResponse.json(
      { type: "about:blank", title: "No report for this target yet", status: 404, code: "report_not_found" },
      { status: 404 },
    );
  }

  // validate against the strict contract before serving
  const parsed = publicScanReport.safeParse(report.payload);
  if (!parsed.success) {
    return NextResponse.json(
      { type: "about:blank", title: "Stored payload failed contract validation", status: 500, code: "scan_interrupted" },
      { status: 500 },
    );
  }

  return NextResponse.json(parsed.data, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
