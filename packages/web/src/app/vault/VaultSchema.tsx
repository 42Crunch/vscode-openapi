import styled from "styled-components";
import { useState } from "react";

import { ThemeColorVariables } from "@xliic/common/theme";
import {
  SecurityScheme,
  SecurityCredential,
  CredentialMetadata,
  SchemeType,
  AliasSecurityScheme,
  CredentialsSecurityScheme,
  BasicCredential,
  ApiKeyCredential,
  BearerCredential,
  AccessTokenCredential,
  KeyPairCredential,
} from "@xliic/common/vault";

import { Pen, TrashCan } from "../../icons";
import { Menu, MenuItem } from "../../new-components/Menu";

import CollapsibleCard, { TopDescription } from "../../new-components/CollapsibleCard";
import Separator from "../../components/Separator";
import NewCredentialDialog from "./NewCredentialDialog";
import EditCredentialDialog from "./EditCredentialDialog";
import { useAppDispatch } from "./store";
import { deleteCredential, updateCredential } from "../../features/vault/slice";
import { requestConfirmation } from "../../features/confirmation-dialog/slice";
import BasicCredentialView from "./credential/view/BasicCredentialView";
import ApiKeyCredentialView from "./credential/view/ApiKeyCredentialView";
import BearerCredentialView from "./credential/view/BearerCredentialView";
import OAuth2CredentialView from "./credential/view/OAuth2CredentialView";
import OpenIdConnectCredentialView from "./credential/view/OpenIdConnectCredentialView";
import MutualTLSCredentialView from "./credential/view/MutualTLSCredentialView";

export default function VaultSchema({
  schemaName,
  schema,
}: {
  schemaName: string;
  schema: SecurityScheme;
}) {
  return (
    <VaultSchemaBody>
      {schema.type === "alias" ? (
        <AliasSchemaContent schema={schema} />
      ) : (
        <CredentialsSchemaContent schemaName={schemaName} schema={schema} />
      )}
    </VaultSchemaBody>
  );
}

function SchemaMetadata({ type, children }: { type: string; children?: React.ReactNode }) {
  return (
    <Metadata>
      <Title>Type: {type}</Title>
      {children}
    </Metadata>
  );
}

function AliasSchemaContent({ schema }: { schema: AliasSecurityScheme }) {
  return (
    <SchemaMetadata type={schema.type}>
      <AliasDestination>Alias destination: {schema.scheme}</AliasDestination>
    </SchemaMetadata>
  );
}

function CredentialsSchemaContent({
  schemaName,
  schema,
}: {
  schemaName: string;
  schema: CredentialsSecurityScheme;
}) {
  const dispatch = useAppDispatch();
  const credentialKeys = Object.keys(schema.credentials);
  return (
    <>
      <SchemaMetadata type={schema.type} />
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
              updateCredential({
                id: { scheme: schemaName, credential: undefined },
                name,
                value,
              })
            );
          }}
        />
      </Credentials>
    </>
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
        <CredentialDetails>
          <CredentialView schemeType={schemeType} credential={credential} />
          <CredentialScopes credential={credential} />
        </CredentialDetails>
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

function CredentialView({
  schemeType,
  credential,
}: {
  schemeType: SchemeType;
  credential: SecurityCredential;
}) {
  switch (schemeType) {
    case "basic":
      return <BasicCredentialView credential={credential as BasicCredential} />;
    case "apiKey":
      return <ApiKeyCredentialView credential={credential as ApiKeyCredential} />;
    case "bearer":
      return <BearerCredentialView credential={credential as BearerCredential} />;
    case "oauth2":
      return <OAuth2CredentialView credential={credential as AccessTokenCredential} />;
    case "openIdConnect":
      return <OpenIdConnectCredentialView credential={credential as AccessTokenCredential} />;
    case "mutualTLS":
      return <MutualTLSCredentialView credential={credential as KeyPairCredential} />;
    default:
      return null;
  }
}

function CredentialScopes({ credential }: { credential: SecurityCredential }) {
  const scopes = (credential as CredentialMetadata).scopes;
  if (!scopes || scopes.length === 0) {
    return null;
  }
  return (
    <ScopesDisplay>
      <ScopesLabel>Scopes</ScopesLabel>
      <ScopesList>
        {scopes.map((scope) => (
          <ScopeTag key={scope}>{scope}</ScopeTag>
        ))}
      </ScopesList>
    </ScopesDisplay>
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

const AliasDestination = styled.div`
  margin-top: 4px;
  font-size: 12px;
`;

const CredentialDetails = styled.div`
  padding: 8px 12px;
`;

const ScopesDisplay = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 0;
`;

const ScopesLabel = styled.div`
  font-weight: 600;
  font-size: 90%;
  min-width: 120px;
  color: var(${ThemeColorVariables.foreground});
`;

const ScopesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const ScopeTag = styled.div`
  padding: 0 6px;
  border-radius: 2px;
  font-size: 12px;
  line-height: 20px;
  background-color: var(${ThemeColorVariables.badgeBackground});
  color: var(${ThemeColorVariables.badgeForeground});
`;
