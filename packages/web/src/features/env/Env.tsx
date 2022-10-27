import { useState } from "react";

import styled from "styled-components";
import * as Tabs from "@radix-ui/react-tabs";

import { TabList, TabButton } from "../../components/Tabs";

import { useFeatureSelector } from "./slice";
import Environment from "./Environment";
import { EnvData } from "@xliic/common/env";

export default function Env() {
  const { data, ready } = useFeatureSelector((state) => state.env);

  const [activeTab, setActiveTab] = useState("default");
  const tabs = [
    {
      id: "default",
      title: "Default",
      secret: false,
    },
    {
      id: "secrets",
      title: "Secrets",
      secret: true,
    },
  ];

  if (!ready) {
    return <Container>Loading environment data...</Container>;
  }

  return (
    <Container>
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <TabList>
          {tabs.map((tab) => (
            <TabButton key={tab.id} value={tab.id}>
              {tab.title}
            </TabButton>
          ))}
        </TabList>
        {tabs.map((tab) => (
          <Tabs.Content key={tab.id} value={tab.id}>
            <Environment name={tab.id as keyof EnvData} data={data[tab.id as keyof EnvData]} />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </Container>
  );
}

const Container = styled.div`
  margin: 4px;
`;
