import { NextResponse } from "next/server";
import { startScan, getRunning, latestReport, isFresh } from "@/lib/jobs";
import { normalizeTarget } from "@agentic-scanner/core";

export const dynamic = "force-dynamic";

/** POST /api/scan — enqueue a scan (dedupe-collapsed). 202 with job info. */
export async function POST(req: Request) {
  let body: { target?: string; source?: string; force?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ type: "about:blank", title: "Bad request", status: 400, code: "invalid_url" }, { status: 400 });
  }
  const target = body.target;
  if (!target || typeof target !== "string") {
    return NextResponse.json({ type: "about:blank", title: "Missing target", status: 400, code: "invalid_url" }, { status: 400 });
  }
  try {
    normalizeTarget(target);
  } catch {
    return NextResponse.json({ type: "about:blank", title: "Invalid URL", status: 400, code: "invalid_url" }, { status: 400 });
  }

  const report = body.force ? null : await latestReport(target);
  if (report && isFresh(report)) {
    return NextResponse.json({
      status: "fresh",
      reportUrl: `/scan/${report.display_target}`,
      score: report.score,
      scannedAt: report.scanned_at,
    }, { status: 200 });
  }

  const result = startScan(target, (body.source as "web") ?? "api");
  return NextResponse.json({ ...result, reportUrl: `/scan/${new URL(normalizeTarget(target)).hostname.replace(/^www\./, "")}` }, { status: 202 });
}

/** GET /api/scan?target= — current scan/report status summary. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get("target");
  if (!target) {
    return NextResponse.json({ type: "about:blank", title: "Missing target", status: 400, code: "invalid_url" }, { status: 400 });
  }
  let normalized: string;
  try {
    normalized = normalizeTarget(target).toString();
  } catch {
    return NextResponse.json({ type: "about:blank", title: "Invalid url", status: 400, code: "invalid_url" }, { status: 400 });
  }
  const running = getRunning(normalized);
  const report = await latestReport(normalized);
  return NextResponse.json({
    running: Boolean(running),
    bufferedFrames: running?.buffer.length ?? 0,
    fresh: isFresh(report),
    score: report?.score ?? null,
    scannedAt: report?.scanned_at ?? null,
  });
}
