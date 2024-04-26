import styled from "styled-components";

import { LookupResult, LookupFailure } from "@xliic/common/env";
import { ThemeColorVariables } from "@xliic/common/theme";

import { TriangleExclamation } from "../../../../icons";

export default function VariableUsed({
  found,
  missing,
}: {
  found: LookupResult[] | undefined;
  missing: LookupFailure[] | undefined;
}) {
  return (
    <Container>
      <Header>
        <div></div>
        <div>Name</div>
        <div>Defined in</div>
        <div>Used by</div>
      </Header>
      {found?.map(renderFound)}
      {missing?.map(renderMissing)}
    </Container>
  );
}

function renderMissing(value: LookupFailure, index: number) {
  return (
    <Row key={index}>
      <div>
        <TriangleExclamation
          style={{
            fill: `var(${ThemeColorVariables.errorForeground})`,
          }}
        />
      </div>
      <div>{value.name}</div>
      <div>not found</div>
      <div>{value.location.join("/")}</div>
    </Row>
  );
}

function renderFound(value: LookupResult, index: number) {
  return (
    <Row key={index}>
      <div></div>
      <div>{value.name}</div>
      <div>{value.context}</div>
      <div>{value.location.join("/")}</div>
    </Row>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-columns: 2em 16em 1fr 1fr;
  padding: 8px;
  > div > div {
    padding: 4px;
    line-break: anywhere;
  }
`;

const Header = styled.div`
  display: contents;
  > div {
    background-color: var(${ThemeColorVariables.computedOne});
    text-transform: uppercase;
    font-size: 90%;
    font-weight: 600;
  }
`;

const Row = styled.div`
  display: contents;
`;
