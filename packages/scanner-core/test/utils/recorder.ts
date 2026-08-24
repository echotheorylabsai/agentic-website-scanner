/**
 * Fixture recorder — captures real fetches to JSON so tests replay offline.
 * Usage in a scratch script:
 *   const rec = new Recorder(realFetchAs); ... await rec.save("name.json");
 */
import { writeFileSync } from "node:fs";
import type { FetchedResponse } from "../../src/fetcher.js";

type Entry = { key: string; res: Pick<FetchedResponse, "finalUrl" | "status" | "headers" | "body"> };

export class Recorder {
  private entries: Entry[] = [];
  constructor(private inner: (url: string | URL, opts?: any) => Promise<FetchedResponse>) {}
  async fetch(url: string | URL, opts?: any): Promise<FetchedResponse> {
    const res = await this.inner(url, opts);
    this.entries.push({ key: `${opts?.ua ?? "browser"}|${res.finalUrl}`, res });
    return res;
  }
  save(path: string): void {
    writeFileSync(path, JSON.stringify(this.entries, null, 2));
  }
}
