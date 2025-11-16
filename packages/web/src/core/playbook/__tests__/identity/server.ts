import http, { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { StringDecoder } from "string_decoder";
import { createSecretKey } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import type { AddressInfo } from "node:net";

type UserInfo = {
  user: string;
  pass: string;
  name: string;
  is_admin: boolean;
  account_balance: number;
};

type AuthN = (req: IncomingMessage) => Promise<string | undefined>;

type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
  bodyOrQuery?: string | URLSearchParams
) => void;

const data: Record<string, UserInfo> = {
  "user@example.com": {
    user: "user@example.com",
    pass: "password123",
    name: "John Doe",
    is_admin: false,
    account_balance: 1000,
  },
};

const tokenToUser: Record<string, string> = {
  "2760cf6a-d99f-4f8f-881c-3637713615c0": "user@example.com",
};

let server: http.Server | undefined = undefined;

const routes: Record<string, Handler> = {
  "/api/user/info-token GET": (req, res) => handleGetUserInfo(req, res, getUserByToken),
  "/api/user/info-basic GET": (req, res) => handleGetUserInfo(req, res, getUserByBasicAuth),
  "/api/user/info-basic-trim GET": (req, res) =>
    handleGetUserInfo(req, res, getUserByBasicAuthTrim),
};

export function start(port: number | undefined): Promise<number> {
  server = http.createServer((req, res) => {
    const url = URL.parse(`http://localhost${req.url}`)!;
    const method = req.method?.toUpperCase() || "";

    const routeKey = `${url.pathname} ${method}`;
    const decoder = new StringDecoder("utf-8");
    let buffer = "";

    req.on("data", (chunk) => {
      buffer += decoder.write(chunk);
    });

    req.on("end", () => {
      buffer += decoder.end();

      const handler = routes[routeKey];
      if (handler) {
        if (method === "GET" || method === "DELETE") {
          handler(req, res, url.searchParams);
        } else {
          handler(req, res, buffer);
        }
      } else {
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

async function handleGetUserInfo(req: IncomingMessage, res: ServerResponse, authn: AuthN) {
  const user = await authn(req);
  if (user) {
    return respond(res, 200, data[user]);
  } else {
    return respond(res, 403, { message: "not authenticated" });
  }
}

async function getUserByToken(req: IncomingMessage): Promise<string | undefined> {
  const token = req.headers["x-access-token"] as string;
  if (token) {
    return tokenToUser[token];
  }
}

async function getUserByBasicAuth(req: IncomingMessage): Promise<string | undefined> {
  const credentials = getHttpBasicCredentials(req);
  if (credentials === "user:password123") {
    return "user@example.com";
  }
}

async function getUserByBasicAuthTrim(req: IncomingMessage): Promise<string | undefined> {
  const credentials = getHttpBasicCredentials(req);
  if (
    credentials === "user:password123" ||
    credentials === "user:password12" ||
    credentials === "user:password1"
  ) {
    return "user@example.com";
  }
}

function getHttpBasicCredentials(req: IncomingMessage): string | undefined {
  const auth = req.headers.authorization;
  const prefix = "Basic ";

  if (auth && auth.startsWith(prefix)) {
    return Buffer.from(auth.slice(prefix.length), "base64").toString("utf-8");
  }
}

function respond(res: ServerResponse, statusCode: number, payload: object) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Starting identity test server on port 8888");
  start(8888);
}
