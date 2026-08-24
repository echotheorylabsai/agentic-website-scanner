import { describe, it, expect } from "vitest";
import * as t from "./schema";

describe("schema", () => {
  const cols = (tbl: any) => Object.keys(tbl);
  it("checks table has essentials vocabulary + composite flags + occurrences", () => {
    expect(cols(t.checks)).toEqual(expect.arrayContaining([
      "check_id", "essentials_tier", "essentials_bonus_only", "essentials_excluded",
      "bonus", "fraction", "occurrences", "na_reason", "eligible",
    ]));
  });
  it("reports.score is nullable (no notNull)", () => {
    expect((t.reports as any).score.notNull).toBe(false);
  });
  it("scan status enum includes gating", () => {
    expect(t.scanStatus.enumValues).toContain("gating");
  });
});
