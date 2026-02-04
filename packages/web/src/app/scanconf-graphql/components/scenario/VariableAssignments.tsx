import styled from "styled-components";
import React from "react";

import { ThemeColorVariables } from "@xliic/common/theme";
import { Playbook } from "@xliic/scanconf";

import {
  PlaybookEnvStack,
  PlaybookVariableAssignment,
  PlaybookVariableFailedAssignment,
  PlaybookVariableDefinitionLocation,
  PlaybookVariableSuccessfullAssignment,
} from "../../../../core/playbook/playbook-env";
import { TriangleExclamation } from "../../../../icons";

export default function VariableAssignments({ assignment }: { assignment: PlaybookEnvStack }) {
  return (
    <Container>
      <Header>
        <div>Name</div>
        <div>Value</div>
        <div></div>
      </Header>
      <Fields>
        {assignment.flatMap((env, index) => renderAssignments(env.id, env.assignments, index))}
      </Fields>
    </Container>
  );
}

function renderAssignments(
  id: PlaybookVariableDefinitionLocation,
  assignments: PlaybookVariableAssignment[],
  key: number
) {
  return assignments.map((assignment, index) => (
    <React.Fragment key={`${key}-${index}`}>
      {assignment.error !== undefined
        ? renderFailedAssignment(id, assignment)
        : renderSuccessfullAssignment(id, assignment)}
    </React.Fragment>
  ));
}

function renderSuccessfullAssignment(
  id: PlaybookVariableDefinitionLocation,
  assignment: PlaybookVariableSuccessfullAssignment
) {
  return (
    <React.Fragment>
      <div>{assignment.name}</div>
      <div>{`${assignment.value}`}</div>
      <div></div>
    </React.Fragment>
  );
}

function renderFailedAssignment(
  id: PlaybookVariableDefinitionLocation,
  assignment: PlaybookVariableFailedAssignment
) {
  return (
    <React.Fragment>
      <div>{assignment.name}</div>
      <div>{formatAssignmentLocation(assignment.assignment, assignment.error)}</div>
      <Error>
        <TriangleExclamation />
      </Error>
    </React.Fragment>
  );
}

function formatAssignmentLocation(assignment: Playbook.VariableAssignment, error: string): string {
  if (assignment.in == "body") {
    const type = assignment.path.type === "jsonPath" ? "JsonPath" : "JsonPointer";
    return `${type} "${assignment.path.value}" is ${error} in the ${assignment.from} ${assignment.in}`;
  } else {
    return `Name "${assignment.name}" is ${error} in the ${assignment.from} ${assignment.in}`;
  }
}

const Container = styled.div`
  margin: 8px;
  display: grid;
  grid-template-columns: 10em 1fr 2em;
  row-gap: 4px;
`;

const Header = styled.div`
  display: contents;
  & > div {
    padding: 4px 8px;
    background-color: var(${ThemeColorVariables.computedOne});
    text-transform: uppercase;
    font-size: 90%;
    font-weight: 600;
  }
`;

const Fields = styled.div`
  display: contents;
  > div {
    padding-left: 8px;
    padding-right: 8px;
    line-break: anywhere;
  }
`;

const Error = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 !important;
  & > svg {
    fill: var(${ThemeColorVariables.errorForeground});
    padding-right: 4px;
  }
`;
