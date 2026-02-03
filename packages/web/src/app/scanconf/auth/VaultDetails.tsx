import styled from "styled-components";

import { Playbook } from "@xliic/scanconf";
import { Vault } from "@xliic/common/vault";
import { getScheme } from "../../../core/vault";
import Button from "../../../new-components/Button";

export default function VaultDetails({ errors }: { errors: string[] }) {
  return (
    <Container>
      {errors.map((error, index) => (
        <Message key={index}>
          <span>{error}</span>
          <Button>Fix</Button>
        </Message>
      ))}
      {errors.length === 0 && <div>No issues found in Vault configuration.</div>}
    </Container>
  );
}

export const Container = styled.div`
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Message = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
