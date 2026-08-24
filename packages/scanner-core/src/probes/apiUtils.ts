import type { ScanContext } from "./types";

export function specText(ctx: ScanContext): string {
  return ctx.openapi?.body ?? "";
}
