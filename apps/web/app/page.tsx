import { db, schema } from "@/lib/db-bridge";
import { desc, max, sql } from "drizzle-orm";
import { HomeClient } from "./home-client";

export const dynamic = "force-dynamic";

const FEATURED = ["is-agentic.com", "vercel.com", "eve.dev", "meta.ai"];

export default async function Home() {
  let recent: Array<{ host: string; score: number | null }> = [];
  try {
    const latestPerTarget = await db
      .select({ target: schema.reports.target, score: max(schema.reports.score), host: sql<string>`min(${schema.reports.display_target})` })
      .from(schema.reports)
      .groupBy(schema.reports.target)
      .orderBy(desc(max(schema.reports.scanned_at)))
      .limit(10);
    const seen = new Set<string>();
    recent = latestPerTarget
      .filter((r) => { const k = (r.host ?? r.target).toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
      .map((r) => ({ host: r.host ?? r.target, score: r.score }));
  } catch {
    recent = []; // DB unreachable — page still renders (O1 fallback)
  }

  const featuredScores = new Map(recent.map((r) => [r.host.toLowerCase(), r.score]));
  const featured = FEATURED.map((h) => ({ host: h, score: featuredScores.get(h) ?? null }));
  const featuredSet = new Set(FEATURED.map((h) => h.toLowerCase()));
  const recentOnly = recent.filter((r) => !featuredSet.has(r.host.toLowerCase()));

  return <HomeClient featured={featured} recent={recentOnly} />;
}
