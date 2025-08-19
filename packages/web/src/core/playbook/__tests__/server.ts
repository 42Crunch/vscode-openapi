import http, { IncomingMessage, ServerResponse } from "http";
import url from "url";
import { StringDecoder } from "string_decoder";
import { createSecretKey } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import type { ParsedUrlQuery } from "node:querystring";
import { AddressInfo } from "node:net";

type UserInfo = {
  user: string;
  pass: string;
  name: string;
  is_admin: boolean;
  account_balance: number;
};

type Claims = {
  user: string;
  exp: number;
};

type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
  bodyOrQuery?: string | ParsedUrlQuery
) => void;

const jwtKey = createSecretKey(Buffer.from("my_secret_key", "utf-8"));
const data: Record<string, UserInfo> = {}; // email -> userInfo

let server: http.Server | undefined = undefined;

const routes: Record<string, Handler> = {
  "api/login POST": (req, res, body) => handleLogin(req, res, body as string),
  "api/register POST": (req, res, body) => handleRegister(req, res, body as string),
  "api/user/info GET": (req, res) => handleGetUserInfo(req, res),
  "api/user/edit_info PUT": (req, res, body) => handleEditUserInfo(req, res, body as string),
  "api/user/delete DELETE": (req, res, query) =>
    handleDeleteUser(req, res, query as ParsedUrlQuery),
  "api/admin/users/search GET": (req, res, query) =>
    handleAdminSearch(req, res, query as ParsedUrlQuery),
  "api/admin/all_users GET": (req, res) => handleAdminAllUsers(req, res),
};

export function start(port: number | undefined): Promise<number> {
  server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url || "", true);
    const path = parsedUrl.pathname?.replace(/^\/+|\/+$/g, "") || "";
    const method = req.method?.toUpperCase() || "";

    const routeKey = `${path} ${method}`;
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
          handler(req, res, parsedUrl.query);
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

// Handlers
async function handleLogin(req: IncomingMessage, res: ServerResponse, body: string) {
  const { user, pass } = JSON.parse(body);

  if (!testUserStructure(user)) {
    return respond(res, 422, { message: "error, missing or invalid parameters - user" });
  }
  if (!testPassStructure(pass)) {
    return respond(res, 422, { message: "error, missing or invalid parameters - password" });
  }

  const info = data[user.toLowerCase()];
  if (!info) {
    return respond(res, 406, { message: "error, user not found" });
  }
  if (info.pass === pass) {
    return createToken(user, res);
  } else {
    return respond(res, 406, { message: "error, incorrect password" });
  }
}

async function handleRegister(req: IncomingMessage, res: ServerResponse, body: string) {
  const info: UserInfo = JSON.parse(body);

  if (
    !testUserStructure(info.user) ||
    !testPassStructure(info.pass) ||
    !testNameStructure(info.name) ||
    info.account_balance < 0 ||
    info.account_balance > 1000
  ) {
    return respond(res, 400, { message: "body format error" });
  }

  const user = info.user.toLowerCase();
  if (data[user]) {
    return respond(res, 409, { message: "user already registered" });
  }
  data[user] = info;
  return createToken(user, res);
}

async function handleGetUserInfo(req: IncomingMessage, res: ServerResponse) {
  const user = await tokenCheck(req);
  if (user) {
    return respond(res, 200, data[user]);
  } else {
    return respond(res, 403, { message: "no token provided or invalid token" });
  }
}

async function handleEditUserInfo(req: IncomingMessage, res: ServerResponse, body: string) {
  const user = await tokenCheck(req);
  if (!user) {
    return respond(res, 403, { message: "no token provided or invalid token" });
  }

  const userUpdated: UserInfo = JSON.parse(body);
  if (
    (userUpdated.is_admin && !data[user].is_admin) ||
    userUpdated.user.toLowerCase() !== user ||
    userUpdated.account_balance < 0 ||
    !testPassStructure(userUpdated.pass) ||
    !testNameStructure(userUpdated.name)
  ) {
    return respond(res, 403, { message: "operation forbidden" });
  }

  delete data[user];
  data[userUpdated.user.toLowerCase()] = userUpdated;
  return respond(res, 200, { message: "information updated" });
}

async function handleDeleteUser(req: IncomingMessage, res: ServerResponse, query: ParsedUrlQuery) {
  const token = query.token as string;
  const user = await tokenParse(token);

  if (data[user]) {
    delete data[user];
    return respond(res, 200, { message: "deleted" });
  } else {
    return respond(res, 404, { message: "not found" });
  }
}

async function handleAdminSearch(req: IncomingMessage, res: ServerResponse, query: ParsedUrlQuery) {
  const user = await tokenCheck(req);
  if (!user) {
    return respond(res, 403, { message: "no token provided or invalid token" });
  }

  if (!data[user].is_admin) {
    return respond(res, 403, { message: "you are not an admin" });
  }

  const search = query.search as string;
  if (!search || !testUserStructure(search)) {
    return respond(res, 400, { message: "bad request" });
  }

  const foundUser = data[search.toLowerCase()];
  if (foundUser) {
    return respond(res, 200, foundUser);
  } else {
    return respond(res, 400, { message: "user not found" });
  }
}

async function handleAdminAllUsers(req: IncomingMessage, res: ServerResponse) {
  const user = await tokenCheck(req);
  if (!user) {
    return respond(res, 403, { message: "no token provided or invalid token" });
  }

  if (!data[user].is_admin) {
    return respond(res, 403, { message: "you are not an admin" });
  }

  return respond(res, 200, Object.values(data));
}

// Utility Functions
function testUserStructure(user: string): boolean {
  return true; // Add regex validation if needed
}

function testPassStructure(pass: string): boolean {
  return /^[a-zA-Z0-9&@#!?]{4,12}$/.test(pass);
}

function testNameStructure(name: string): boolean {
  return /^[\w\s.]{5,30}$/.test(name);
}

async function createToken(user: string, res: ServerResponse) {
  const expirationTime = Math.floor(Date.now() / 1000) + 5 * 60; // 5 minutes

  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expirationTime)
    .sign(jwtKey);

  return respond(res, 200, {
    message: "Token is a header JWT",
    token,
  });
}

async function tokenCheck(req: IncomingMessage): Promise<string> {
  const token = req.headers["x-access-token"] as string;
  return tokenParse(token);
}

async function tokenParse(token: string): Promise<string> {
  try {
    const { payload } = await jwtVerify(token, jwtKey);
    return (payload as Claims).user;
  } catch {
    return "";
  }
}

function respond(res: ServerResponse, statusCode: number, payload: object) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}
