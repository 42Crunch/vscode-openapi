import { Buffer } from "buffer";
import { HTTPParser } from "./http-parser";
import { HttpResponse } from "@xliic/common/http";

export function parseRequest(input: Buffer) {
  const parser = new HTTPParser(HTTPParser.REQUEST);
  let complete = false;
  let shouldKeepAlive;
  let upgrade;
  let method;
  let url;
  let versionMajor;
  let versionMinor;
  let headers: any = [];
  let trailers: any = [];
  let bodyChunks: Buffer[] = [];

  parser[HTTPParser.kOnHeadersComplete] = function (req) {
    shouldKeepAlive = req.shouldKeepAlive;
    upgrade = req.upgrade;
    method = HTTPParser.methods[req.method];
    url = req.url;
    versionMajor = req.versionMajor;
    versionMinor = req.versionMinor;
    headers = req.headers;
  };

  parser[HTTPParser.kOnBody] = function (chunk, offset, length) {
    bodyChunks.push(chunk.slice(offset, offset + length));
  };

  // This is actually the event for trailers, go figure.
  parser[HTTPParser.kOnHeaders] = function (t) {
    trailers = t;
  };

  parser[HTTPParser.kOnMessageComplete] = function () {
    complete = true;
  };

  // Since we are sending the entire Buffer at once here all callbacks above happen synchronously.
  // The parser does not do _anything_ asynchronous.
  // However, you can of course call execute() multiple times with multiple chunks, e.g. from a stream.
  // But then you have to refactor the entire logic to be async (e.g. resolve a Promise in kOnMessageComplete and add timeout logic).
  parser.execute(input);
  parser.finish();

  if (!complete) {
    throw new Error("Could not parse request");
  }

  let body = Buffer.concat(bodyChunks);

  return {
    shouldKeepAlive,
    upgrade,
    method,
    url,
    versionMajor,
    versionMinor,
    headers,
    body,
    trailers,
  };
}

export function safeParseResponse(response: string | undefined): HttpResponse {
  if (response === undefined) {
    return {
      httpVersion: "1.0",
      headers: [],
      statusCode: 0,
    };
  }

  try {
    return parseResponse(Buffer.from(response, "base64"));
  } catch (ex) {
    return {
      httpVersion: "1.0",
      headers: [],
      statusCode: 0,
    };
  }
}

export function parseResponse(input: Buffer): HttpResponse {
  const parser = new HTTPParser(HTTPParser.RESPONSE);
  let complete = false;
  let shouldKeepAlive;
  let upgrade;
  let statusCode: number = 0;
  let statusMessage;
  let versionMajor;
  let versionMinor;
  let headers: any = [];
  let trailers: any = [];
  let bodyChunks: Buffer[] = [];

  parser[HTTPParser.kOnHeadersComplete] = function (res) {
    shouldKeepAlive = res.shouldKeepAlive;
    upgrade = res.upgrade;
    statusCode = res.statusCode;
    statusMessage = res.statusMessage;
    versionMajor = res.versionMajor;
    versionMinor = res.versionMinor;
    headers = res.headers;
  };

  parser[HTTPParser.kOnBody] = function (chunk, offset, length) {
    bodyChunks.push(chunk.slice(offset, offset + length));
  };

  // This is actually the event for trailers, go figure.
  parser[HTTPParser.kOnHeaders] = function (t) {
    trailers = t;
  };

  parser[HTTPParser.kOnMessageComplete] = function () {
    complete = true;
  };

  // Since we are sending the entire Buffer at once here all callbacks above happen synchronously.
  // The parser does not do _anything_ asynchronous.
  // However, you can of course call execute() multiple times with multiple chunks, e.g. from a stream.
  // But then you have to refactor the entire logic to be async (e.g. resolve a Promise in kOnMessageComplete and add timeout logic).
  parser.execute(input);
  parser.finish();

  if (!complete) {
    throw new Error("Could not parse");
  }

  let body = bodyChunks.join("");

  //   return {
  //     shouldKeepAlive,
  //     upgrade,
  //     statusCode,
  //     statusMessage,
  //     versionMajor,
  //     versionMinor,
  //     headers,
  //     body,
  //     trailers,
  //   };

  const _headers: [string, string][] = [];
  for (let i = 0; i < headers.length - 1; i++) {
    if (i % 2 === 0) {
      _headers.push([headers[i], headers[i + 1]]);
    }
  }

  return {
    headers: _headers,
    statusCode,
    httpVersion: `${versionMajor}.${versionMinor}`,
    body,
  };
}
