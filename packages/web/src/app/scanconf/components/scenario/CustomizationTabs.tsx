import * as Tabs from "@radix-ui/react-tabs";

import { useState } from "react";

import { TabList, TabButton } from "../../../../new-components/Tabs";

import JsonData from "./JsonData";

export default function CustomizationTabs() {
  const tabs = [
    {
      id: "environment",
      title: "Environment",
      content: <JsonData name="environment" />,
      enabled: true,
    },
    {
      id: "responses",
      title: "Response Processing",
      content: <JsonData name="responses" />,
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
