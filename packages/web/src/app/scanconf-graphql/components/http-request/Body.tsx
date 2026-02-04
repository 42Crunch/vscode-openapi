import styled from "styled-components";

import { HttpRequest } from "@xliic/common/http";
import { Playbook } from "@xliic/scanconf";

import JsonData from "../../../../new-components/JsonData";
import { useAppDispatch } from "../../store";
import { createVariable } from "../../slice";

export default function Body({
  request,
  requestRef,
  statusCode,
}: {
  request: HttpRequest;
  requestRef?: Playbook.RequestRef;
  statusCode?: number;
}) {
  return (
    <Container>
      {isJsonRequest(request) ? (
        <JsonBody body={request.body as string} requestRef={requestRef} statusCode={statusCode} />
      ) : (
        <PlainBody>{request?.body !== undefined && `${request.body}`}</PlainBody>
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
                  location: "request",
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

function isJsonRequest(request: HttpRequest): boolean {
  for (const [name, value] of Object.entries(request.headers)) {
    if (name.toLowerCase() === "content-type" && value.includes("json")) {
      return true;
    }
  }
  return false;
}

const PlainBody = styled.div``;

const Container = styled.div`
  padding: 4px 8px;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  max-height: 400px;
  overflow-y: auto;
`;
