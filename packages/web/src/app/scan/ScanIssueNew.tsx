import styled from "styled-components";
import { Buffer } from "buffer";

import { HttpError, HttpResponse } from "@xliic/common/http";

import { ThemeColorVariables } from "@xliic/common/theme";
import { ExclamationCircle, Check, AngleDown, AngleUp } from "../../icons";

import CurlRequest from "./CurlRequest";
import Response from "../../components/response/Response";
import { showJsonPointer } from "./slice";

import { parseResponse } from "../../http-parser";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "./store";
import { RuntimeOperationReport, TestLogReport } from "./scan-report-new";

export default function ScanIssueNew({
  operation,
  issue,
  httpResponse,
  error,
  id,
  waiting,
}: {
  operation: RuntimeOperationReport;
  issue: TestLogReport;
  httpResponse: HttpResponse | undefined;
  error: HttpError | undefined;
  id: string;
  waiting: boolean;
}) {
  const dispatch = useAppDispatch();

  const [collapsed, setCollapsed] = useState(true);
  const { response, test, outcome } = issue;

  const responseCodeExpected = outcome?.status === "correct";
  const conformsToContract = outcome?.conformant;
  const failed = !(responseCodeExpected && conformsToContract);

  let contentTypeFound = "N/A";
  let responsePayloadMatchesContract = "N/A";

  const responseCodeFound =
    outcome?.apiResponseAnalysis?.[0]?.responseKey === "response-http-status-scan" ? "No" : "Yes";

  if (responseCodeFound === "Yes") {
    contentTypeFound =
      outcome?.apiResponseAnalysis?.[0]?.responseKey === "response-body-contenttype-scan"
        ? "No"
        : "Yes";
  }

  if (contentTypeFound === "Yes") {
    responsePayloadMatchesContract =
      outcome?.apiResponseAnalysis?.[0]?.responseKey === "response-body-badformat-scan"
        ? "No"
        : "Yes";
  }

  return (
    <Container>
      <Title collapsed={collapsed} onClick={() => setCollapsed(!collapsed)}>
        <div>{collapsed ? <AngleDown /> : <AngleUp />}</div>
        <div>
          <TopDescription>{issue.test?.description}</TopDescription>
          <BottomDescription>
            {failed ? (
              <BottomItem>
                <ExclamationCircle /> Failed
                {issue.outcome!.criticality > 0 && (
                  <>
                    /
                    <span style={{ fontWeight: criticalityWeights[outcome!.criticality!] }}>
                      {" "}
                      {criticalityNames[outcome!.criticality!]}
                    </span>
                  </>
                )}
              </BottomItem>
            ) : (
              <BottomItem>
                <Check /> Passed
              </BottomItem>
            )}

            {failed && (
              <>
                <BottomItem>
                  {responseCodeExpected ? (
                    <>
                      <Check /> Response code: Expected
                    </>
                  ) : (
                    <>
                      <ExclamationCircle /> Response code: Unexpected
                    </>
                  )}
                </BottomItem>
                <BottomItem>
                  {conformsToContract ? (
                    <>
                      <Check /> Conforms to Contract: Yes
                    </>
                  ) : (
                    <>
                      <ExclamationCircle /> Conforms to Contract: No
                    </>
                  )}
                </BottomItem>
              </>
            )}
          </BottomDescription>
        </div>
      </Title>

      {!collapsed && (
        <Content>
          <Item>
            <div>HTTP code received</div>
            <div>
              {issue.response?.httpStatusCode} (Expected:{" "}
              {issue.test?.httpStatusExpected?.join(", ")})
            </div>
          </Item>

          <Item>
            <div>Response code found in API Contract</div>
            <div>{responseCodeFound}</div>
          </Item>

          <Item>
            <div>Content-Type found in API Contract</div>
            <div>{contentTypeFound}</div>
          </Item>

          <Item>
            <div>Response matches API Contract</div>
            <div>{responsePayloadMatchesContract}</div>
          </Item>

          {outcome?.apiResponseAnalysis?.[0]?.responseDescription && (
            <Item>
              <div>Response analysis</div>
              <div> {outcome?.apiResponseAnalysis?.[0]?.responseDescription}</div>
            </Item>
          )}

          <Item>
            <div>JSON Pointer</div>
            <div>
              {issue.test?.jsonPointer ? (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dispatch(
                      showJsonPointer(issue.test?.jsonPointer + "") // FIXME support indexed reports
                    );
                  }}
                >
                  {issue.test?.jsonPointer}
                </a>
              ) : (
                "N/A"
              )}
            </div>
          </Item>

          {issue.request?.curl && (
            <Item>
              <div>Request</div>
              <div>
                <CurlRequest waiting={waiting} curl={issue.request.curl} id={id} />
              </div>
            </Item>
          )}
          {error === undefined &&
            (httpResponse !== undefined || issue.response?.rawPayload !== undefined) && (
              <Item>
                <div>Response</div>
                <div>
                  <Response
                    accented
                    response={
                      httpResponse
                        ? httpResponse
                        : parseResponse(Buffer.from(issue.response?.rawPayload!, "base64"))
                    }
                  />
                </div>
              </Item>
            )}
          {error && (
            <Item>
              <div>Error</div>
              <div>{error?.message}</div>
            </Item>
          )}
        </Content>
      )}
    </Container>
  );
}

const Container = styled.div`
  margin: 8px;
  border: 1px solid var(${ThemeColorVariables.border});
`;

const Title = styled.div`
  display: flex;
  cursor: pointer;
  padding: 10px 10px 10px 0px;
  background-color: var(${ThemeColorVariables.computedOne});
  & > div:first-child {
    padding-left: 4px;
    padding-right: 8px;
    > svg {
      fill: var(${ThemeColorVariables.foreground});
    }
  }
  border-left: 5px solid transparent;
  ${({ collapsed }: { collapsed: boolean }) =>
    !collapsed &&
    `border-bottom: 1px solid var(${ThemeColorVariables.border});
    border-left: 5px solid var(${ThemeColorVariables.badgeBackground});`}
`;

const TopDescription = styled.div`
  font-weight: 600;
`;

const BottomDescription = styled.div`
  margin-top: 8px;
  display: flex;
  font-size: 90%;
  align-items: center;
  gap: 16px;
`;

const BottomItem = styled.div`
  display: flex;
  align-items: center;
  opacity: 0.8;
  & > svg {
    margin-right: 4px;
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const Content = styled.div`
  background-color: var(${ThemeColorVariables.computedOne});
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

const criticalityNames: Record<number, string> = {
  0: "None",
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Critical",
};

const criticalityWeights: Record<number, number> = {
  0: 500,
  1: 500,
  2: 500,
  3: 700,
  4: 700,
};
