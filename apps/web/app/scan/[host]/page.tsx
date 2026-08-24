"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useScanStream } from "../../../components/useScanStream";

interface ReportPayload {
  target: string; display_target: string; report_url: string;
  score: number | null; score_label: string | null; scanned_at: string;
  eligible_checks: number;
  score_breakdown: {
    essential: { earned: number; available: number; passing: number; total: number };
    recommended: { earned: number; available: number; passing: number; total: number };
    bonus: { points: number; positive_signals: number };
  };
  issues: Array<{ id: string; name: string; tier: string; result: string; details: string | null; recommendation: string | null }>;
}

interface FullReport {
  report: ReportPayload;
  grade: string | null;
  label: string | null;
  prev_scan_id: string | null;
  scanned_at: string;
  roster: Array<{
    check_id: string; essentials_tier: string; essentials_bonus_only: boolean; bonus: boolean;
    status: string; score: number | null; max_score: number; fraction: number | null;
    details: string | null; recommendation: string | null; na_reason: string | null; eligible: boolean;
  }>;
}

const GRADE_COLORS: Record<string, string> = {
  "A+": "#10b981", A: "#34d399", B: "#fbbf24", C: "#fb923c", D: "#f87171", F: "#ef4444",
};

export default function ScanPage({ params }: { params: Promise<{ host: string }> }) {
  const { host } = use(params);
  const decoded = decodeURIComponent(host);
  const [report, setReport] = useState<FullReport | null>(null);
  const [stale, setStale] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { events, done } = useScanStream(decoded);

  const load = useCallback(async () => {
    const res = await fetch(`/api/report/full?url=${encodeURIComponent(decoded)}`);
    if (res.status === 404) { setNotFound(true); return; }
    if (res.ok) {
      const data = (await res.json()) as FullReport;
      setReport(data);
      setNotFound(false);
      // stale chip: >6h
      setStale(Date.now() - new Date(data.scanned_at).getTime() > 6 * 60 * 60 * 1000);
    }
  }, [decoded]);

  useEffect(() => {
    void load();
    const poll = done ? undefined : setInterval(() => void load(), 4000);
    return () => { if (poll) clearInterval(poll); };
  }, [load, done]);

  async function rescan() {
    await fetch("/api/scan", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: decoded, source: "web", force: true }),
    });
    location.reload();
  }

  function copyFixPrompt() {
    if (!report) return;
    const lines = report.report.issues.slice(0, 5).map((i) =>
      `- ${i.name} (${i.tier}): ${i.details ?? ""}\n  Fix: ${i.recommendation ?? "n/a"}`);
    const text = `My site ${report.report.display_target} scored ${report.report.score}/100 for AI-agent readiness.\nTop issues to fix:\n${lines.join("\n")}`;
    void navigator.clipboard.writeText(text);
  }

  // live progress from stream frames
  const checkCompletes = events.filter((e) => e["type"] === "check_complete");
  const total = (events.find((e) => e["type"] === "scan_init" && "totalChecks" in e) as { totalChecks?: number } | undefined)?.totalChecks ?? 124;
  const pct = Math.min(100, Math.round((checkCompletes.length / Math.max(total, 1)) * 100));
  const currentPhase = [...events].reverse().find((e) => e["type"] === "discovery_phase") as { step?: string } | undefined;

  const gradeColor = GRADE_COLORS[report?.grade ?? ""] ?? "#9aa3ad";

  return (
    <main>
      {!report && !notFound && (
        <div className="card">
          <h2>Scanning {decoded}…</h2>
          {currentPhase?.step && <p style={{ color: "var(--muted)" }}>{currentPhase.step}</p>}
          <div className="progress-line"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>{checkCompletes.length}/{total} checks complete</p>
        </div>
      )}
      {!report && notFound && (
        <div className="card">
          <h2>Starting scan of {decoded}…</h2>
          <p style={{ color: "var(--muted)" }}>The scanner is spinning up. This page updates automatically.</p>
          <div className="progress-line"><div className="progress-fill" style={{ width: "8%" }} /></div>
        </div>
      )}
      {report && (
        <>
          <div className="card">
            <span className="score-big">{report.report.score}</span>
            <span className="grade-chip" style={{ background: `${gradeColor}22`, color: gradeColor }}>
              {report.grade}
            </span>
            {stale && <span className="stale-chip">Stale — older than 6h</span>}
            {stale && <button className="btn-secondary" style={{ marginLeft: 12 }} onClick={() => void rescan()}>Rescan</button>}
            <button className="btn-secondary copy-btn" onClick={copyFixPrompt}>Copy fix prompt</button>
            <p style={{ color: "var(--muted)", marginTop: 8 }}>{report.label ?? report.report.score_label}</p>
            <table className="roster" style={{ maxWidth: 480 }}>
              <tbody>
                <tr><td>Essential ({report.report.score_breakdown.essential.total} checks)</td><td>{report.report.score_breakdown.essential.earned}/80</td></tr>
                <tr><td>Recommended ({report.report.score_breakdown.recommended.total})</td><td>{report.report.score_breakdown.recommended.earned}/20</td></tr>
                <tr><td>Bonus ({report.report.score_breakdown.bonus.positive_signals} signals)</td><td>+{report.report.score_breakdown.bonus.points}/5</td></tr>
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3>Issues ({report.report.issues.length})</h3>
            {report.report.issues.map((i) => (
              <div key={i.id} className={`issue ${i.result === "partial" ? "partial" : ""}`}>
                <h4>{i.name}<span className="tier-tag">{i.tier}</span></h4>
                <p>{i.details}</p>
                {i.recommendation && <p style={{ marginTop: 6 }}>→ {i.recommendation}</p>}
              </div>
            ))}
          </div>

          <details className="card">
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Full check roster ({report.roster.length})</summary>
            <table className="roster">
              <thead><tr><th>Check</th><th>Tier</th><th>Status</th><th>Score</th></tr></thead>
              <tbody>
                {report.roster.map((c) => (
                  <tr key={c.check_id}>
                    <td>{c.check_id}{c.bonus || c.essentials_bonus_only ? " ★" : ""}</td>
                    <td>{c.na_reason ?? c.essentials_tier}</td>
                    <td className={`status-${c.status}`}>{c.status}</td>
                    <td>{c.score ?? "—"}/{c.max_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </main>
  );
}
