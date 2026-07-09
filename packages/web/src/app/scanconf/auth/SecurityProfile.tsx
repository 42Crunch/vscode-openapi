import styled from "styled-components";

import { useAppSelector } from "../store";

// Placeholder detail page for the synthetic "mTLS" security scheme backed by
// playbook.securityProfile. A dedicated editor will replace this later.
export default function SecurityProfile() {
  const { securityProfile } = useAppSelector((state) => state.scanconf.playbook);

  return (
    <Container>
      <Title>Mutual TLS (mTLS)</Title>
      <Description>
        {securityProfile === undefined
          ? "No mutual TLS security profile is configured."
          : "This security scheme holds the client certificate, its password and an optional CA certificate used for mutual TLS during a scan. A dedicated editor is coming soon."}
      </Description>
    </Container>
  );
}

const Container = styled.div`
  padding: 8px;
`;

const Title = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
`;

const Description = styled.div`
  opacity: 0.8;
`;
