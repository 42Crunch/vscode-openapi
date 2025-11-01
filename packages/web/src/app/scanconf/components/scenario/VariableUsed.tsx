import styled from "styled-components";

import { LookupResult, LookupFailure } from "@xliic/common/env";
import { ThemeColorVariables } from "@xliic/common/theme";

import { TriangleExclamation } from "../../../../icons";
import { PlaybookVariableDefinitionLocation } from "../../../../core/playbook/playbook-env";

export default function VariableUsed({
  found,
  missing,
  currentStep,
}: {
  found: LookupResult[] | undefined;
  missing: LookupFailure[] | undefined;
  currentStep: number;
}) {
  const uniqueFound =
    found !== undefined
      ? [...new Map(found.map((entry) => [entry.name, entry])).values()]
      : undefined;

  const uniqueMissing =
    missing !== undefined
      ? [...new Map(missing.map((entry) => [entry.name, entry])).values()]
      : undefined;

  uniqueFound?.sort((a, b) => a.name.localeCompare(b.name));
  uniqueMissing?.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Container>
      <Header>
        <div></div>
        <div>Variable name</div>
        <div>Location where the variable is defined</div>
      </Header>
      {uniqueFound?.map((value, index) => renderFound(value, index, currentStep))}
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

function renderFound(value: LookupResult, index: number, currentStep: number) {
  return (
    <Row key={index}>
      <div></div>
      <div>{value.name}</div>
      <div>{formatLocation(value.context as PlaybookVariableDefinitionLocation, currentStep)}</div>
    </Row>
  );
}

function formatLocation(location: PlaybookVariableDefinitionLocation, currentStep: number) {
  if (location.type === "global-environment") {
    return "Global Environment";
  } else if (location.type === "built-in") {
    return "Built-in";
  } else if (location.type === "try-inputs") {
    return "Try Inputs";
  } else if (location.type === "stage-environment") {
    return `Scenario / Step ${currentStep + 1} / Environment`;
  } else if (location.type === "request-environment") {
    return `Scenario / Step ${currentStep + 1} / Operation / Environment`;
  } else if (location.type === "playbook-request") {
    return `${formatScenarioName(location.name)} / Step ${
      location.step + 1
    } / Operation / Response processing`;
  } else if (location.type === "playbook-stage") {
    return `${formatScenarioName(location.name)} / Step ${location.step + 1} / Response processing`;
  }
}

function formatScenarioName(name: string) {
  if (name === "operationScenarios") {
    return "Scenario";
  } else if (name === "operationBefore") {
    return "Before block";
  } else if (name === "operationAfter") {
    return "After block";
  } else if (name === "before") {
    return "Global before block";
  } else if (name === "after") {
    return "Global after block";
  } else if (name === "credential") {
    return "Credential";
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
