import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { TriangleExclamation } from "@xliic/web-icons";

import CurlRequest from "./CurlRequest";

function ScanIssues({ issues, error }: { issues: any; error: any }) {
  const sorted = issues
    ? [...issues].sort((a: any, b: any) => (a.status === "unexpected" ? -1 : 1))
    : [];

  return (
    <>
      {issues && sorted.map((issue: any, index: number) => <ScanIssue issue={issue} key={index} />)}
      {/**issues === undefined && <p>scan failed: {error}</p>**/}
    </>
  );
}

function ScanIssue({ issue }: { issue: any }) {
  return (
    <Issue>
      <Title>
        <Message>Test type: Conformance Scan Test</Message>
        <Icon>
          <TriangleExclamation
            style={{
              fill: `var(${ThemeColorVariables.foreground})`,
            }}
          />
        </Icon>
      </Title>

      <Response>
        <Subtitle>HTTP Status {issue.code}:</Subtitle> {issue.status}
      </Response>
      <Response>
        <Subtitle>Description:</Subtitle> {issue.description}
      </Response>
      {issue.responseDescription && (
        <Response>
          <Subtitle>Response analysis:</Subtitle> {issue.responseDescription}
        </Response>
      )}
      {issue.curl && <CurlRequest curl={issue.curl} />}

      {/* <Request>
        <Code style={{ lineBreak: "anywhere", whiteSpace: "pre-line" }}>{issue.request.curl}</Code>
      </Request>
      {issue.response.http && (
        <Response>
          <Code style={{ lineBreak: "anywhere", whiteSpace: "pre-line" }}>
            {atob(issue.response.http)}
          </Code>
        </Response>
      )} */}
    </Issue>
  );
}

export default ScanIssues;

const Issue = styled.div`
  margin: 1em;
  //padding: 10px;
  border: 1px solid #c4c4c4;
  border-radius: 10px;
  margin-bottom: 10px;
`;

const Title = styled.div`
  padding: 10px;
  font-size: 1.2em;
  font-weight: 600;
  border-bottom: 1px solid #c4c4c4;
  display: flex;
  > div:first-child {
    flex: 1;
  }
  svg {
    width: 1.5em;
    height: 1.5em;
  }
`;

const Subtitle = styled.span`
  font-weight: 600;
`;

const Request = styled.div`
  padding: 10px;
  border-bottom: 1px solid #c4c4c4;
`;

const Response = styled.div`
  padding: 10px;
`;

const Message = styled.div``;
const Icon = styled.div``;
