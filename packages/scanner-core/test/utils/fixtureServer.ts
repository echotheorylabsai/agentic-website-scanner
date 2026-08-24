/** Minimal fixture HTTP server for probe tests. */
import { createServer, Server, IncomingMessage, ServerResponse } from "node:http";

export type Route = (req: IncomingMessage, res: ServerResponse, u: URL) => void;

export interface FixtureServer {
  server: Server;
  base: string;
  close(): Promise<void>;
}

export function startFixtureServer(routes: Record<string, Route>): Promise<FixtureServer> {
  const server = createServer((req, res) => {
    const u = new URL(req.url ?? "/", "http://x");
    const route = routes[u.pathname] ?? routes["*"];
    if (!route) { res.statusCode = 404; res.end(); return; }
    route(req, res, u);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const port = (server.address() as { port: number }).port;
      resolve({
        server,
        base: `http://127.0.0.1:${port}`,
        close: () => new Promise<void>((r) => server.close(() => r())),
      });
    });
  });
}
