import styled from "styled-components";
import {
  PlaybookEnv,
  PlaybookEnvStack,
  PlaybookVariableAssignment,
} from "../../../../core/playbook/playbook-env";
import { TriangleExclamation } from "../../../../icons";

export default function VariableAssignments({ assignment }: { assignment: PlaybookEnvStack }) {
  return <Container>{assignment.map(renderEnv)}</Container>;
}

function renderEnv(env: PlaybookEnv) {
  if (env.assignments.length === 0) {
    return null;
  }

  return (
    <div key={env.id} style={{ display: "contents" }}>
      <div style={{ gridColumn: "span 3" }}>{env.id}</div>
      {renderAssignment(env.assignments)}
    </div>
  );
}

function renderAssignment(assignments: PlaybookVariableAssignment[]) {
  return assignments.map((assignment, index) => (
    <div key={index} style={{ display: "contents" }}>
      <div>{assignment.error && <TriangleExclamation />}</div>
      <div>{assignment.name}</div>
      <div
        style={{
          lineBreak: "anywhere",
        }}
      >{`${assignment.error === undefined ? assignment.error : assignment.value}`}</div>
    </div>
  ));
}

const Container = styled.div`
  margin-left: 4px;
  margin-right: 4px;
  display: grid;
  grid-template-columns: 1em 10em 1fr;
  gap: 8px;
  padding: 8px;
`;
