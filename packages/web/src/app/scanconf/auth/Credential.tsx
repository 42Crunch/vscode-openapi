import styled from "styled-components";
import { TabContainer } from "../../../new-components/Tabs";
import CredentialCredentials from "./CredentialCredentials";
import CredentialGeneral from "./CredentialGeneral";

export default function Credential() {
  return (
    <Container>
      <TabContainer
        tabs={[
          { id: "general", title: "General", content: <CredentialGeneral /> },
          { id: "credentials", title: "Credentials", content: <CredentialCredentials /> },
        ]}
      />
    </Container>
  );
}

const Container = styled.div``;
