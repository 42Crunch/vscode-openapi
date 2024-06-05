import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { Playbook } from "@xliic/scanconf";

import { HttpResponse } from "../../../../../../common/src/http";
import { PlaybookEnvStack } from "../../../../core/playbook/playbook-env";
import { ArrowRightFromBracket, TriangleExclamation } from "../../../../icons";
import { TabContainer } from "../../../../new-components/Tabs";
import CollapsibleCard, {
  BottomDescription,
  BottomItem,
} from "../../../../new-components/CollapsibleCard";
import Body from "../response/Body";
import Headers from "../response/Headers";
import VariableAssignments from "../scenario/VariableAssignments";

export default function OperationHttpResponse({
  response,
  variables,
  requestRef,
}: {
  response: HttpResponse;
  variables?: PlaybookEnvStack;
  requestRef?: Playbook.RequestRef;
}) {
  const hasErrors = hasVariableAssignmentErrors(variables);

  return (
    <Container>
      <CollapsibleCard>
        <BottomDescription style={{ gap: "8px" }}>
          <ArrowRightFromBracket
            style={{
              width: 14,
              minWidth: 14,
              height: 14,
              minHeight: 14,
              fill: `var(${ThemeColorVariables.foreground})`,
              transform: "rotate(180deg)",
            }}
          />
          <BottomItem>
            {`${response?.statusCode} ${response?.statusMessage}`}
            {hasErrors && (
              <TriangleExclamation
                style={{ fill: `var(${ThemeColorVariables.errorForeground})` }}
              />
            )}
          </BottomItem>
        </BottomDescription>
        <TabContainer
          tabs={[
            {
              id: "body",
              title: "Body",
              content: (
                <Body
                  response={response}
                  requestRef={requestRef}
                  statusCode={response.statusCode}
                />
              ),
            },
            {
              id: "headers",
              title: "Headers",
              content: <Headers headers={response?.headers} />,
            },
            {
              id: "variables-assigned",
              title: "Variables",
              content: <VariableAssignments assignment={variables || []} />,
              counter: assignmentCount(variables),
              counterKind: hasErrors ? "error" : "normal",
              disabled: variables === undefined || assignmentCount(variables) === 0,
            },
          ]}
        />
      </CollapsibleCard>
    </Container>
  );
}

const Container = styled.div`
  > div {
    background-color: var(${ThemeColorVariables.background});
  }
`;

function assignmentCount(env?: PlaybookEnvStack): number {
  if (env !== undefined) {
    return env.map((e) => e.assignments.length).reduce((acc, value) => (acc = acc + value), 0);
  }
  return 0;
}

function hasVariableAssignmentErrors(assignments?: PlaybookEnvStack): boolean {
  return !!assignments
    ?.map((env) => env.assignments.some((a) => a.error !== undefined))
    .some((e) => e);
}
