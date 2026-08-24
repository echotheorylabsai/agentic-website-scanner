"use client";

export function NavPill() {
  return (
    <button
      className="nav-pill"
      onClick={() => navigator.clipboard?.writeText("IS_AGENTIC_API_ORIGIN=http://localhost:3100 npx is-agentic [domain]")}
      title="Copy CLI usage"
    >
      <span className="dollar">$</span> IS_AGENTIC_API_ORIGIN=http://localhost:3100 npx is-agentic [domain] ⧉
    </button>
  );
}
