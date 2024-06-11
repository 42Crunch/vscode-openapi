import styled from "styled-components";

import { LookupResult, LookupFailure } from "@xliic/common/env";
import { ThemeColorVariables } from "@xliic/common/theme";

import { TriangleExclamation } from "../../../../icons";
import { PlaybookVariableDefinitionLocation } from "../../../../core/playbook/playbook-env";

export default function VariableUsed({
  found,
  missing,
}: {
  found: LookupResult[] | undefined;
  missing: LookupFailure[] | undefined;
}) {
  const uniqueFound =
    found !== undefined
      ? [...new Map(found.map((entry) => [entry.name, entry])).values()]
      : undefined;

  const uniqueMissing =
    missing !== undefined
      ? [...new Map(missing.map((entry) => [entry.name, entry])).values()]
      : undefined;

  return (
    <Container>
      <Header>
        <div></div>
        <div>Variable name</div>
        <div>Location where the variable is defined</div>
      </Header>
      {uniqueFound?.map(renderFound)}
      {uniqueMissing?.map(renderMissing)}
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
      <div>Variable is not found</div>
    </Row>
  );
}

function renderFound(value: LookupResult, index: number) {
  return (
    <Row key={index}>
      <div></div>
      <div>{value.name}</div>
      <div>{formatLocation(value.context as PlaybookVariableDefinitionLocation)}</div>
    </Row>
  );
}
function formatLocation(location: PlaybookVariableDefinitionLocation) {
  if (location.type === "global-environment") {
    return "Global Environment";
  } else if (location.type === "built-in") {
    return "Built-in";
  } else if (location.type === "try-inputs") {
    return "Try Inputs";
  } else if (location.type === "stage-environment") {
    return "Environment of this scenario step";
  } else if (location.type === "request-environment") {
    return "Environment of the Operation of this scenarion step";
  } else if (location.type === "playbook-request") {
    return `Operation in scenario step ${location.step + 1}`;
  } else if (location.type === "playbook-stage") {
    return `Scenario step ${location.step + 1}`;
  }
}

const Container = styled.div`
  display: grid;
  grid-template-columns: 2em 16em 1fr;
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
