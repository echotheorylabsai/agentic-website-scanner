import { NextResponse } from "next/server";
import { vendoredCatalog, assertCatalogVersion } from "@agentic-scanner/core";

export const dynamic = "force-dynamic";

/** GET /api/v1/checks — the pinned 124-check catalog (Ora-compatible shape). */
export async function GET() {
  assertCatalogVersion(vendoredCatalog);
  return NextResponse.json(vendoredCatalog);
}
