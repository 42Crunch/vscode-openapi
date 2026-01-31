import type { IncomingMessage } from "http";
import type { Handler, Routes } from "../types";
import { respond } from "../server-util.ts";

type User = {
  pass: string;
};

type Post = {
  content: string;
  user: string;
};

const users: Record<string, User> = {
  user1: {
    pass: "password123",
  },
  user2: {
    pass: "password456",
  },
};

const defaultPass = "password123";
const adminKey = "secret";

const posts: (Post | null)[] = [];

const getPosts: Handler = async (req, res) => {
  const user = await getUserByBasicAuth(req);

  if (!user) {
    return respond(res, 403, { message: "not authenticated" });
  }

  return respond(res, 200, posts);
};

const createPost: Handler = async (req, res, params, body) => {
  const user = await getUserByBasicAuth(req);

  if (!user) {
    return respond(res, 403, { message: "not authenticated" });
  }

  const { content } = JSON.parse(body);

  posts.push({ content, user });

  return respond(res, 201, { id: posts.length - 1 });
};

const deletePost: Handler = async (req, res, params, body) => {
  const user = await getUserByBasicAuth(req);

  if (!user) {
    return respond(res, 403, { message: "not authenticated" });
  }

  const id = parseInt(params.id, 10);

  if (isNaN(id) || id < 0 || id >= posts.length) {
    return respond(res, 404, { message: "post not found" });
  }

  if (posts[id]?.user !== user) {
    return respond(res, 403, { message: "not authorized to delete this post" });
  }

  posts[id] = null;

  return respond(res, 200, { message: "post deleted" });
};

const getPost: Handler = async (req, res, params, body) => {
  const user = await getUserByBasicAuth(req);

  if (!user) {
    return respond(res, 403, { message: "not authenticated" });
  }

  const id = parseInt(params.id, 10);

  if (isNaN(id) || id < 0 || id >= posts.length || posts[id] === null) {
    return respond(res, 404, { message: "post not found" });
  }

  return respond(res, 200, posts[id]);
};

const createUser: Handler = async (req, res, params, body) => {
  if (!verifyAdminAuth(req)) {
    return respond(res, 403, { message: "not authenticated" });
  }

  const { username } = JSON.parse(body);

  if (!username) {
    return respond(res, 400, { message: "username is required" });
  }

  if (users[username]) {
    return respond(res, 409, { message: "user already exists" });
  }

  users[username] = { pass: defaultPass };

  return respond(res, 201, { username });
};

const getUsers: Handler = async (req, res) => {
  if (!verifyAdminAuth(req)) {
    return respond(res, 403, { message: "not authenticated" });
  }

  const userList = Object.keys(users).map((username) => ({ username }));

  return respond(res, 200, userList);
};

const deleteUser: Handler = async (req, res, params, body) => {
  if (!verifyAdminAuth(req)) {
    return respond(res, 403, { message: "not authenticated" });
  }

  const username = params.username;

  if (!users[username]) {
    return respond(res, 404, { message: "user not found" });
  }

  delete users[username];

  return respond(res, 200, { message: "user deleted" });
};

function getHttpBasicCredentials(req: IncomingMessage): string | undefined {
  const auth = req.headers.authorization;
  const prefix = "Basic ";

  if (auth && auth.startsWith(prefix)) {
    return Buffer.from(auth.slice(prefix.length), "base64").toString("utf-8");
  }
}

function verifyAdminAuth(req: IncomingMessage): boolean {
  const apiKey = req.headers["x-api-key"];
  return apiKey === adminKey;
}

async function getUserByBasicAuth(req: IncomingMessage): Promise<string | undefined> {
  const credentials = getHttpBasicCredentials(req);

  for (const [username, password] of Object.entries(users)) {
    if (credentials === `${username}:${password.pass}`) {
      return username;
    }
  }
}

export const routes: Routes = [
  [{ path: "/posts", method: "GET" }, getPosts],
  [{ path: "/post", method: "POST" }, createPost],
  [{ path: "/post/:id", method: "DELETE" }, deletePost],
  [{ path: "/post/:id", method: "GET" }, getPost],
  [{ path: "/users", method: "GET" }, getUsers],
  [{ path: "/user", method: "POST" }, createUser],
  [{ path: "/user/:username", method: "DELETE" }, deleteUser],
];
