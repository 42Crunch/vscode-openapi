import styled from "styled-components";
import { LookupResult, LookupFailure } from "@xliic/common/env";
import { TriangleExclamation } from "../../../../icons";

export default function VariableAssignments({
  found,
  missing,
}: {
  found: LookupResult[] | undefined;
  missing: LookupFailure[] | undefined;
}) {
  return (
    <Container>
      {missing?.map(renderMissing)}
      {found?.map(renderFound)}
    </Container>
  );
}

function renderMissing(value: LookupFailure, index: number) {
  return (
    <Row key={index}>
      <div>
        <TriangleExclamation />
      </div>
      <div>{value.name}</div>
      <div>missing</div>
    </Row>
  );
}

function renderFound(value: LookupResult, index: number) {
  return (
    <Row key={index}>
      <div></div>
      <div>{value.name}</div>
      <div>found</div>
    </Row>
  );
}

const Container = styled.div`
  margin-left: 4px;
  margin-right: 4px;
  display: grid;
  grid-template-columns: 1em 10em 1fr;
  gap: 8px;
  padding: 8px;
  > div {
    line-break: anywhere;
  }
`;

const Row = styled.div`
  display: contents;
`;
