import http from "http";
import { URL } from "node:url";
import { StringDecoder } from "string_decoder";
import type { AddressInfo } from "node:net";

import type { Handler, Routes } from "./types";
import { respond } from "./server-util.ts";
import { routes as basic } from "./basic/handler.ts";
import { routes as basicFlow } from "./basic-flow/handler.ts";
import { routes as basicSecurityRequirement } from "./basic-security-requirements/handler.ts";
import { routes as basicScopes } from "./basic-scopes/handler.ts";

type AggregateRoutes = Record<string, Routes>;
type PathHandler = Record<string, Handler>;
type ResolvedRoutes = [unknown, PathHandler][];

let server: http.Server | undefined = undefined;

const routes: AggregateRoutes = {
  "/basic": basic,
  "/basic-flow": basicFlow,
  "/basic-security-requirements": basicSecurityRequirement,
  "/basic-scopes": basicScopes,
};

export function start(port: number | undefined): Promise<number> {
  const resolvedRoutes = resolveRoutes(routes);

  server = http.createServer((req, res) => {
    const url = URL.parse(`http://localhost${req.url}`)!;
    const method = req.method?.toUpperCase() || "";

    const decoder = new StringDecoder("utf-8");
    let buffer = "";

    req.on("data", (chunk) => {
      buffer += decoder.write(chunk);
    });

    req.on("end", () => {
      buffer += decoder.end();

      const [handler, params] = matchPath(resolvedRoutes, url, method);

      if (handler) {
        console.log(`Handling ${method} ${url.pathname}`);
        handler(req, res, params, buffer);
      } else {
        console.log(`No handler found for ${method} ${url.pathname}`);
        respond(res, 404, { message: "Not Found" });
      }
    });
  });

  return new Promise<number>((resolve, reject) => {
    server!.listen(port ?? 0, () => {
      resolve((server!.address() as AddressInfo).port);
    });
  });
}

export function stop() {
  if (server) {
    return new Promise<void>((resolve) => {
      server!.close(async () => {
        server = undefined;
        //await new Promise((resolve) => setTimeout(resolve, 1000));
        resolve();
      });
    });
  }
}

function matchPath(
  routes: ResolvedRoutes,
  url: URL,
  method: string
): [Handler, Record<string, string>] | [undefined, undefined] {
  for (const [pattern, handler] of routes) {
    // @ts-ignore-next-line
    if (pattern.test(url)) {
      // @ts-ignore-next-line
      const result = pattern.exec(url);
      const params: Record<string, string> = Object.assign(
        {},
        result.protocol?.groups,
        result.hostname?.groups,
        result.port?.groups,
        result.pathname?.groups,
        result.search?.groups,
        result.hash?.groups
      );

      // @ts-ignore-next-line
      return [handler[method], params];
    }
  }
  return [undefined, undefined];
}

function resolveRoutes(routes: AggregateRoutes): ResolvedRoutes {
  const resolved: Record<string, PathHandler> = {};

  for (const [basePath, routeList] of Object.entries(routes)) {
    for (const [route, handler] of routeList) {
      const path = `${basePath}${route.path}`;
      let pathHandler = resolved[path];
      if (!pathHandler) {
        pathHandler = {};
        resolved[path] = pathHandler;
      }
      pathHandler[route.method] = handler;
    }
  }

  return Object.entries(resolved).map(([path, handler]) => [
    // @ts-ignore-next-line
    new URLPattern({ pathname: path }),
    handler,
  ]);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Starting identity test server on port 8888");
  start(8888);
}
