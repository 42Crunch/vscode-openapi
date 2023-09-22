import styled from "styled-components";
import { HttpResponse } from "@xliic/common/http";
import JsonData from "../../../../new-components/JsonData";

export default function Body({ response }: { response: HttpResponse }) {
  const body = formatBody(response);

  return <Container>{body}</Container>;
}

const Container = styled.div`
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  padding: 8px;
`;

function isJsonResponse(response: HttpResponse): boolean {
  for (const [name, value] of response.headers) {
    if (name.toLowerCase() === "content-type" && value.includes("json")) {
      return true;
    }
  }
  return false;
}

function formatBody(response: HttpResponse): string | JSX.Element {
  if (response.body === undefined || response.body === "") {
    return "";
  }

  if (isJsonResponse(response)) {
    try {
      return <JsonData value={JSON.parse(response.body)} />;
    } catch (e) {
      return response.body;
    }
  } else {
    return response.body;
  }
}
