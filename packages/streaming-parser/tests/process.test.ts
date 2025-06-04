import { expect, test } from "vitest";
import fs from "fs";
import path from "path";
import simple from "./samples/simple.json";

import { makeParser } from "../src/index";

function chunks(filename: string, chunkSize: number = 500 * 1024): NodeJS.ReadableStream {
  const filePath = path.resolve(__dirname, `samples/${filename}`);
  const stream = fs.createReadStream(filePath, { highWaterMark: chunkSize, encoding: "utf8" });
  return stream;
}

type Index = {
  counter: number;
  values: Record<string, number>;
};

test("process", async () => {
  const pathsIndex: Index = {
    counter: 0,
    values: {},
  };

  const p = makeParser({
    "$.summary.shallow()": (value: any) => {},
    "$.index.*.value()": (value: any, [name]: [string]) => {
      //console.log(`Index value: ${name} ${value}`);
    },

    "$.paths.*.*.happyPath.deep()": (value, [path, method]: [string, string]) => {
      if (pathsIndex.values[path] === undefined) {
        pathsIndex.values[path] = pathsIndex.counter;
        pathsIndex.counter++;
      }
    },

    "$.paths.*.*.issues.*.deep()": (value, [path, method]: [string, string]) => {
      if (pathsIndex.values[path] === undefined) {
        pathsIndex.values[path] = pathsIndex.counter;
        pathsIndex.counter++;
      }
      console.log("issue", value);
    },
  });

  for await (const chunk of chunks("small.json")) {
    p.chunk(chunk as string);
  }

  console.log("pathsIndex", JSON.stringify(pathsIndex, null, 2));

  expect("foo").toEqual("foo");
});
