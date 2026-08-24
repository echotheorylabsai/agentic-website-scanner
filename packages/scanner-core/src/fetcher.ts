/** Multi-UA fetcher — never throws on HTTP status; throws only on network/timeout errors. */

export const UA_ROSTER = {
  browser: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  gptbot: "GPTBot/1.2",
  chatgpt_user: "ChatGPT-User/1.0",
  claudebot: "ClaudeBot/1.0",
  perplexitybot: "PerplexityBot/1.0",
  google_extended: "Google-Extended",
  deepseekbot: "DeepSeekBot/1.0",
  ora_agent: "ora-agent/1.0",
} as const;

export type UaName = keyof typeof UA_ROSTER;

export interface FetchedResponse {
  url: string;
  finalUrl: string;
  status: number;
  headers: Record<string, string>; // lower-cased keys
  body: string;
}

export type FetchAs = (url: string | URL, opts?: { ua?: UaName; accept?: string; timeoutMs?: number }) => Promise<FetchedResponse>;

export function makeFetcher(defaultTimeoutMs = 15_000): FetchAs {
  return async (url, opts = {}) => {
    const { ua = "browser", accept = "*/*", timeoutMs = defaultTimeoutMs } = opts;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url.toString(), {
        headers: { "User-Agent": UA_ROSTER[ua], Accept: accept },
        redirect: "follow",
        signal: ctrl.signal,
      });
      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
      const body = await res.text();
      return { url: url.toString(), finalUrl: res.url || url.toString(), status: res.status, headers, body };
    } finally {
      clearTimeout(timer);
    }
  };
}
