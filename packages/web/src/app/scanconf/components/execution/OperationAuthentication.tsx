import { ThemeColorVariables } from "@xliic/common/theme";
import React from "react";
import styled, { keyframes } from "styled-components";
import { CircleCheck, ExclamationCircle, Key, Spinner } from "../../../../icons";
import CollapsibleCard, { BottomDescription, BottomItem } from "../CollapsibleCard";
import { AuthenticationResult, ProgressState } from "../scenario/types";
import PlaybookExecution from "./PlaybookExecution";
import { AuthenticationVariables } from "./AutnenticationVariables";
import ErrorMessage from "../operation/ErrorMessage";

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
            {getStatusIcon(entry)}
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
          {entry.error && <Error>{entry.error}</Error>}
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
      error: result.error,
      execution: result.execution,
      status: result.error !== undefined ? "failure" : result.execution?.[0]?.status || "pending",
      hasMissingVariables: missing !== undefined && missing > 0,
      variables: result.variables,
    };
  });
}

function getStatusIcon({
  status,
  hasMissingVariables,
}: {
  status: ProgressState;
  hasMissingVariables: boolean;
}) {
  if (status === "failure" || hasMissingVariables) {
    return <ExclamationCircle style={{ fill: `var(${ThemeColorVariables.errorForeground})` }} />;
  } else if (status === "pending") {
    return <SpinningSpinner />;
  } else {
    return <CircleCheck />;
  }
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

const Error = styled.div`
  color: var(${ThemeColorVariables.errorForeground});
  background-color: var(${ThemeColorVariables.errorBackground});
  padding: 4px 8px;
`;
