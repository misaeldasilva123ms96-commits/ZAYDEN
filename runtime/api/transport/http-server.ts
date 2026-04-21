import { createServer, type Server } from "node:http";

import type { ApiServerDependencies } from "./routes.js";
import { dispatchApi } from "./routes.js";

export function createApiHttpServer(deps: ApiServerDependencies): Server {
  return createServer((req, res) => {
    void dispatchApi(req, res, deps);
  });
}

export function listenApiServer(
  server: Server,
  port: number,
  host = "127.0.0.1",
): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve());
  });
}
