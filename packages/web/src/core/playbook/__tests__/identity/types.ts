import { IncomingMessage, ServerResponse } from "http";

export type Route = { path: string; method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" };

export type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
  body: string
) => Promise<void>;

export type Routes = [Route, Handler][];
