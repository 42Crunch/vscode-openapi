import styled from "styled-components";

import { HttpResponse } from "@xliic/common/http";
import { Playbook } from "@xliic/scanconf";

import JsonData from "../../../../new-components/JsonData";
import { useAppDispatch } from "../../store";
import { createVariable } from "../../slice";

export default function Body({
  response,
  requestRef,
  statusCode,
}: {
  response: HttpResponse;
  requestRef?: Playbook.RequestRef;
  statusCode?: number;
}) {
  return (
    <Container>
      {isJsonResponse(response) ? (
        <JsonBody body={response.body!} requestRef={requestRef} statusCode={statusCode} />
      ) : (
        <PlainBody>{response?.body}</PlainBody>
      )}
    </Container>
  );
}

function JsonBody({
  body,
  requestRef,
  statusCode,
}: {
  body: string;
  requestRef?: Playbook.RequestRef;
  statusCode?: number;
}) {
  const dispatch = useAppDispatch();

  try {
    return (
      <JsonData
        value={JSON.parse(body)}
        menuHandlers={{
          onCopy: (value: string) => {
            navigator.clipboard.writeText(value);
          },
          onCreateVariable: (name: string, jsonPointer: string) => {
            if (requestRef !== undefined && statusCode !== undefined) {
              dispatch(
                createVariable({
                  name,
                  location: "response",
                  jsonPointer,
                  ref: requestRef,
                  statusCode,
                })
              );
            }
          },
        }}
      />
    );
  } catch (e) {
    <PlainBody>{body}</PlainBody>;
  }
}

const Container = styled.div`
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  padding: 8px;
  max-height: 400px;
  overflow-y: auto;
`;

const PlainBody = styled.div``;

function isJsonResponse(response: HttpResponse): boolean {
  for (const [name, value] of response.headers) {
    if (name.toLowerCase() === "content-type" && value.includes("json")) {
      return true;
    }
  }
  return false;
}
