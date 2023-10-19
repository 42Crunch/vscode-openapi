import { ThemeColorVariables } from "@xliic/common/theme";
import styled, { keyframes } from "styled-components";
import { HttpResponse } from "../../../../../../common/src/http";
import Separator from "../../../../components/Separator";
import { MockHttpResponse } from "../../../../core/playbook/mock-http";
import { PlaybookEnvStack } from "../../../../core/playbook/playbook-env";
import {
  ArrowRightFromBracket,
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
import { OperationResult } from "../scenario/types";
import Execution from "./Execution";

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
      {operation.auth.length > 0 && (
        <CollapsibleCard>
          <BottomDescription style={{ gap: "8px" }}>
            {operation.auth.map((playbook, index) => (
              <BottomItem key={index}>
                {playbook.status === "success" && <Key style={{ width: 14, height: 14 }} />}
                {playbook.status === "failure" && (
                  <ExclamationCircle style={{ width: 14, height: 14 }} />
                )}
                {playbook.playbook}
              </BottomItem>
            ))}
          </BottomDescription>
          <Execution result={operation.auth} />
        </CollapsibleCard>
      )}
      {operation.httpRequest !== undefined && (
        <HttpRequest operationId={operation.operationId} request={operation.httpRequest} />
      )}
      {operation.httpResponse !== undefined && (
        <CollapsibleCard>
          <BottomDescription style={{ gap: "8px" }}>
            <ArrowRightFromBracket
              style={{
                width: 14,
                height: 14,
                transform: "rotate(180deg)",
                fill: `var(${ThemeColorVariables.foreground})`,
              }}
            />
            <BottomItem>{`${statusCode} ${statusMessage}`}</BottomItem>
          </BottomDescription>
          <ResponseTabs result={operation} />
        </CollapsibleCard>
      )}
    </Container>
  );
}

const Container = styled.div``;

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
    return (
      <CircleCheckLight
        style={{ width: 12, height: 12, fill: `var(${ThemeColorVariables.foreground})` }}
      />
    );
  } else if (status === "failure") {
    return (
      <CircleExclamationLight
        style={{ width: 12, height: 12, fill: `var(${ThemeColorVariables.foreground})` }}
      />
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
  width: 12px;
  height: 12px;
  fill: var(${ThemeColorVariables.buttonForeground});
  animation: ${rotation} 2s infinite linear;
  transition: width 0.2s linear;
`;
