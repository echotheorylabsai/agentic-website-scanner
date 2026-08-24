export const metadata = { title: "Methodology — Agentic Scanner" };

export default function Methodology() {
  return (
    <main>
      <div className="hero"><h1>Scoring methodology</h1></div>
      <div className="card">
        <h3>The formula (validated against the real tool)</h3>
        <pre className="fix-prompt">{`fraction = score / max_score          (error ⇒ 0, still eligible)

Essential   = 80 × mean(fractions of eligible non-bonus-only checks with essentialsTier 'required')
Recommended = 20 × mean(… 'recommended')
Bonus       = min(5, 0.25 × Σ positive bonus fractions)

score = round(trunc₀.₁(E) + trunc₀.₁(R) + trunc₀.₁(B))

Grade bands: A+ ≥95 · A ≥86 · B ≥70 · C ≥48 · D ≥28 · F below`}</pre>
      </div>
      <div className="card">
        <h3>Check pools</h3>
        <p style={{ color: "var(--muted)" }}>
          Grouping uses Ora&apos;s <code>essentialsTier</code> field (<code>required</code>/<code>recommended</code>/<code>emerging</code>) —
          never the native tier. Bonus-only = <code>essentialsBonusOnly OR native bonus</code>, with a single exception:
          <code>markdown-negotiation-vary</code> stays in the Essential pool. Two robots checks are excluded entirely.
        </p>
      </div>
      <div className="card">
        <h3>Gating</h3>
        <p style={{ color: "var(--muted)" }}>
          Deterministic dependent-family N/A only: REST spec-dependent checks require an OpenAPI surface;
          GraphQL/MCP/payments families require their respective surfaces. Detector checks are never auto-N/A&apos;d.
        </p>
      </div>
    </main>
  );
}
