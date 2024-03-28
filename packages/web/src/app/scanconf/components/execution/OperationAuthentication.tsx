import React from "react";
import styled, { keyframes } from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import { CircleCheck, ExclamationCircle, Key, Spinner } from "../../../../icons";
import CollapsibleCard, {
  BottomDescription,
  BottomItem,
} from "../../../../new-components/CollapsibleCard";
import { AuthenticationResult, ProgressState } from "../scenario/types";
import { AuthenticationVariables } from "./AutnenticationVariables";
import PlaybookExecution from "./PlaybookExecution";
import { ErrorBanner } from "../Banner";

export function OperationAuthentication({
  results,
}: {
  results: Record<string, AuthenticationResult>;
}) {
  const entries = processResults(results);

  return (
    <Container>
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
        <Steps>
          {entries.map((entry, index) => (
            <React.Fragment key={index}>
              {entry.execution[0] && <PlaybookExecution playbook={entry.execution[0]} />}
              {entry.value && (
                <AuthenticationVariables
                  name={entry.name}
                  value={entry.value}
                  variables={entry.variables}
                  hasMissing={entry.hasMissingVariables}
                />
              )}
              {entry.error && <ErrorBanner message={entry.error} />}
            </React.Fragment>
          ))}
        </Steps>
      </CollapsibleCard>
    </Container>
  );
}

const Container = styled.div`
  > div {
    background-color: var(${ThemeColorVariables.background});
  }
`;

const Steps = styled.div`
  padding: 8px;
  display: flex;
  flex-flow column;
  gap: 8px;
`;

function processResults(results: Record<string, AuthenticationResult>) {
  return Object.entries(results).map(([name, result]) => {
    const missing = result?.variables?.missing?.length;
    return {
      name,
      value: result.result,
      error: result.error,
      execution: result.execution,
      status: getAuthenticationStatus(result),
      hasMissingVariables: missing !== undefined && missing > 0,
      variables: result.variables,
    };
  });
}

function getAuthenticationStatus(entry: AuthenticationResult): ProgressState {
  if (entry.error !== undefined) {
    // mark as failed if error
    return "failure";
  }

  const pending = entry.execution?.some((e) => e.status === "pending");
  if (pending) {
    return "pending";
  }

  if (entry.result !== undefined) {
    return "success";
  }

  return "failure";
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
