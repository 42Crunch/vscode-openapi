import styled from "styled-components";

import { TriangleExclamation, SquareCheck } from "@xliic/web-icons";
import { ThemeColorVariables } from "@xliic/common/theme";

import CurlRequest from "./CurlRequest";

export function HappyPath({ happyPath }: { happyPath: any }) {
  return (
    <Issue>
      <Title>
        <Message>Test type: Happy Path Test</Message>
        <Icon>
          {happyPath.expected && (
            <SquareCheck
              style={{
                fill: `var(${ThemeColorVariables.foreground})`,
              }}
            />
          )}
          {!happyPath.expected && (
            <TriangleExclamation
              style={{
                fill: `var(${ThemeColorVariables.foreground})`,
              }}
            />
          )}
        </Icon>
      </Title>
      <Response>
        HTTP Status {happyPath.code}: {happyPath.status}
      </Response>
      {happyPath.error && (
        <Response>
          <Subtitle>Error: </Subtitle>
          {happyPath.error}
        </Response>
      )}
      {happyPath.responseDescription && (
        <Response>
          <Subtitle>Response analysis: </Subtitle>
          {happyPath.responseDescription}
        </Response>
      )}
      {happyPath.curl && <CurlRequest curl={happyPath.curl} />}
    </Issue>
  );
}

export default HappyPath;

const Issue = styled.div`
  margin: 1em;
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

const Response = styled.div`
  padding: 10px;
`;

const Subtitle = styled.span`
  font-weight: 600;
`;

const Message = styled.div``;
const Icon = styled.div``;
