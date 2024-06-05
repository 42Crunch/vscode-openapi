import styled from "styled-components";
import { HttpRequest } from "@xliic/common/http";
import JsonData from "../../../../new-components/JsonData";

export default function Body({ request }: { request: HttpRequest }) {
  return <Container>{formatBody(request)}</Container>;
}

function isJsonRequest(request: HttpRequest): boolean {
  for (const [name, value] of Object.entries(request.headers)) {
    if (name.toLowerCase() === "content-type" && value.includes("json")) {
      return true;
    }
  }
  return false;
}

function formatBody(request: HttpRequest): string | JSX.Element {
  if (request.body === undefined || request.body === "") {
    return "";
  }

  if (isJsonRequest(request)) {
    try {
      return <JsonData value={JSON.parse(request.body as any)} />;
    } catch (e) {
      return `${request.body}`;
    }
  } else {
    return `${request.body}`;
  }
}

const Container = styled.div`
  padding: 4px 8px;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  max-height: 400px;
  overflow-y: auto;
`;
