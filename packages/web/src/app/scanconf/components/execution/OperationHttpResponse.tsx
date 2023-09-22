import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import { HttpResponse } from "../../../../../../common/src/http";
import { PlaybookEnvStack } from "../../../../core/playbook/playbook-env";
import { ArrowRightFromBracket } from "../../../../icons";
import { TabContainer } from "../../../../new-components/Tabs";
import CollapsibleCard, { BottomDescription, BottomItem } from "../CollapsibleCard";
import Body from "../response/Body";
import Headers from "../response/Headers";
import VariableAssignments from "../scenario/VariableAssignments";

export default function OperationHttpResponse({
  response,
  variables,
}: {
  response: HttpResponse;
  variables?: PlaybookEnvStack;
}) {
  return (
    <Container>
      <CollapsibleCard>
        <BottomDescription style={{ gap: "8px" }}>
          <ArrowRightFromBracket style={{ transform: "rotate(180deg)" }} />
          <BottomItem>{`${response?.statusCode} ${response?.statusMessage}`}</BottomItem>
        </BottomDescription>
        <TabContainer
          tabs={[
            {
              id: "body",
              title: "Body",
              content: <Body response={response} />,
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
    return env.map((e) => e.assignments.length).reduce((acc, value) => (acc = value), 0);
  }

  return 0;
}
