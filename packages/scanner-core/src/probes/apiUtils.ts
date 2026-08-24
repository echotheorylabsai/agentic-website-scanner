import type { ScanContext } from "./types.js";

export function specText(ctx: ScanContext): string {
  return ctx.openapi?.body ?? "";
}
