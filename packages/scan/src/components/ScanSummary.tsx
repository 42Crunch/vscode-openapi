import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { TriangleExclamation, SquareCheck } from "@xliic/web-icons";

export default function ScanSummary({
  summary,
  happyPathExpected,
}: {
  summary: any;
  happyPathExpected: boolean;
}) {
  const happyPaths = summary?.happyPathRequests?.executed ?? 0;
  const conformanceTests = summary?.conformanceTestRequests?.executed ?? 0;
  const unexpected = summary?.conformanceTestRequests?.unexpectedResponses ?? 0;
  const expected = summary?.conformanceTestRequests?.expectedResponses ?? 0;
  const totalTests = conformanceTests + happyPaths;

  return (
    <Summary>
      <Tests>
        <Response>
          <Message>Scan Summary</Message>
          <span>Tests performed: {totalTests}</span>
        </Response>
        <Test>
          {happyPathExpected && (
            <SquareCheck
              style={{
                fill: `var(${ThemeColorVariables.foreground})`,
              }}
            />
          )}
          {!happyPathExpected && (
            <TriangleExclamation
              style={{
                fill: `var(${ThemeColorVariables.foreground})`,
              }}
            />
          )}
          <div>HappyPath: {happyPaths}</div>
        </Test>
        <Test>
          <SquareCheck
            style={{
              fill: `var(${ThemeColorVariables.foreground})`,
            }}
          />
          <div>Successfull: {expected}</div>
        </Test>
        <Test>
          <TriangleExclamation
            style={{
              fill: `var(${ThemeColorVariables.foreground})`,
            }}
          />
          <div>Failed: {unexpected}</div>
        </Test>
      </Tests>
    </Summary>
  );
}

const Summary = styled.div`
  margin: 1em;
  padding: 10px;
  border: 1px solid #c4c4c4;
  border-radius: 10px;
  margin-bottom: 10px;
`;

const Response = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Message = styled.div`
  font-weight: 600;
  font-size: 1.4em;
`;

const Tests = styled.div`
  display: flex;
`;
const Test = styled.div`
  display: flex;
  align-items: center;
  width: 7em;
  margin-left: 0.5em;
  margin-right: 0.5em;
  flex-direction: column;
  > svg {
    width: 3em;
    height: 3em;
  }
`;
