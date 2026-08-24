"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
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

interface RosterRow {
  check_id: string; name?: string; layer?: string;
  essentials_tier: string; essentials_bonus_only: boolean; bonus: boolean;
  status: string; score: number | null; max_score: number; fraction: number | null;
  details: string | null; recommendation: string | null; na_reason: string | null; eligible: boolean;
}

interface FullReport {
  report: ReportPayload;
  grade: string | null;
  label: string | null;
  prev_scan_id: string | null;
  scanned_at: string;
  roster: RosterRow[];
}

/* Light-theme grade colors (review W6: retuned for white background) */
const GRADE_COLORS: Record<string, string> = {
  "A+": "#1a7f37", A: "#1a7f37", B: "#9a6700", C: "#9a6700", D: "#cf222e", F: "#cf222e",
};
const FALLBACK_COLOR = "#707070";

const LAYER_LABELS: Record<string, string> = {
  discovery: "Discovery", accessibility: "Access", usability: "Usability", payments: "Payments",
};

function Donut({ score }: { score: number }) {
  const r = 40; const c = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, score)) / 100) * c;
  return (
    <div className="donut" data-testid="score-donut">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--text)" strokeWidth="8"
          strokeDasharray={`${filled} ${c - filled}`} strokeLinecap="butt" />
      </svg>
      <div className="score-center">{score}</div>
    </div>
  );
}

export default function ScanPage({ params }: { params: Promise<{ host: string }> }) {
  const { host } = use(params);
  const decoded = decodeURIComponent(host);
  const [report, setReport] = useState<FullReport | null>(null);
  const [stale, setStale] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [layerMap, setLayerMap] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const { events, done } = useScanStream(decoded);

  const load = useCallback(async () => {
    const res = await fetch(`/api/report/full?url=${encodeURIComponent(decoded)}`);
    if (res.status === 404) { setNotFound(true); return; }
    if (res.ok) {
      const data = (await res.json()) as FullReport;
      setReport(data);
      setNotFound(false);
      setStale(Date.now() - new Date(data.scanned_at).getTime() > 6 * 60 * 60 * 1000);
    }
  }, [decoded]);

  useEffect(() => {
    void load();
    const poll = done ? undefined : setInterval(() => void load(), 4000);
    return () => { if (poll) clearInterval(poll); };
  }, [load, done]);

  // catalog join: check_id → layer (client-side, no backend change — review item 4a)
  useEffect(() => {
    fetch("/api/v1/checks")
      .then((r) => r.json())
      .then((cat) => {
        const m: Record<string, string> = {};
        for (const c of cat.checks) m[c.id] = c.layer;
        setLayerMap(m);
      })
      .catch(() => {});
  }, []);

  async function rescan() {
    await fetch("/api/scan", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: decoded, source: "web", force: true }),
    });
    location.reload();
  }

  function copyPrompt() {
    if (!report) return;
    const lines = report.report.issues.slice(0, 5).map((i) =>
      `- ${i.name} (${i.tier}): ${i.details ?? ""}\n  Fix: ${i.recommendation ?? "n/a"}`);
    const text = `My site ${report.report.display_target} scored ${report.report.score}/100 for AI-agent readiness.\nTop issues to fix:\n${lines.join("\n")}`;
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyShare() {
    void navigator.clipboard?.writeText(window.location.href);
  }

  // live progress
  const checkCompletes = events.filter((e) => e["type"] === "check_complete");
  const total = (events.find((e) => e["type"] === "scan_init" && "totalChecks" in e) as { totalChecks?: number } | undefined)?.totalChecks ?? 124;
  const pct = Math.min(100, Math.round((checkCompletes.length / Math.max(total, 1)) * 100));
  const currentPhase = [...events].reverse().find((e) => e["type"] === "discovery_phase") as { step?: string } | undefined;

  const gradeColor = GRADE_COLORS[report?.grade ?? ""] ?? FALLBACK_COLOR;

  // grouped roster for tier audit (denominator = applicable non-na checks — review W4)
  const tiers: Array<[string, RosterRow[], string]> | null = report ? ([
    ["Essential", report.roster.filter((c) => c.essentials_tier === "required" && !c.essentials_bonus_only), `${report.report.score_breakdown.essential.earned} / ${report.report.score_breakdown.essential.available} points`],
    ["Recommended", report.roster.filter((c) => c.essentials_tier === "recommended" && !c.essentials_bonus_only), `${report.report.score_breakdown.recommended.earned} / ${report.report.score_breakdown.recommended.available} points`],
    ["Bonus signals", report.roster.filter((c) => c.essentials_bonus_only || (c.bonus && c.essentials_tier !== "required")), `${report.report.score_breakdown.bonus.positive_signals} positive · +${report.report.score_breakdown.bonus.points} points`],
  ] as const).map(([n, cs, pts]) => [n, cs as RosterRow[], pts]) : null;

  // layer bars (catalog join; denominator = applicable non-na; na shown separately — review W4)
  const layerRows = useMemo(() => {
    if (!report) return [];
    const byLayer: Record<string, { pass: number; applicable: number; na: number; total: number }> = {};
    for (const c of report.roster) {
      const layer = layerMap[c.check_id] ?? "usability";
      byLayer[layer] ??= { pass: 0, applicable: 0, na: 0, total: 0 };
      byLayer[layer].total++;
      if (c.status === "na") byLayer[layer].na++;
      else {
        byLayer[layer].applicable++;
        if (c.status === "pass") byLayer[layer].pass++;
      }
    }
    return Object.entries(byLayer).map(([layer, s]) => {
      const pctVal = s.applicable ? Math.round((s.pass / s.applicable) * 100) : 0;
      const strength = pctVal >= 80 ? "Strong" : pctVal >= 60 ? "Ready with gaps" : "Needs work";
      return { layer, pct: pctVal, strength, ...s };
    }).sort((a, b) => b.pct - a.pct);
  }, [report, layerMap]);

  const sb = report?.report.score_breakdown;

  return (
    <main>
      {!report && !notFound && (
        <div className="progress-card" data-testid="progress-card">
          <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>Scanning {decoded}…</h2>
          {currentPhase?.step && <p style={{ color: "var(--muted)", margin: 0 }}>{currentPhase.step}</p>}
          <div className="progress-line"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>{checkCompletes.length}/{total} checks complete</p>
        </div>
      )}
      {!report && notFound && (
        <div className="progress-card">
          <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>Starting scan of {decoded}…</h2>
          <div className="progress-line"><div className="progress-fill" style={{ width: "8%" }} /></div>
        </div>
      )}
      {report && (
        <>
          <div className="report-header">
            <div>
              <div className="report-domain">
                {report.report.display_target}
                <button className="share-btn" onClick={copyShare}>Share ⧉</button>
                {stale && <span className="stale-chip">Stale — older than 6h</span>}
              </div>
              <h1 className="report-label" style={{ color: gradeColor }}>{report.label ?? report.report.score_label}</h1>
              <div className="score-line">
                <Donut score={report.report.score ?? 0} />
                <div>
                  <div className="score-big" data-testid="score-value">{report.report.score}</div>
                  <div className="score-of">/ 100</div>
                </div>
              </div>
              <button className="prompt-btn" onClick={copyPrompt} data-testid="prompt-btn">
                {copied ? "Copied ✓" : "Prompt to improve"}
              </button>
              <button className="rescan-link" onClick={() => void rescan()}>Rescan</button>
            </div>
            <div className="breakdown-col" data-testid="breakdown-col">
              <div className="breakdown-row">
                <div><div className="b-name">Essential</div><div className="b-sub">{sb?.essential.passing} of {sb?.essential.total} checks passed</div></div>
                <div className="b-val">{sb?.essential.earned} / {sb?.essential.available}</div>
              </div>
              <div className="breakdown-row">
                <div><div className="b-name">Recommended</div><div className="b-sub">{sb?.recommended.passing} of {sb?.recommended.total} checks passed</div></div>
                <div className="b-val">{sb?.recommended.earned} / {sb?.recommended.available}</div>
              </div>
              <div className="breakdown-row">
                <div><div className="b-name">Bonus signals</div><div className="b-sub">{sb?.bonus.positive_signals} positive, never required</div></div>
                <div className="b-val">+{sb?.bonus.points}</div>
              </div>
            </div>
          </div>

          <h2 className="section-h2">Fix these gaps first</h2>
          <p className="section-sub">Critical access gaps come first, followed by other applicable readiness gaps.</p>
          {report.report.issues.length === 0 && (
            <p className="section-sub">No gaps — every applicable check passed.</p>
          )}
          {report.report.issues.map((i, idx) => (
            <div className="gap-row" key={i.id}>
              <span className="gap-num">{String(idx + 1).padStart(2, "0")}</span>
              <div>
                <p className="gap-title">{i.name}</p>
                <p className="gap-text">{i.recommendation ?? i.details}</p>
              </div>
              <span className="gap-cat">{i.tier === "essential" ? "Critical access" : "Other readiness checks"}</span>
            </div>
          ))}

          <h2 className="section-h2">Layer coverage</h2>
          <p className="section-sub">Pass ratio over applicable checks per layer. N/A checks are excluded from the denominator.</p>
          {layerRows.map((l) => (
            <div className="layer-row" key={l.layer} data-testid="layer-row">
              <div><div className="layer-name">{LAYER_LABELS[l.layer] ?? l.layer}</div><div className="layer-stat">{l.strength}</div></div>
              <div className="layer-bar"><div className="layer-fill" style={{ width: `${l.pct}%` }} /></div>
              <div className="layer-stat">{l.pct}% · {l.pass} of {l.applicable} applicable passed{l.na ? ` · ${l.na} N/A` : ""}</div>
            </div>
          ))}

          <h2 className="section-h2">Audit the checks behind the score</h2>
          <p className="section-sub">Applicable evidence is grouped by how it contributes to this score. Bonus checks appear only when they add points.</p>
          {tiers?.map(([tierName, checks, points]) => {
            const passed = checks.filter((c) => c.status === "pass").length;
            return (
              <details className="tier-audit" key={tierName} data-testid="tier-section">
                <summary>
                  {tierName}
                  <span className="tier-sums">{passed} of {checks.length} passed · {points}</span>
                </summary>
                {checks.map((c) => (
                  <div className="check-card" key={c.check_id} data-testid="check-card">
                    <div className="cc-head">
                      <span className="cc-name">{c.name || c.check_id}{c.essentials_bonus_only || c.bonus ? " ★" : ""}</span>
                      <span className={`cc-status status-${c.status}`}>
                        {c.status === "na" ? "N/A" : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </div>
                    {c.status === "na"
                      ? <p className="na-note">{c.na_reason ?? c.details}</p>
                      : <>
                          {c.details && <p className="cc-details">{c.details}</p>}
                          {c.recommendation && (
                            <div className="rec-block" data-testid="recommendation-block">
                              <div className="rec-label">RECOMMENDATION</div>
                              <p>{c.recommendation}</p>
                            </div>
                          )}
                        </>
                    }
                  </div>
                ))}
              </details>
            );
          })}

          <p className="section-sub" style={{ marginTop: 24 }}>
            Snapshot taken {new Date(report.scanned_at).toLocaleString()}. Run another scan from the homepage to refresh these recommendations.
          </p>
        </>
      )}
    </main>
  );
}
