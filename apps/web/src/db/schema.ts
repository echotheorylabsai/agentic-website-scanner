import {
  pgTable, pgEnum, serial, text, integer, timestamp, boolean, jsonb,
  doublePrecision, uniqueIndex, index,
} from "drizzle-orm/pg-core";

export const scanStatus = pgEnum("scan_status", [
  "queued", "running", "gating", "scoring", "complete", "failed", "cancelled",
]);
export const checkStatus = pgEnum("check_status", [
  "pass", "fail", "warning", "na", "error",
]);
export const essentialsTier = pgEnum("essentials_tier", [
  "required", "recommended", "emerging",
]);

/** Normalized target host + origin URL per scan. */
export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  target: text("target").notNull(),          // normalized https://host
  display_target: text("display_target").notNull(),
  status: scanStatus("status").notNull().default("queued"),
  source: text("source").notNull().default("web"), // web | cli | api
  error_message: text("error_message"),
  started_at: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completed_at: timestamp("completed_at", { withTimezone: true }),
}, (t) => [index("scans_target_idx").on(t.target)]);

/**
 * One row per check result per scan.
 * essentials_tier: Ora vocabulary required|recommended|emerging (NOT 'essential').
 */
export const checks = pgTable("checks", {
  id: serial("id").primaryKey(),
  scan_id: integer("scan_id").notNull().references(() => scans.id, { onDelete: "cascade" }),
  check_id: text("check_id").notNull(),
  name: text("name").notNull(),
  layer_id: text("layer_id").notNull(),      // discovery|accessibility|usability|payments
  native_tier: text("native_tier"),          // catalog native tier
  essentials_tier: essentialsTier("essentials_tier"), // required|recommended|emerging
  essentials_bonus_only: boolean("essentials_bonus_only").notNull().default(false),
  essentials_excluded: boolean("essentials_excluded").notNull().default(false),
  bonus: boolean("bonus").notNull().default(false),   // composite rule
  max_score: integer("max_score").notNull().default(0),
  score: doublePrecision("score"),           // null until scored / N/A
  fraction: doublePrecision("fraction"),
  status: checkStatus("status").notNull().default("na"),
  details: text("details"),
  recommendation: text("recommendation"),
  na_reason: text("na_reason"),
  eligible: boolean("eligible").notNull().default(true),
  occurrences: doublePrecision("occurrences"), // MCP dedup averaging weight
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("checks_scan_check_uq").on(t.scan_id, t.check_id)]);

/**
 * Serialized PublicScanReport (is-agentic compatible shape).
 * score is nullable until the scan completes; revision chain via prev_scan_id.
 */
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  scan_id: integer("scan_id").notNull().references(() => scans.id),
  prev_scan_id: integer("prev_scan_id"),
  target: text("target").notNull(),
  display_target: text("display_target").notNull(),
  report_url: text("report_url").notNull(),   // canonical /scan/<host>
  payload: jsonb("payload").notNull(),        // full PublicScanReport
  essential_earned: doublePrecision("essential_earned"),
  recommended_earned: doublePrecision("recommended_earned"),
  bonus_earned: doublePrecision("bonus_earned"),
  score: integer("score"),                    // nullable until complete
  grade: text("grade"),
  label: text("label"),
  scanned_at: timestamp("scanned_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("reports_target_idx").on(t.target)]);

/** Reference snapshots fetched from the real tool / Ora for comparison harness. */
export const referenceReports = pgTable("reference_reports", {
  id: serial("id").primaryKey(),
  host: text("host").notNull(),
  source: text("source").notNull(),           // is-agentic-report | ora-score | ora-catalog | sse-capture
  payload: jsonb("payload").notNull(),
  fetched_at: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
  scanned_at: timestamp("scanned_at", { withTimezone: true }), // reference's own timestamp
}, (t) => [index("reference_host_idx").on(t.host)]);
