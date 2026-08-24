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

score = round(round₀.₁(E) + round₀.₁(R) + round₀.₁(B))   // components round to 0.1

Grade bands: A+ ≥95 · A ≥86 · B ≥70 · C ≥48 · D ≥28 · F below

Label bands (from live-observed official reports): ≥95 Exceptional agent experience · ≥80 Strong technical baseline ·
≥70 Ready with a few material gaps · ≥48 Important blockers remain · ≥28 / below Agents are likely to struggle`}</pre>
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
          Deterministic dependent-family N/A only:
          • REST spec-dependent checks (api-error-model, api-versioning-policy, pagination-shape,
            async-job-pattern, response-schema-coverage) require a parsed OpenAPI surface
          • rate-limit-headers requires a REST or GraphQL surface (combined gate)
          • GraphQL / MCP / payments families require their respective surfaces (payments signals
            are detected from the homepage by a phase-1 detector)
          • Homepage-unreachable cascades: docs-auth-gate, redirect-hygiene, code-fence-validity
            (no served markdown ⇒ N/A, not free credit)
          Detector checks are never auto-N&#39;d. Gating runs ahead of frame emission — gated checks
          stream as status &quot;na&quot; with the family reason, matching the official wire format.
        </p>
      </div>
    </main>
  );
}
