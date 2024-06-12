import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import Response from "../../components/response/Response";
import { safeParseResponse } from "../../http-parser";
import CurlRequest from "./CurlRequest";
import { RuntimeOperationReport } from "@xliic/common/scan-report";

export function HappyPath({ operation }: { operation: RuntimeOperationReport }) {
  const scenario = operation.scenarios?.[0];

  if (scenario === undefined) {
    const reason = operation.reason || "unknown";
    return <Failed>Happy path failed, reason: {reason}</Failed>;
  }

  const { request, response, outcome, happyPath } = scenario;

  let responsePayloadMatchesContract = "N/A";

  const responseCodeFound = outcome?.status === "correct" ? "Yes" : "No";

  if (responseCodeFound === "Yes") {
    responsePayloadMatchesContract = outcome?.conformant ? "Yes" : "No";
  }

  const excessiveDataExposure = outcome?.excessiveDataExposure;

  return (
    <Container>
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

      <Item>
        <div>Excessive data exposure found</div>
        <div>{excessiveDataExposure ? "Yes" : "No"}</div>
      </Item>

      {request?.curl && (
        <Item>
          <div>Request</div>
          <div>
            <CurlRequest curl={request?.curl} id={"happy-path"} waiting={false} />
          </div>
        </Item>
      )}

      {response?.rawPayload && (
        <Item>
          <div>Response</div>
          <div>
            <Response accented response={safeParseResponse(response!.rawPayload)} />
          </div>
        </Item>
      )}

      {outcome?.error && (
        <Item>
          <div>Error</div>
          <div>{outcome?.error}</div>
        </Item>
      )}
    </Container>
  );
}

const Container = styled.div`
  margin: 8px;
  border: 1px solid var(${ThemeColorVariables.border});
`;

const Failed = styled.div`
  margin: 16px;
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
