import * as Tabs from "@radix-ui/react-tabs";
import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useState } from "react";
import styled from "styled-components";
import { TabButton, TabList } from "../../../components/Tabs";
import ResponseProcessing from "../components/operation/ResponseProcessing";
import Environment from "../components/scenario/Environment";
import { OperationResult } from "../components/scenario/types";
import MissingVariables from "./MissingVariables";

export default function StageReferenceTabs({
  oas,
  result,
}: {
  oas: BundledSwaggerOrOasSpec;
  result?: OperationResult;
}) {
  const tabs = [
    {
      id: "environment",
      title: "Environment",
      content: <Environment name="environment" />,
      enabled: true,
    },
    {
      id: "responses",
      title: "Response Processing",
      content: <ResponseProcessing oas={oas} />,
      enabled: true,
    },
    {
      id: "missing-variables",
      title: "Missing Variables",
      counter: result?.variablesReplaced?.missing?.length,
      content: <MissingVariables missing={result?.variablesReplaced?.missing} />,
      enabled: true,
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
              {!!tab?.counter && <Counter>{tab.counter}</Counter>}
            </TabButton>
          ))}
      </TabList>
      {tabs.map((tab) => (
        <Tabs.Content key={tab.id} value={tab.id}>
          {tab.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}

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
