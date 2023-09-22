import { useState } from "react";
import styled from "styled-components";
import * as Tabs from "@radix-ui/react-tabs";

import { TabList, TabButton } from "../../../components/Tabs";
import CredentialGeneral from "./CredentialGeneral";
import CredentialCredentials from "./CredentialCredentials";

export default function Credential({}: {}) {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <Container>
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <TabList>
          <TabButton value={"general"}>General</TabButton>
          <TabButton value={"credentials"}>Credentials</TabButton>
        </TabList>
        <Tabs.Content value={"general"}>
          <CredentialGeneral />
        </Tabs.Content>
        <Tabs.Content value={"credentials"}>
          <CredentialCredentials />
        </Tabs.Content>
      </Tabs.Root>
    </Container>
  );
}

const Container = styled.div``;
