import "./globals.css";

export const metadata = {
  title: "Agentic Website Scanner",
  description: "How ready is your website for AI agents?",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <a className="brand" href="/">is your site <span>agentic</span>?</a>
          <div className="links">
            <a href="/docs">Docs</a>
            <a href="/methodology">Methodology</a>
          </div>
        </nav>
        {children}
        <footer className="footer">
          Local clone of is-agentic.com · 124-check roster pinned to contractVersion {"{catalog}"} · scores comparable to the real tool
        </footer>
      </body>
    </html>
  );
}
