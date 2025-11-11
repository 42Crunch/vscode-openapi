import styled from "styled-components";
import { useState } from "react";

import { ThemeColorVariables } from "@xliic/common/theme";
import { SecurityScheme, SecurityCredential, SchemeType } from "@xliic/common/vault";

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
import { deleteCredential, updateCredential } from "../../features/vault/slice";
import { requestConfirmation } from "../../features/confirmation-dialog/slice";

export default function VaultSchema({
  schemaName,
  schema,
}: {
  schemaName: string;
  schema: SecurityScheme;
}) {
  const dispatch = useAppDispatch();

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
            schemaName={schemaName}
            schemeType={schema.type}
            name={key}
            credential={(schema as any).credentials[key]}
            existing={credentialKeys}
            key={key}
          />
        ))}
        <NewCredentialDialog
          existing={credentialKeys}
          schemeType={schema.type}
          onCredentialAdd={(name, value) => {
            dispatch(
              updateCredential({ id: { scheme: schemaName, credential: undefined }, name, value })
            );
          }}
        />
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
            <MenuItem
              onClick={(e) => e.stopPropagation()}
              onSelect={() =>
                dispatch(
                  requestConfirmation({
                    title: "Delete credential",
                    message: `Are you sure you want to delete credential "${name}"?`,
                    actions: [deleteCredential({ scheme: schemaName, credential: name })],
                  })
                )
              }
            >
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
