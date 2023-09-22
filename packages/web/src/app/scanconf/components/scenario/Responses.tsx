import styled from "styled-components";

import { OperationResult, PlaybookResult } from "./types";
import Response from "./Response";
export default function Responses({ result }: { result: PlaybookResult }) {
  return <>{result.results.map(renderResult)}</>;
}

function renderResult(value: OperationResult, index: number, array: OperationResult[]) {
  const first = index === 0;
  const last = index === array.length - 1;
  return <Response first={first} last={last} key={`response-${index}`} result={value} />;
}

const Container = styled.div`
  display: flex;
  margin-left: 4px;
  margin-right: 4px;
  > div:last-child {
    flex: 1;
  }
`;
