import styled from "styled-components";
import { Buffer } from "buffer";

import { ExclamationCircle, Check, AngleDown, AngleUp } from "../../icons";
import { HttpError, HttpResponse } from "@xliic/common/http";

import { ThemeColorVariables } from "@xliic/common/theme";
import { HappyPathReport } from "@xliic/common/scan-report";
import Response from "../../components/response/Response";
import { parseResponse } from "../../http-parser";
import CurlRequest from "./CurlRequest";
import { useState } from "react";

export function HappyPath({
  issue,
  responses,
  errors,
  waitings,
}: {
  issue: HappyPathReport;
  responses: Record<string, HttpResponse>;
  errors: Record<string, HttpError>;
  waitings: Record<string, boolean>;
}) {
  const { request, response, outcome, happyPath } = issue;
  const failed = outcome?.status !== "expected" || !outcome?.conformant;

  let responsePayloadMatchesContract = "N/A";

  const responseCodeFound =
    happyPath === null || happyPath?.key !== "happy.path.success" ? "No" : "Yes";

  if (responseCodeFound === "Yes") {
    responsePayloadMatchesContract = outcome?.conformant ? "Yes" : "No";
  }

  const httpResponse = responses["happy-path"];
  const error = errors["happy-path"];
  const waiting = waitings["happy-path"];

  return (
    <Container>
      <Item>
        <div style={{ opacity: 1 }}>
          <b>Happy Path Testing results</b>
        </div>
      </Item>
      <Item>
        <div>Test Status</div>
        <div>{failed ? "Failed" : "Passed"}</div>
      </Item>
      <Item>
        <div>HTTP code received</div>
        <div>
          {response?.httpStatusCode} (Expected: {happyPath?.httpStatusExpected?.join(", ")})
        </div>
      </Item>

      <Item>
        <div>Response code found in API Contract</div>
        <div>{responseCodeFound}</div>
      </Item>

      <Item>
        <div>Response matches API Contract</div>
        <div>{responsePayloadMatchesContract}</div>
      </Item>

      {request?.curl && (
        <Item>
          <div>Request</div>
          <div>
            <CurlRequest curl={request?.curl} id={"happy-path"} waiting={waiting} />
          </div>
        </Item>
      )}

      {(response?.http || httpResponse) && (
        <Item>
          <div>Response</div>
          <div>
            <Response
              accented
              response={
                httpResponse ? httpResponse : parseResponse(Buffer.from(response!.http!, "base64"))
              }
            />
          </div>
        </Item>
      )}

      {(outcome?.error || error) && (
        <Item>
          <div>Error</div>
          <div>{error ? error.message : outcome?.error}</div>
        </Item>
      )}
    </Container>
  );
}

const Container = styled.div`
  margin: 8px;
  border: 1px solid var(${ThemeColorVariables.border});
`;

const Item = styled.div`
  display: flex;
  padding: 8px;
  gap: 8px;
  & > div:first-child {
    flex: 1;
    opacity: 0.8;
  }
  & > div:last-child {
    line-break: anywhere;
    flex: 3;
  }
`;
