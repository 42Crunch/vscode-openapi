import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import {
  PlaybookEnvStack,
  PlaybookVariableAssignment,
  PlaybookVariableFailedAssignment,
  PlaybookVariableSuccessfullAssignment,
} from "../../../../core/playbook/playbook-env";
import { TriangleExclamation } from "../../../../icons";
import React from "react";
import { VariableAssignment } from "@xliic/scanconf/dist/playbook";

export default function VariableAssignments({ assignment }: { assignment: PlaybookEnvStack }) {
  return (
    <Container>
      <Header>
        <div>Name</div>
        <div>Value</div>
        <div></div>
      </Header>
      <Fields>
        {assignment.flatMap((env, index) => renderAssignments(env.assignments, index))}
      </Fields>
    </Container>
  );
}

function renderAssignments(assignments: PlaybookVariableAssignment[], key: number) {
  return assignments.map((assignment, index) => (
    <React.Fragment key={`${key}-${index}`}>
      {assignment.error !== undefined
        ? renderFailedAssignment(assignment)
        : renderSuccessfullAssignment(assignment)}
    </React.Fragment>
  ));
}

function renderSuccessfullAssignment(assignment: PlaybookVariableSuccessfullAssignment) {
  return (
    <React.Fragment>
      <div>{assignment.name}</div>
      <div>{`${assignment.value}`}</div>
      <div></div>
    </React.Fragment>
  );
}

function renderFailedAssignment(assignment: PlaybookVariableFailedAssignment) {
  return (
    <React.Fragment>
      <div>{assignment.name}</div>
      <div>
        {formatAssignmentLocation(assignment.assignment)}: {assignment.error}
      </div>
      <Error>
        <TriangleExclamation />
      </Error>
    </React.Fragment>
  );
}

function formatAssignmentLocation(assignment: VariableAssignment): string {
  if (assignment.in == "body") {
    return `From "${assignment.from}" Location "${assignment.in}" Type "${assignment.path.type}" Path "${assignment.path.value}"`;
  } else {
    return `From "${assignment.from}" Location "${assignment.in}" Name "${assignment.name}"`;
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
  > svg {
    fill: var(${ThemeColorVariables.errorForeground});
    padding-right: 4px;
  }
`;
