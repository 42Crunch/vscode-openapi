import styled from "styled-components";
import React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

import { ThemeColorVariables } from "@xliic/common/theme";
import { Playbook } from "@xliic/scanconf";

import {
  PlaybookEnvStack,
  PlaybookVariableAssignment,
  PlaybookVariableFailedAssignment,
  PlaybookVariableSuccessfullAssignment,
} from "../../../../core/playbook/playbook-env";
import { TriangleExclamation } from "../../../../icons";

export default function VariableAssignments({ assignment }: { assignment: PlaybookEnvStack }) {
  console.log("rendering VariableAssignments", assignment);
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

function renderAssignments(id: string, assignments: PlaybookVariableAssignment[], key: number) {
  return assignments.map((assignment, index) => (
    <React.Fragment key={`${key}-${index}`}>
      {assignment.error !== undefined
        ? renderFailedAssignment(id, assignment)
        : renderSuccessfullAssignment(id, assignment)}
    </React.Fragment>
  ));
}

function renderSuccessfullAssignment(
  id: string,
  assignment: PlaybookVariableSuccessfullAssignment
) {
  return (
    <React.Fragment>
      <VariableNameWithTooltip name={assignment.name} id={id} />
      <div>{`${assignment.value}`}</div>
      <div></div>
    </React.Fragment>
  );
}

function renderFailedAssignment(id: string, assignment: PlaybookVariableFailedAssignment) {
  return (
    <React.Fragment>
      <VariableNameWithTooltip name={assignment.name} id={id} />
      <div>
        {formatAssignmentLocation(assignment.assignment)}: {assignment.error}
      </div>
      <Error>
        <TriangleExclamation />
      </Error>
    </React.Fragment>
  );
}

function formatAssignmentLocation(assignment: Playbook.VariableAssignment): string {
  if (assignment.in == "body") {
    return `From "${assignment.from}" Location "${assignment.in}" Type "${assignment.path.type}" Path "${assignment.path.value}"`;
  } else {
    return `From "${assignment.from}" Location "${assignment.in}" Name "${assignment.name}"`;
  }
}

function VariableNameWithTooltip({ name, id }: { name: string; id: string }) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div>{name}</div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <TooltipContent>{id}</TooltipContent>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
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

const TooltipContent = styled(Tooltip.Content)`
  color: var(${ThemeColorVariables.notificationsForeground});
  background-color: var(${ThemeColorVariables.notificationsBackground});
  border: 1px solid var(${ThemeColorVariables.notificationsBorder});
  border-radius: 4px;
  padding: 4px 8px;
  margin-right: 16px;
`;
