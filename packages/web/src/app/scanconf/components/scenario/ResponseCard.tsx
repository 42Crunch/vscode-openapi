import * as Tabs from "@radix-ui/react-tabs";
import { HttpResponse } from "@xliic/common/http";
import { useState } from "react";
import styled from "styled-components";
import { MockHttpResponse } from "../../../../core/playbook/mock-http";
import CollapsibleCard, { BottomDescription, BottomItem } from "../CollapsibleCard";
import { TabButton, TabList } from "../Tabs";
import Body from "../response/Body";
import Headers from "../response/Headers";
import VariableAssignments from "./VariableAssignments";
import VariableUsed from "./VariableUsed";
import { OperationResult } from "./types";
import { ThemeColorVariables } from "@xliic/common/theme";
import { PlaybookEnvStack } from "../../../../core/playbook/playbook-env";

export default function ResponseCard({
  response,
  defaultCollapsed,
}: {
  response: OperationResult;
  defaultCollapsed?: boolean;
}) {
  const statusCode =
    response.httpResponse === MockHttpResponse ? 200 : response.httpResponse?.statusCode;

  const statusMessage =
    response.httpResponse === MockHttpResponse ? "MOCK" : response.httpResponse?.statusMessage;

  return (
    <Container>
      <CollapsibleCard defaultCollapsed={defaultCollapsed}>
        <BottomDescription>
          <BottomItem>Status: {`${statusCode} ${statusMessage}`}</BottomItem>
        </BottomDescription>
        <ResponseTabs result={response} />
      </CollapsibleCard>
    </Container>
  );
}

export function ResponseTabs({ result }: { result: OperationResult }) {
  const tabs = [
    {
      id: "body",
      title: "Body",
      content: <Body response={result.httpResponse as HttpResponse} />,
      enabled: result.httpResponse !== MockHttpResponse && result.httpResponse !== undefined,
    },
    {
      id: "headers",
      title: "Headers",
      content: <Headers headers={(result.httpResponse as HttpResponse)?.headers} />,
      enabled: result.httpResponse !== MockHttpResponse && result.httpResponse !== undefined,
    },
    {
      id: "variables-assigned",
      title: "Variables Assigned",
      content: <VariableAssignments assignment={result.variablesAssigned!} />,
      counter: assignmentCount(result?.variablesAssigned),
      enabled: result.variablesAssigned !== undefined && result.variablesAssigned.length > 0,
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
    //   enabled:
    //     result.variablesReplaced !== undefined &&
    //     (result.variablesReplaced.found.length > 0 || result.variablesReplaced.missing.length > 0),
    // },
  ];

  const activeId = tabs.filter((tab) => tab.enabled)?.[0]?.id;

  if (activeId === undefined) {
    return null;
  }

  const [activeTab, setActiveTab] = useState(activeId);

  return (
    <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
      <TabList>
        {tabs
          .filter((tab) => tab.enabled)
          .map((tab) => (
            <TabButton key={tab.id} value={tab.id}>
              {tab.title}
              {tab.counter && <Counter>{tab.counter}</Counter>}
            </TabButton>
          ))}
      </TabList>
      {tabs.map((tab) => (
        <Tabs.Content key={tab.id} value={tab.id} style={{ padding: 8 }}>
          {tab.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
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

const Container = styled.div`
  display: flex;
  margin-left: 4px;
  margin-right: 4px;
  > div:last-child {
    flex: 1;
  }
`;

const Counter = styled.span`
  background-color: var(${ThemeColorVariables.badgeBackground});
  color: var(${ThemeColorVariables.badgeForeground});
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  padding: 2px 4px;
`;
