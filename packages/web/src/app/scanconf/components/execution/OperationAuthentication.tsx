import { ThemeColorVariables } from "@xliic/common/theme";
import React from "react";
import styled, { keyframes } from "styled-components";
import { CircleCheck, ExclamationCircle, Key, Spinner } from "../../../../icons";
import CollapsibleCard, { BottomDescription, BottomItem } from "../CollapsibleCard";
import { AuthenticationResult } from "../scenario/types";
import PlaybookExecution from "./PlaybookExecution";
import { AuthenticationVariables } from "./AutnenticationVariables";

export function OperationAuthentication({
  results,
}: {
  results: Record<string, AuthenticationResult>;
}) {
  const entries = processResults(results);

  return (
    <CollapsibleCard>
      <BottomDescription style={{ gap: "8px" }}>
        <BottomItem>
          <Key />
        </BottomItem>
        {entries.map((entry, index) => (
          <BottomItem key={index}>
            {entry.name}
            {entry.status === "failure" || entry.hasMissingVariables ? (
              <ExclamationCircle style={{ fill: `var(${ThemeColorVariables.errorForeground})` }} />
            ) : (
              <CircleCheck />
            )}
            {entry.status === "pending" && <SpinningSpinner />}
          </BottomItem>
        ))}
      </BottomDescription>
      {entries.map((entry, index) => (
        <React.Fragment key={index}>
          {entry.execution[0] && <PlaybookExecution playbook={entry.execution[0]} />}
          {entry.variables && (
            <AuthenticationVariables
              name={entry.name}
              value={entry.value}
              variables={entry.variables}
              hasMissing={entry.hasMissingVariables}
            />
          )}
        </React.Fragment>
      ))}
    </CollapsibleCard>
  );
}

function processResults(results: Record<string, AuthenticationResult>) {
  return Object.entries(results).map(([name, result]) => {
    const missing = result?.variables?.missing?.length;
    return {
      name,
      value: result.result,
      execution: result.execution,
      status: result.execution?.[0]?.status || "pending",
      hasMissingVariables: missing !== undefined && missing > 0,
      variables: result.variables,
    };
  });
}

const rotation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
`;

const SpinningSpinner = styled(Spinner)`
  animation: ${rotation} 2s infinite linear;
  transition: width 0.2s linear;
`;
