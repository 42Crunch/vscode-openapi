import type { IncomingMessage } from "http";
import type { Handler, Routes } from "../types";
import { respond } from "../server-util.ts";

type TokenInfo = {
  user: string;
  scopes: string[];
};

type Post = {
  content: string;
  user: string;
};

const tokens: Record<string, TokenInfo> = {
  "user-token": {
    user: "user1",
    scopes: ["posts:read", "posts:write"],
  },
  "admin-token": {
    user: "admin",
    scopes: ["posts:read", "posts:write", "admin"],
  },
};

const usernames = new Set(["user1", "user2"]);

const posts: (Post | null)[] = [];

function getBearerToken(req: IncomingMessage): TokenInfo | undefined {
  const auth = req.headers["authorization"];
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    const key = auth.slice(7);
    return tokens[key];
  }
}

function requireScopes(req: IncomingMessage, ...requiredScopes: string[]): TokenInfo | undefined {
  const tokenInfo = getBearerToken(req);
  if (!tokenInfo) {
    return undefined;
  }
  for (const scope of requiredScopes) {
    if (!tokenInfo.scopes.includes(scope)) {
      return undefined;
    }
  }
  return tokenInfo;
}

const getPosts: Handler = async (req, res) => {
  const tokenInfo = requireScopes(req, "posts:read");

  if (!tokenInfo) {
    return respond(res, 403, { message: "not authenticated" });
  }

  return respond(res, 200, posts);
};

const createPost: Handler = async (req, res, params, body) => {
  const tokenInfo = requireScopes(req, "posts:write");

  if (!tokenInfo) {
    return respond(res, 403, { message: "not authenticated" });
  }

  const { content } = JSON.parse(body);

  posts.push({ content, user: tokenInfo.user });

  return respond(res, 201, { id: posts.length - 1 });
};

const deletePost: Handler = async (req, res, params, body) => {
  const tokenInfo = requireScopes(req, "posts:write");

  if (!tokenInfo) {
    return respond(res, 403, { message: "not authenticated" });
  }

  const id = parseInt(params.id, 10);

  if (isNaN(id) || id < 0 || id >= posts.length) {
    return respond(res, 404, { message: "post not found" });
  }

  if (posts[id]?.user !== tokenInfo.user) {
    return respond(res, 403, { message: "not authorized to delete this post" });
  }

  posts[id] = null;

  return respond(res, 200, { message: "post deleted" });
};

const getPost: Handler = async (req, res, params, body) => {
  const tokenInfo = requireScopes(req, "posts:read");

  if (!tokenInfo) {
    return respond(res, 403, { message: "not authenticated" });
  }

  const id = parseInt(params.id, 10);

  if (isNaN(id) || id < 0 || id >= posts.length || posts[id] === null) {
    return respond(res, 404, { message: "post not found" });
  }

  return respond(res, 200, posts[id]);
};

const createUser: Handler = async (req, res, params, body) => {
  const tokenInfo = requireScopes(req, "admin");

  if (!tokenInfo) {
    return respond(res, 403, { message: "not authenticated" });
  }

  const { username } = JSON.parse(body);

  if (!username) {
    return respond(res, 400, { message: "username is required" });
  }

  if (usernames.has(username)) {
    return respond(res, 409, { message: "user already exists" });
  }

  usernames.add(username);

  return respond(res, 201, { username });
};

const getUsers: Handler = async (req, res) => {
  const tokenInfo = requireScopes(req, "admin");

  if (!tokenInfo) {
    return respond(res, 403, { message: "not authenticated" });
  }

  const userList = [...usernames].map((username) => ({ username }));

  return respond(res, 200, userList);
};

const getUsersVulnerable: Handler = async (req, res) => {
  // vulnerable: should require "admin" scope but only checks for a valid key
  const tokenInfo = getBearerToken(req);

  if (!tokenInfo) {
    return respond(res, 403, { message: "not authenticated" });
  }

  const userList = [...usernames].map((username) => ({ username }));

  return respond(res, 200, userList);
};

const deleteUser: Handler = async (req, res, params, body) => {
  const tokenInfo = requireScopes(req, "admin");

  if (!tokenInfo) {
    return respond(res, 403, { message: "not authenticated" });
  }

  const username = params.username;

  if (!usernames.has(username)) {
    return respond(res, 404, { message: "user not found" });
  }

  usernames.delete(username);

  return respond(res, 200, { message: "user deleted" });
};

export const routes: Routes = [
  [{ path: "/posts", method: "GET" }, getPosts],
  [{ path: "/post", method: "POST" }, createPost],
  [{ path: "/post/:id", method: "DELETE" }, deletePost],
  [{ path: "/post/:id", method: "GET" }, getPost],
  [{ path: "/users", method: "GET" }, getUsers],
  [{ path: "/users-vulnerable", method: "GET" }, getUsersVulnerable],
  [{ path: "/user", method: "POST" }, createUser],
  [{ path: "/user/:username", method: "DELETE" }, deleteUser],
];
