import styled from "styled-components";

import { HttpRequest } from "@xliic/common/http";
import { replaceEnv } from "@xliic/common/messages/env";
import { useAppDispatch, useAppSelector } from "../store/hooks";

import { sendScanRequest, sendCurlRequest } from "../features/scan/slice";
import Button from "react-bootstrap/Button";

export default function CurlRequest({ curl }: { curl: string }) {
  const dispatch = useAppDispatch();
  const env = useAppSelector((state) => state.env.data);
  const defaults = useAppSelector((state) => state.scan.defaultValues);

  let secret = Object.values(defaults?.security?.[0] || {})?.[0];
  let secretCurl = curl;

  if (typeof secret === "string") {
    secretCurl = curl.replace("*********", replaceEnv(secret, env));
  }

  const request = extract(secretCurl);

  return (
    <Request>
      <Message>Reproduce with this curl command:</Message>
      <Code style={{ lineBreak: "anywhere", whiteSpace: "pre-line" }}>
        {curl.replace("host.docker.internal", "localhost")}
      </Code>
      <Buttons>
        <Button size="sm" onClick={() => dispatch(sendScanRequest(request))}>
          Resend
        </Button>
        <Button
          size="sm"
          onClick={() =>
            dispatch(sendCurlRequest(secretCurl.replace("host.docker.internal", "localhost")))
          }
        >
          Curl
        </Button>
      </Buttons>
    </Request>
  );
}

const Request = styled.div`
  padding: 10px;
`;

const Code = styled.div`
  font-family: monospace;
`;

const Message = styled.div`
  margin-bottom: 0.7em;
  font-weight: 600;
`;

const Buttons = styled.div`
  display: flex;
  justify-content: flex-end;
  > button {
    margin-left: 0.5em;
  }
`;

type ParsedValue = {
  type: "plain" | "single" | "double";
  value: string;
};

function extract(curl: string): HttpRequest {
  const parts = split(curl).slice(1);
  const result: HttpRequest = {
    url: parts.pop()!,
    headers: {},
    method: "get",
    config: {
      https: {
        rejectUnauthorized: false,
      },
    },
  };

  for (let i = 0; i < parts.length; i++) {
    const flag = parts[i];
    const value = parts[i + 1];
    if (flag === "-d") {
      result.body = value;
    } else if (flag == "-X") {
      result.method = value.toLowerCase() as HttpRequest["method"];
    } else if (flag === "-H") {
      const [headerName, headerValue] = value.split(": ", 2);
      result.headers[headerName] = headerValue;
    }
  }

  if (
    result.url.startsWith("http://host.docker.internal") ||
    result.url.startsWith("https://host.docker.internal")
  ) {
    result.url = result.url.replace("host.docker.internal", "localhost");
  }

  return result;
}

function split(string: string): string[] {
  return splitDetailed(string).map((details) => details.value);
}

function splitDetailed(string: string): ParsedValue[] {
  const groupsRegex = /[^\s"']+|(?:"|'){2,}|"(?!")([^"]*)"|'(?!')([^']*)'|"|'/g;

  const matches: ParsedValue[] = [];

  let match;

  while ((match = groupsRegex.exec(string))) {
    if (match[2]) {
      // Single quoted group
      matches.push({ type: "single", value: match[2] });
    } else if (match[1]) {
      // Double quoted group
      matches.push({ type: "double", value: match[1] });
    } else {
      // No quote group present
      matches.push({ type: "plain", value: match[0]! });
    }
  }

  return matches;
}
