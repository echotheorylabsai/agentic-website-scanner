"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = { host: string; score: number | null };

export function HomeClient({ featured, recent }: { featured: Row[]; recent: Row[] }) {
  const router = useRouter();
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go(t: string) {
    const cleaned = t.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!cleaned) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: cleaned, source: "web" }),
      });
      if (!res.ok && res.status !== 202) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.title ?? `HTTP ${res.status}`);
      }
      router.push(`/scan/${encodeURIComponent(cleaned)}`);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
      setBusy(false);
    }
  }

  function Row({ host, score }: Row) {
    return (
      <button className="score-row" onClick={() => void go(host)} data-testid="score-row">
        <span className="favicon-dot">{host.charAt(0).toUpperCase()}</span>
        <span className="dom">{host}</span>
        {score != null && (
          <span><span className="score-num">{score}</span><span className="score-denom">/100</span></span>
        )}
      </button>
    );
  }

  return (
    <main>
      <div className="hero">
        <h1>Score how <span className="agentic-dotted">agentic</span> your site is</h1>
        <p>Enter a URL for a score based on what agents can discover, access, and use — computed locally by your own scanner.</p>
      </div>
      <form className="scan-form" onSubmit={(e) => { e.preventDefault(); void go(target); }}>
        <input
          placeholder="vercel.com"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          aria-label="Website to scan"
          data-testid="scan-input"
        />
        <button type="submit" disabled={busy} data-testid="scan-submit">{busy ? "Scoring…" : "Score"}</button>
      </form>
      {error && <p style={{ color: "var(--bad)", textAlign: "center" }}>{error}</p>}

      <div className="list-section">
        <h2 className="list-title">Featured scores</h2>
        {featured.map((r) => <Row key={r.host} host={r.host} score={r.score} />)}
      </div>

      <div className="list-section">
        <h2 className="list-title">Recent scores</h2>
        <div className="list-caption">latest scan per domain</div>
        {recent.length === 0
          ? <div className="empty-note">No scans yet — score a domain above to see it here.</div>
          : recent.map((r) => <Row key={r.host} host={r.host} score={r.score} />)}
      </div>
    </main>
  );
}
