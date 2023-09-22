import * as Tabs from "@radix-ui/react-tabs";
import { HttpResponse } from "@xliic/common/http";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useState } from "react";
import styled from "styled-components";
import { MockHttpResponse } from "../../../../core/playbook/mock-http";
import { CircleCheckLight, CircleExclamationSolid } from "../../../../icons";
import CollapsibleCard, { BottomDescription, BottomItem } from "../CollapsibleCard";
import { TabButton, TabList } from "../Tabs";
import Body from "../response/Body";
import Headers from "../response/Headers";
import VariableAssignments from "./VariableAssignments";
import VariableUsed from "./VariableUsed";
import { OperationResult } from "./types";

export default function Response({
  first,
  last,
  result,
}: {
  first?: boolean;
  last?: boolean;
  result: OperationResult;
}) {
  const failed = false;

  const statusCode =
    result.httpResponse === MockHttpResponse ? 200 : result.httpResponse?.statusCode;

  const statusMessage =
    result.httpResponse === MockHttpResponse ? "MOCK" : result.httpResponse?.statusMessage;

  return (
    <Container>
      <Peg failed={failed} first={first} last={last} />
      <div>
        <CollapsibleCard>
          <BottomDescription>
            <BottomItem style={{ fontWeight: 700 }}>{result.ref?.id}</BottomItem>
            <BottomItem>Status: {`${statusCode} ${statusMessage}`}</BottomItem>
          </BottomDescription>
          <ResponseTabs result={result} />
        </CollapsibleCard>
      </div>
    </Container>
  );
}

function Peg({ first, last, failed }: { first?: boolean; last?: boolean; failed?: boolean }) {
  return (
    <PegContainer first={first} last={last}>
      <div />
      {failed ? <CircleExclamationSolid /> : <CircleCheckLight />}
      <div />
    </PegContainer>
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
      title: "Assigned",
      content: <VariableAssignments assignment={result.variablesAssigned!} />,
      enabled: result.variablesAssigned !== undefined && result.variablesAssigned.length > 0,
    },
    {
      id: "variables-used",
      title: "Variables",
      content: (
        <VariableUsed
          found={result.variablesReplaced?.found}
          missing={result.variablesReplaced?.missing}
        />
      ),
      enabled:
        result.variablesReplaced !== undefined &&
        (result.variablesReplaced.found.length > 0 || result.variablesReplaced.missing.length > 0),
    },
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

const Container = styled.div`
  display: flex;
  margin-left: 4px;
  margin-right: 4px;
  > div:last-child {
    flex: 1;
  }
`;

const Failed = styled.div`
  background-color: var(${ThemeColorVariables.badgeBackground});
  color: var(${ThemeColorVariables.badgeForeground});
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 16px;
  font-size: 11px;
  font-weight: 500;
`;

const PegContainer = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;
  align-self: stretch;
  > div:first-child {
    flex: 1;
    width: 2px;
    height: 8px;
    ${({ first }: { first?: boolean; last?: boolean }) =>
      !first && `background-color: var(${ThemeColorVariables.border});`}
  }
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
  > div:last-child {
    flex: 1;
    width: 2px;
    ${({ last }: { first?: boolean; last?: boolean }) =>
      !last && `background-color: var(${ThemeColorVariables.border});`}
  }
`;
