import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { NavPill } from "./nav-pill";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata = {
  title: "Agentic Website Scanner",
  description: "Score how agentic your site is",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <nav className="nav">
          <a className="brand" href="/"><span className="logo-tri">▲</span> / Is Agentic <span style={{ color: "var(--muted)", fontWeight: 400 }}>(local)</span></a>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div className="nav-links">
              <a href="/docs">Docs</a>
              <a href="/methodology">Methodology</a>
            </div>
            <NavPill />
          </div>
        </nav>
        {children}
        <footer className="footer">
          <span>Local clone of is-agentic.com · Source: <strong>local scanner</strong></span>
          <span>
            <a href="/docs">Docs</a>
            <a href="/methodology">Methodology</a>
          </span>
        </footer>
      </body>
    </html>
  );
}
