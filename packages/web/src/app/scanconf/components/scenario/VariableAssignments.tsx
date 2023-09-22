import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import {
  PlaybookEnvStack,
  PlaybookVariableAssignment,
} from "../../../../core/playbook/playbook-env";
import { TriangleExclamation } from "../../../../icons";
import React from "react";

export default function VariableAssignments({ assignment }: { assignment: PlaybookEnvStack }) {
  return (
    <Container>
      <Header>
        <div>Name</div>
        <div>Value</div>
        <div></div>
      </Header>
      <Fields>
        {assignment.flatMap((env, index) => renderAssignment(env.assignments, index))}
      </Fields>
    </Container>
  );
}

function renderAssignment(assignments: PlaybookVariableAssignment[], key: number) {
  return assignments.map((assignment, index) => (
    <React.Fragment key={`${key}-${index}`}>
      <div>{assignment.name}</div>
      <div>{`${assignment.error !== undefined ? assignment.error : assignment.value}`}</div>
      <Error>{assignment.error && <TriangleExclamation />}</Error>
    </React.Fragment>
  ));
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
