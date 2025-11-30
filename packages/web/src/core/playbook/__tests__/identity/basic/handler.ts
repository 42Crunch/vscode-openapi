import type { IncomingMessage, ServerResponse } from "http";
import type { Routes } from "../types";
import { respond } from "../util.ts";

type UserInfo = {
  user: string;
  pass: string;
  name: string;
  is_admin: boolean;
  account_balance: number;
};

type AuthN = (req: IncomingMessage) => Promise<string | undefined>;

const data: Record<string, UserInfo> = {
  "user@example.com": {
    user: "user@example.com",
    pass: "password123",
    name: "John Doe",
    is_admin: false,
    account_balance: 1000,
  },
};

export const routes: Routes = [
  [{ path: "/info", method: "GET" }, infoBasic],
  [{ path: "/info-trim", method: "GET" }, infoBasicTrim],
];

async function infoBasic(req: IncomingMessage, res: ServerResponse) {
  return handleGetUserInfo(req, res, getUserByBasicAuth);
}

async function infoBasicTrim(req: IncomingMessage, res: ServerResponse) {
  return handleGetUserInfo(req, res, getUserByBasicAuthTrim);
}

async function handleGetUserInfo(req: IncomingMessage, res: ServerResponse, authn: AuthN) {
  const user = await authn(req);
  if (user) {
    return respond(res, 200, data[user]);
  } else {
    return respond(res, 403, { message: "not authenticated" });
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
