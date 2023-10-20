import { ThemeColorVariables } from "@xliic/common/theme";
import styled, { keyframes } from "styled-components";
import { HttpResponse } from "../../../../../../common/src/http";
import Separator from "../../../../components/Separator";
import { MockHttpResponse } from "../../../../core/playbook/mock-http";
import { PlaybookEnvStack } from "../../../../core/playbook/playbook-env";
import {
  ArrowRightFromBracket,
  BracketsCurly,
  BracketsVariable,
  CircleCheck,
  CircleCheckLight,
  CircleExclamationLight,
  ExclamationCircle,
  Key,
  Spinner,
} from "../../../../icons";
import { TabContainer } from "../../../../new-components/Tabs";
import CollapsibleCard, { BottomDescription, BottomItem } from "../CollapsibleCard";
import HttpRequest from "../http-request/HttpRequest";
import Body from "../response/Body";
import Headers from "../response/Headers";
import VariableAssignments from "../scenario/VariableAssignments";
import { OperationResult, AuthenticationResult, VariableReplacement } from "../scenario/types";
import PlaybookExecution from "./PlaybookExecution";
import React from "react";

export default function OperationExecution({ operation }: { operation: OperationResult }) {
  const statusCode =
    operation.httpResponse === MockHttpResponse ? 200 : operation.httpResponse?.statusCode;

  const statusMessage =
    operation.httpResponse === MockHttpResponse ? "MOCK" : operation.httpResponse?.statusMessage;

  const icon = getStatusIcon(operation.status);

  return (
    <Container>
      {operation.ref && (
        <Separator icon={icon} title={`${operation.ref.type}/${operation.ref.id}`} />
      )}

      {Object.keys(operation.auth).length > 0 && <Authentication results={operation.auth} />}

      {operation.httpRequest !== undefined && (
        <HttpRequest operationId={operation.operationId} request={operation.httpRequest} />
      )}
      {operation.httpResponse !== undefined && (
        <CollapsibleCard>
          <BottomDescription style={{ gap: "8px" }}>
            <ArrowRightFromBracket style={{ transform: "rotate(180deg)" }} />
            <BottomItem>{`${statusCode} ${statusMessage}`}</BottomItem>
          </BottomDescription>
          <ResponseTabs result={operation} />
        </CollapsibleCard>
      )}
    </Container>
  );
}

export function Authentication({ results }: { results: Record<string, AuthenticationResult> }) {
  const entries = Object.entries(results).map(([name, result]) => {
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
            <Variables
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

export function ResponseTabs({ result }: { result: OperationResult }) {
  return (
    <TabContainer
      tabs={[
        {
          id: "body",
          title: "Body",
          content: <Body response={result.httpResponse as HttpResponse} />,
          disabled: result.httpResponse === MockHttpResponse || result.httpResponse === undefined,
        },
        {
          id: "headers",
          title: "Headers",
          content: <Headers headers={(result.httpResponse as HttpResponse)?.headers} />,
          disabled: result.httpResponse === MockHttpResponse || result.httpResponse === undefined,
        },
        {
          id: "variables-assigned",
          title: "Variables Assigned",
          content: <VariableAssignments assignment={result.variablesAssigned!} />,
          counter: assignmentCount(result?.variablesAssigned),
          disabled:
            result.variablesAssigned === undefined ||
            assignmentCount(result?.variablesAssigned) === 0,
        },
        // {
        //   id: "variables-used",
        //   title: "Variables",
        //   content: (
        //     <VariableUsed
        //       found={result.variablesReplaced?.found}
        //       missing={result.variablesReplaced?.missing}
        //     />
        //   ),
        //   disabled:
        //     result.variablesReplaced === undefined ||
        //     (result.variablesReplaced.found.length === 0 && result.variablesReplaced.missing.length === 0),
        // },
      ]}
    />
  );
}

export function Variables({
  name,
  value,
  variables,
  hasMissing,
}: {
  name: string;
  value?: string;
  hasMissing?: boolean;
  variables: VariableReplacement;
}) {
  return (
    <CollapsibleCard>
      <BottomDescription style={{ gap: "8px" }}>
        <BottomItem>
          <BracketsCurly style={{ width: 14, height: 14 }} />
          {name}
          {hasMissing && (
            <ExclamationCircle style={{ fill: `var(${ThemeColorVariables.errorForeground})` }} />
          )}
          {hasMissing && (
            <Missing>
              Missing {variables?.missing?.map((name) => `{{${name}}}`)?.join(", ")}
            </Missing>
          )}
        </BottomItem>
      </BottomDescription>
      <CredentialValue>{value}</CredentialValue>
    </CollapsibleCard>
  );
}

const Container = styled.div`
  svg {
    width: 14px;
    height: 14px;
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const CredentialValue = styled.div`
  font-family: monospace;
  padding: 8px 4px;
  line-break: anywhere;
`;

const Missing = styled.div`
  //border: 1px solid var(${ThemeColorVariables.errorBorder});
  color: var(${ThemeColorVariables.errorForeground});
  //background-color: var(${ThemeColorVariables.errorBackground});
  border-radius: 4px;
`;

function assignmentCount(env?: PlaybookEnvStack): number {
  if (env === undefined) {
    return 0;
  }

  let count = 0;
  for (const e of env) {
    count = count + e.assignments.length;
  }

  return count;
}

function getStatusIcon(status: string) {
  if (status === "success") {
    return <CircleCheckLight />;
  } else if (status === "failure") {
    return (
      <CircleExclamationLight style={{ fill: `var(${ThemeColorVariables.errorForeground})` }} />
    );
  } else {
    return <SpinningSpinner />;
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
