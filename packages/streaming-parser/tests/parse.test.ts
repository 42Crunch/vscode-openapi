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

test("parse deep()", async () => {
  const parser = makeParser({
    "$.deep()": (value: any, []: []) => {
      expect(value).toEqual(simple);
    },
  });

  for await (const chunk of chunks("simple.json")) {
    parser.chunk(chunk as string);
  }
});

test("parse shallow()", async () => {
  const parser = makeParser({
    "$.firfir.shallow()": (value: any) => {
      expect(value).toEqual({ foo: "bar", baz: 123 });
    },
    "$.firfir.qux.shallow()": (value: any) => {
      expect(value).toEqual({ nested: true });
    },

    "$.firfir.ram.*.roo.shallow()": (value: any, matches: any[]) => {
      expect(value).toEqual([1, 2, 3]);
      expect(matches).toEqual([-1]);
    },
  });

  for await (const chunk of chunks("simple.json")) {
    parser.chunk(chunk as string);
  }
});

test("parse matches", async () => {
  const parser = makeParser({
    "$.firfir.*.array.shallow()": (value: any, [name]: [string]) => {
      expect(value).toEqual([1, 2, 3]);
      expect(["qux", "rux"]).toContain(name);
    },

    "$.firfir.value()": (value: any) => {
      expect(["bar", 123]).toContain(value);
    },

    "$.firfir.*.value()": (value: any, [name]: [string]) => {
      expect(["qux", "rux"]).toContain(name);
      expect(value).toEqual(true);
    },
  });

  for await (const chunk of chunks("simple.json")) {
    parser.chunk(chunk as string);
  }
});

test("small report", async () => {
  let issuesCount = 0;

  const p = makeParser({
    "$.summary.shallow()": (value: any) => {
      expect(value).toEqual({
        startDate: "2025-03-20T15:30:26.245640312Z",
        endDate: "2025-03-20T15:30:35.514909005Z",
        openapiId: "82aa154c-1de1-4d6f-be2b-8023ced9337b",
        state: "finished",
        exitCode: 0,
        processingError: "",
        estimatedTotalRequest: 161,
        totalRequest: 92,
        criticality: 3,
        issues: 3,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 1,
        lowIssues: 2,
        infoIssues: 0,
      });
    },

    "$.paths.*.*.happyPath.deep()": (value, [path, method]: [string, string]) => {
      expect(["/api/login-post", "/api/register-post"]).toContain(`${path}-${method}`);
      expect([406, 200]).toContain(value.responseHttpStatusCode);
    },

    "$.paths.*.*.issues.*.deep()": (value, [path, method]: [string, string]) => {
      issuesCount++;
    },
  });

  for await (const chunk of chunks("small.json")) {
    p.chunk(chunk as string);
  }

  expect(issuesCount).toEqual(90);
});

test("parse 25mb", async () => {
  let issuesCount = 0;
  let happyPathCount = 0;
  let summaryCount = 0;

  const p = makeParser({
    "$.summary.shallow()": (value: any) => {
      summaryCount++;
    },

    "$.paths.*.*.happyPath.deep()": (value, [path, method]: [string, string]) => {
      happyPathCount++;
    },

    "$.paths.*.*.issues.*.deep()": (value, [path, method]: [string, string]) => {
      issuesCount++;
    },
  });
  for await (const chunk of chunks("report-25mb.json")) {
    p.chunk(chunk as string);
  }

  expect(issuesCount).toEqual(7000);
  expect(happyPathCount).toEqual(1000);
  expect(summaryCount).toEqual(1);
});

test("parse 50mb", async () => {
  let issuesCount = 0;
  let happyPathCount = 0;
  let summaryCount = 0;

  const p = makeParser({
    "$.summary.shallow()": (value: any) => {
      summaryCount++;
      console.log("Summary:", value);
    },

    "$.paths.*.*.happyPath.deep()": (value, [path, method]: [string, string]) => {
      happyPathCount++;
    },

    "$.paths.*.*.issues.*.deep()": (value, [path, method]: [string, string]) => {
      issuesCount++;
    },
  });
  for await (const chunk of chunks("report-50mb.json")) {
    p.chunk(chunk as string);
  }

  expect(issuesCount).toEqual(1);
  expect(happyPathCount).toEqual(5000);
  expect(summaryCount).toEqual(1);
});
