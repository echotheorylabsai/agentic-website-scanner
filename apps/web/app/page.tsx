"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
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

  return (
    <main>
      <div className="hero">
        <h1>Is your website ready for AI agents?</h1>
        <p>
          We run 124 checks across discovery, accessibility, usability and payments —
          the same roster and scoring as is-agentic.com, running locally.
        </p>
      </div>
      <form
        className="scan-form"
        onSubmit={(e) => { e.preventDefault(); void go(target); }}
      >
        <input
          placeholder="yourwebsite.com"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          aria-label="Website to scan"
        />
        <button type="submit" disabled={busy}>{busy ? "Starting…" : "Scan"}</button>
      </form>
      {error && <p style={{ color: "var(--bad)" }}>{error}</p>}
      <div className="examples">
        {["vercel.com", "eve.dev", "meta.ai", "example.org"].map((d) => (
          <button key={d} onClick={() => { setTarget(d); void go(d); }}>{d}</button>
        ))}
      </div>
    </main>
  );
}
