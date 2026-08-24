import { startScan, getRunning, latestReport } from "@/lib/jobs";
import { normalizeTarget } from "@agentic-scanner/core";
import type { EngineEvent } from "@agentic-scanner/core";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();

function sseFrame(ev: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(ev)}\n\n`);
}

/**
 * GET /api/scan/stream?target=<host> — SSE in the REAL wire protocol.
 * - no report & none running → starts a scan (official CLI depends on this)
 * - running → replay ring buffer, then attach live
 * - complete + fresh → cache-hit triple (kind_detected → scan_complete{servedFromCache} → scan_archived)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawTarget = url.searchParams.get("target");
  if (!rawTarget) {
    return new Response(JSON.stringify({ type: "about:blank", title: "Missing target", status: 400, code: "invalid_url" }), { status: 400 });
  }

  let target: string;
  try {
    target = normalizeTarget(rawTarget).toString();
  } catch {
    return new Response(JSON.stringify({ type: "about:blank", title: "Invalid target", status: 400, code: "invalid_url" }), { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (ev: Record<string, unknown>) => controller.enqueue(sseFrame(ev));

      // Cache hit path — fresh completed report, nothing running
      const runningJob = getRunning(target);
      if (!runningJob) {
        const report = await latestReport(target);
        if (report && Date.now() - new Date(report.scanned_at).getTime() < 6 * 60 * 60 * 1000) {
          const ageSeconds = Math.round((Date.now() - new Date(report.scanned_at).getTime()) / 1000);
          send({ type: "kind_detected", kind: "domain", hint: "likely-domain", timestamp: Date.now() });
          send({ type: "scan_complete", result: { ...(report.payload as object), servedFromCache: true, resultAgeSeconds: ageSeconds }, servedFromCache: true, resultAgeSeconds: ageSeconds });
          send({ type: "scan_archived" });
          controller.close();
          return;
        }
      }

      // Start if needed (CLI flow), then subscribe
      let job = getRunning(target);
      if (!job) {
        startScan(target, "cli");
        // small wait for the job to register
        for (let i = 0; i < 20 && !(job = getRunning(target)); i++) {
          await new Promise((r) => setTimeout(r, 50));
        }
      }
      if (!job) {
        send({ type: "error", message: "Failed to start scan" });
        controller.close();
        return;
      }

      // replay buffer
      for (const ev of job.buffer) send(ev);

      // live attach; close on terminal frame
      let closed = false;
      const sub = (ev: EngineEvent) => {
        try { send(ev); } catch { /* client gone */ }
        if (ev.type === "scan_archived" || ev.type === "error") {
          job!.subscribers.delete(sub);
          if (!closed) { closed = true; controller.close(); }
        }
      };
      job.subscribers.add(sub);
      // if scan already finished while we were replaying
      const last = job.buffer[job.buffer.length - 1];
      if (last && (last.type === "scan_archived" || last.type === "error")) {
        job.subscribers.delete(sub);
        controller.close();
      }
    },
    cancel() {
      // subscriber cleanup happens via the wrapped closure above
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
