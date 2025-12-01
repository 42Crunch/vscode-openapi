import type { IncomingMessage } from "http";
import type { Handler, Routes } from "../types";
import { respond } from "../util.ts";

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
};

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

function getHttpBasicCredentials(req: IncomingMessage): string | undefined {
  const auth = req.headers.authorization;
  const prefix = "Basic ";

  if (auth && auth.startsWith(prefix)) {
    return Buffer.from(auth.slice(prefix.length), "base64").toString("utf-8");
  }
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
];
