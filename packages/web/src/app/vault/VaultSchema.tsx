import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { Vault, SecurityScheme } from "@xliic/common/vault";

import { Plus, Pen, TrashCan } from "../../icons";
import { Menu, MenuItem } from "../../new-components/Menu";

import CollapsibleCard, {
  BottomDescription,
  TopDescription,
} from "../../new-components/CollapsibleCard";
import Separator from "../../components/Separator";

export default function VaultSchema({ schema }: { schema: SecurityScheme }) {
  const credentialKeys = "credentials" in schema ? Object.keys(schema.credentials) : [];
  return (
    <VaultSchemaBody>
      <Metadata>
        <Title>Type: {schema.type}</Title>
      </Metadata>
      <Separator title="Credentials" />
      <Credentials>
        {credentialKeys.map((key) => (
          <Credential name={key} schema={schema} credentialKey={key} key={key} />
        ))}
        <AddNewCredential>
          <Plus />
          New credential
        </AddNewCredential>
      </Credentials>
    </VaultSchemaBody>
  );
}

function Credential({ name }: { name: string; schema: SecurityScheme; credentialKey: string }) {
  return (
    <CredentialBody>
      <CollapsibleCard
        menu={
          <Menu>
            <MenuItem onClick={(e) => e.stopPropagation()} onSelect={() => {}}>
              <Pen />
              Edit
            </MenuItem>
            <MenuItem onClick={(e) => e.stopPropagation()} onSelect={() => {}}>
              <TrashCan />
              Delete
            </MenuItem>
          </Menu>
        }
      >
        <TopDescription>
          <div>{name}</div>
        </TopDescription>
        <BottomDescription>Credential details go here</BottomDescription>
      </CollapsibleCard>
    </CredentialBody>
  );
}

const VaultSchemaBody = styled.div``;
const Metadata = styled.div`
  margin: 16px 0px;
`;

const CredentialBody = styled.div`
  background-color: var(${ThemeColorVariables.background});
  //border: 1px solid var(${ThemeColorVariables.border});
  //padding: 8px;
`;

const Credentials = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 600;
`;

const AddNewCredential = styled.div`
  display: flex;
  padding: 8px 12px;
  gap: 4px;
  cursor: pointer;
  align-items: center;
  cusror: pointer;
  border: 1px dashed var(${ThemeColorVariables.border});
  color: var(${ThemeColorVariables.linkForeground});
  > svg {
    fill: var(${ThemeColorVariables.linkForeground});
  }
`;
