/**
 * Job runner — wires engine events → in-memory bus + ring buffer + DB.
 * startScan dedupes concurrent scans of the same target (collapse).
 */
import { runScan } from "@agentic-scanner/core";
import type { EngineEvent, ScanOutput } from "@agentic-scanner/core";
import { vendoredCatalog, normalizeTarget } from "@agentic-scanner/core";
import { lookupLabel, serializeReport, estGains } from "@agentic-scanner/core";
import { db, schema } from "../db/index";
import { eq, and, desc, sql } from "drizzle-orm";

export interface RunningJob {
  target: string;
  displayTarget: string;
  startedAt: number;
  subscribers: Set<(ev: EngineEvent) => void>;
  buffer: EngineEvent[]; // ring-buffer replay
}

const running = new Map<string, RunningJob>();
const MAX_BUFFER = 500;

function push(job: RunningJob, ev: EngineEvent) {
  job.buffer.push(ev);
  if (job.buffer.length > MAX_BUFFER) job.buffer.shift();
  for (const sub of job.subscribers) {
    try { sub(ev); } catch { /* subscriber died */ }
  }
}

export function getRunning(target: string): RunningJob | undefined {
  return running.get(normalizeTarget(target).toString());
}

/** Freshness window for cache-hit serving (spec §7: stale >6h shows chip + Rescan). */
export const FRESH_MS = 6 * 60 * 60 * 1000;

export async function latestReport(target: string) {
  const t = normalizeTarget(target).toString();
  const rows = await db.select().from(schema.reports)
    .where(eq(schema.reports.target, t))
    .orderBy(desc(schema.reports.scanned_at)).limit(1);
  return rows[0] ?? null;
}

export function isFresh(report: { scanned_at: Date } | null): boolean {
  return Boolean(report && Date.now() - report.scanned_at.getTime() < FRESH_MS);
}

export interface StartScanResult {
  status: "started" | "already-running";
  jobId: string;
}

export function startScan(rawTarget: string, source: "web" | "cli" | "api" = "api"): StartScanResult {
  const url = normalizeTarget(rawTarget);
  const key = url.toString();
  const existing = running.get(key);
  if (existing) return { status: "already-running", jobId: key };

  const job: RunningJob = {
    target: key,
    displayTarget: url.hostname.replace(/^www\./, ""),
    startedAt: Date.now(),
    subscribers: new Set(),
    buffer: [],
  };
  running.set(key, job);

  // fire-and-forget with retry policy (≤2 transient retries)
  void executeWithRetry(job, url.toString(), source);

  return { status: "started", jobId: key };
}

async function executeWithRetry(job: RunningJob, target: string, source: string, attempt = 0): Promise<void> {
  try {
    if (attempt === 0) await persistQueuedScan(job, source as "web"); // never re-insert on retry
    await executeScan(job, target, attempt);
  } catch (err) {
    if (attempt < 2) {
      push(job, { type: "discovery_phase", step: `Retrying after transient failure (${attempt + 1}/2)` });
      await new Promise((r) => setTimeout(r, 1500));
      return executeWithRetry(job, target, source, attempt + 1);
    }
    push(job, { type: "error", message: String(err) });
    await db.update(schema.scans)
      .set({ status: "failed", error_message: String(err), completed_at: new Date() })
      .where(and(eq(schema.scans.target, target), eq(schema.scans.status, "running")));
  } finally {
    // keep the completed job buffered briefly for late CLI polls; drop after 60s
    setTimeout(() => running.delete(target), 60_000);
  }
}

async function persistQueuedScan(job: RunningJob, source: "web" | "cli" | "api") {
  const prev = await latestReport(job.target);
  await db.insert(schema.scans).values({
    target: job.target,
    host: job.displayTarget,
    display_target: job.displayTarget,
    contract_version: vendoredCatalog.contractVersion,
    status: "running",
    source,
    queued_at: new Date(),
    started_at: new Date(),
  });
  void prev; // prev_scan_id linked at completion below
  void job;
}

async function executeScan(job: RunningJob, target: string, _attempt = 0) {
  let scanRow: { id: string } | undefined;
  const rows = await db.select({ id: schema.scans.id }).from(schema.scans)
    .where(and(eq(schema.scans.target, target), eq(schema.scans.status, "running")))
    .orderBy(desc(schema.scans.queued_at)).limit(1);
  scanRow = rows[0];
  const prev = await latestReport(target);

  const onComplete = async (out: ScanOutput) => {
    // gating → scoring stage updates
    if (scanRow) {
      await db.update(schema.scans).set({ status: "gating" }).where(eq(schema.scans.id, scanRow.id));
      await db.update(schema.scans).set({ status: "scoring" }).where(eq(schema.scans.id, scanRow.id));
    }

    // persist per-check rows
    for (const g of out.gated) {
      // B4-1: na rows serve catalog recommendation; null ONLY on REST-family branch
      const isRestFamilyNa = g.status === "na" && (g.na_reason ?? g.details ?? "").startsWith("No REST API surface");
      const recs = new Map(vendoredCatalog.checks.filter((c) => c.recommendation).map((c) => [c.id, c.recommendation as string]));
      await db.insert(schema.checks).values({
        scan_id: scanRow!.id,
        check_id: g.id,
        name: g.id,
        layer_id: "usability",
        essentials_tier: g.essentials_tier,
        essentials_bonus_only: g.essentials_bonus_only,
        bonus: g.essentials_bonus_only,
        max_score: g.max_score,
        score: g.score,
        fraction: g.max_score ? g.score / g.max_score : 0,
        status: g.status === "na" ? "na" : g.status,
        details: g.details,
        recommendation: g.status === "na"
          ? (isRestFamilyNa ? null : (recs.get(g.id) ?? g.recommendation ?? null))
          : (recs.get(g.id) ?? g.recommendation ?? null),
        na_reason: g.na_reason ?? null,
        eligible: g.eligible,
        occurrences: 1,
      }).onConflictDoNothing();
    }

    // build serialized report payload
    const names = new Map(vendoredCatalog.checks.map((c) => [c.id, c.name]));
    const scannedAt = new Date().toISOString();
    const raw = { ...out.raw, label: out.raw.label ?? lookupLabel(out.raw.score) };
    const payload = serializeReport(
      raw, out.gated,
      { target: target, displayTarget: job.displayTarget, reportUrl: `https://agentic.local/scan/${job.displayTarget}`, scannedAt },
      names,
      new Map(vendoredCatalog.checks.filter((c) => c.recommendation).map((c) => [c.id, c.recommendation as string])),
    );

    const inserted = await db.insert(schema.reports).values({
      scan_id: scanRow!.id,
      prev_scan_id: prev?.scan_id ?? null,
      target: target,
      display_target: job.displayTarget,
      report_url: `/scan/${job.displayTarget}`,
      payload,
      essential_earned: raw.essentialRaw,
      recommended_earned: raw.recommendedRaw,
      bonus_earned: raw.bonusRaw,
      bonus_signals: raw.bonusSignals,
      eligible_checks: raw.eligibleChecks,
      summary: null,
      top_fixes: estGains(out.gated).issues.slice(0, 3),
      score: raw.score,
      grade: raw.grade,
      label: raw.label,
      scanned_at: new Date(scannedAt),
    }).returning({ id: schema.reports.id });

    await db.update(schema.scans)
      .set({ status: "complete", completed_at: new Date() })
      .where(eq(schema.scans.id, scanRow!.id));

    void inserted;
    // reports row committed BEFORE scan_archived frame (engine awaits onComplete first)
  };

  const gen = runScan(target, { catalog: vendoredCatalog, onComplete });
  for await (const ev of gen) {
    push(job, ev);
  }
}
