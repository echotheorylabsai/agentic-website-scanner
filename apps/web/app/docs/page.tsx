export const metadata = { title: "Docs — Agentic Scanner" };

export default function Docs() {
  return (
    <main>
      <div className="hero"><h1>Docs &amp; Integration</h1></div>
      <div className="card">
        <h3>REST API</h3>
        <pre className="fix-prompt">{`POST /api/scan            {"target":"example.com"}     → 202 started | 200 fresh
GET  /api/v1/report?url=example.com                    → PublicScanReport JSON
GET  /api/report/full?url=example.com                  → report + full roster
GET  /api/v1/checks                                    → pinned 124-check catalog
GET  /api/scan/stream?target=example.com               → SSE (real wire protocol)`}</pre>
      </div>
      <div className="card">
        <h3>Official CLI against this server</h3>
        <pre className="fix-prompt">{`IS_AGENTIC_API_ORIGIN=http://localhost:3000 npx is-agentic example.com`}</pre>
        <p style={{ color: "var(--muted)" }}>
          The official is-agentic CLI renders reports from our endpoints — the primary
          fidelity harness for this clone.
        </p>
      </div>
      <div className="card">
        <h3>Markdown negotiation</h3>
        <pre className="fix-prompt">{`curl -H "Accept: text/markdown" http://localhost:3000/scan/example.com`}</pre>
      </div>
    </main>
  );
}
