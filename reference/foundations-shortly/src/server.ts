import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createRateLimiter } from "./rate-limit";
import { createStore } from "./store";

export function createApp({ limit = 10, windowMs = 60_000 } = {}) {
  const store = createStore();
  const limiter = createRateLimiter({ limit, windowMs });

  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const send = (status: number, body?: unknown, headers: Record<string, string> = {}) => {
      res.writeHead(status, { "content-type": "application/json", ...headers });
      res.end(body === undefined ? undefined : JSON.stringify(body));
    };

    if (req.method === "POST" && req.url === "/shorten") {
      const ip = req.socket.remoteAddress ?? "unknown";
      if (!limiter.take(ip)) return send(429, { error: "Too many requests. Try again in a minute." }, { "retry-after": "60" });
      let raw = "";
      for await (const chunk of req) raw += chunk;
      try {
        const { url } = JSON.parse(raw) as { url?: string };
        const code = store.create(String(url));
        return send(201, { code, short: `/${code}` });
      } catch {
        return send(400, { error: "Send JSON like {\"url\": \"https://example.com\"}" });
      }
    }

    if (req.method === "GET" && req.url && /^\/[a-zA-Z0-9]{6}$/.test(req.url)) {
      const target = store.resolve(req.url.slice(1));
      if (!target) return send(404, { error: "No link with that code." });
      res.writeHead(301, { location: target });
      return res.end();
    }

    if (req.url === "/health") return send(200, { ok: true });
    send(404, { error: "Not found" });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3000);
  createApp().listen(port, () => console.log(`shortly listening on http://localhost:${port}`));
}
