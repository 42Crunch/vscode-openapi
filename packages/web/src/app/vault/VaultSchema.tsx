import styled from "styled-components";
import { useState } from "react";

import { ThemeColorVariables } from "@xliic/common/theme";
import { Vault, SecurityScheme, SecurityCredential, SchemeType } from "@xliic/common/vault";

import { Pen, TrashCan } from "../../icons";
import { Menu, MenuItem } from "../../new-components/Menu";

import CollapsibleCard, {
  BottomDescription,
  TopDescription,
} from "../../new-components/CollapsibleCard";
import Separator from "../../components/Separator";
import NewCredentialDialog from "./NewCredentialDialog";
import EditCredentialDialog from "./EditCredentialDialog";
import { useAppDispatch } from "./store";
import { updateCredential } from "../../features/vault/slice";

export default function VaultSchema({ name, schema }: { name: string; schema: SecurityScheme }) {
  const credentialKeys = "credentials" in schema ? Object.keys(schema.credentials) : [];
  return (
    <VaultSchemaBody>
      <Metadata>
        <Title>Type: {schema.type}</Title>
      </Metadata>
      <Separator title="Credentials" />
      <Credentials>
        {credentialKeys.map((key) => (
          <Credential
            schemaName={name}
            schemeType={schema.type}
            name={key}
            credential={(schema as any).credentials[key]}
            existing={credentialKeys}
            key={key}
          />
        ))}
        <NewCredentialDialog existing={[]} onAddScheme={() => {}} />
      </Credentials>
    </VaultSchemaBody>
  );
}

function Credential({
  name,
  credential,
  schemaName,
  schemeType,
  existing,
}: {
  name: string;
  credential: SecurityCredential;
  schemaName: string;
  schemeType: SchemeType;
  existing: string[];
}) {
  const dispatch = useAppDispatch();

  const [isEditDialogOpen, setEditDialogOpen] = useState(false);

  return (
    <CredentialBody>
      <CollapsibleCard
        menu={
          <Menu>
            <MenuItem onClick={(e) => e.stopPropagation()} onSelect={() => setEditDialogOpen(true)}>
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
      <EditCredentialDialog
        id={{ scheme: schemaName, credential: name }}
        existing={existing}
        credential={credential}
        schemeType={schemeType}
        onCredentialUpdate={(id, name, value) => {
          dispatch(updateCredential({ id, name, value }));
        }}
        isOpen={isEditDialogOpen}
        setOpen={setEditDialogOpen}
      />
    </CredentialBody>
  );
}

const VaultSchemaBody = styled.div``;
const Metadata = styled.div`
  margin: 16px 0px;
`;

const CredentialBody = styled.div`
  background-color: var(${ThemeColorVariables.background});
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
