import { LookupFailure } from "@xliic/common/env";
import styled from "styled-components";

export default function MissingVariables({ missing }: { missing: LookupFailure[] | undefined }) {
  return <Container>{Array.from(new Set(missing || [])).map(renderMissing)}</Container>;
}

function renderMissing(value: string, index: number) {
  return (
    <Row key={index}>
      <div>{value}</div>
    </Row>
  );
}

const Container = styled.div`
  margin-left: 4px;
  margin-right: 4px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  padding: 8px;
  > div {
    line-break: anywhere;
  }
`;

const Row = styled.div`
  display: contents;
`;
