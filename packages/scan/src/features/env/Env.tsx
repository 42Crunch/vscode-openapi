import { useState } from "react";

import styled from "styled-components";
import * as Tabs from "@radix-ui/react-tabs";

import { TabList, TabButton } from "../../components/Tabs";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import Navigation from "../../components/Navigation";
import Environment from "./Environment";
import { EnvData } from "@xliic/common/messages/env";

export default function Env() {
  const dispatch = useAppDispatch();
  const data = useAppSelector((state) => state.env.data);

  const [activeTab, setActiveTab] = useState("secrets");
  const tabs = [
    /* TODO re-enable default environment when it's supported in scan configs
    {
      id: "default",
      title: "Default",
      secret: false,
    },
    */
    {
      id: "secrets",
      title: "Secrets",
      secret: true,
    },
  ];

  return (
    <>
      <Navigation
        tabs={[
          ["scanOperation", "Scan"],
          ["scanReport", "Report"],
          ["env", "Environment"],
        ]}
      />
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
    </>
  );
}

const Container = styled.div``;
