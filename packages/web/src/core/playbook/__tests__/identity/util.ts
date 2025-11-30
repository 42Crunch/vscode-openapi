import type { ServerResponse } from "node:http";

export function respond(res: ServerResponse, statusCode: number, payload: object) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}
