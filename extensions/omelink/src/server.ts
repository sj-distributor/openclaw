import * as http from "node:http";

type RouteHandler = (req: http.IncomingMessage, body: string) => Promise<any>;

class OmelinkServer {
  private server?: http.Server;
  private port?: number;
  private routes = new Map<string, RouteHandler>();

  async start(port: number) {
    if (this.server) {
      return;
    }

    this.port = port;

    this.server = http.createServer((req, res) => {
      if (req.method !== "POST") {
        res.statusCode = 404;
        res.end("not found");
        return;
      }

      const pathname = new URL(req.url ?? "/", "http://127.0.0.1").pathname;

      const handler = this.routes.get(pathname);

      if (!handler) {
        res.statusCode = 404;
        res.end("not found");
        return;
      }

      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
        if (body.length > 1_000_000) {
          req.destroy();
        }
      });

      req.on("end", async () => {
        try {
          const result = await handler(req, body);

          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(result ?? { ok: true }));
        } catch (err) {
          res.statusCode = 400;
          res.setHeader("content-type", "application/json");
          res.end(
            JSON.stringify({
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            }),
          );
        }
      });
    });

    await new Promise<void>((resolve, reject) => {
      this.server!.once("error", reject);

      this.server!.listen(port, "127.0.0.1", () => {
        this.server!.removeListener("error", reject);
        resolve();
      });
    });
  }

  addRoute(path: string, handler: RouteHandler) {
    this.routes.set(path, handler);
  }

  stop() {
    this.server?.close();
    this.server = undefined;
  }
}

export const omelinkServer = new OmelinkServer();
