import styled from "styled-components";

import { Playbook } from "@xliic/scanconf";

import { ItemId } from "../../../components/layout/SearchSidebar";
import Form from "../../../new-components/Form";
import CollapsibleSection from "../components/CollapsibleSection";
import Execution from "../components/execution/Execution";
import { saveCredential } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import CredentialDetails from "./CredentialDetails";
import CredentialValues from "./CredentialValues";
import { unwrapCredential, wrapCredential } from "./form";
import { startTryAuthentication } from "./slice";
import TryAndServerSelector from "../components/TryAndServerSelector";
import VaultDetails from "./VaultDetails";
import { TriangleExclamation } from "../../../icons";
import { ThemeColorVariables } from "@xliic/common/theme";
import { checkVault } from "./vault-utils";

export default function Credential({ selected }: { selected: ItemId }) {
  const dispatch = useAppDispatch();
  const { data: vault, enabled: useVault } = useAppSelector((state) => state.vault);

  const {
    playbook: { authenticationDetails },
    servers,
    oas,
  } = useAppSelector((state) => state.scanconf);

  const { tryResult } = useAppSelector((state) => state.auth);

  const onUpdateCredential = (group: string, id: string, credential: Playbook.Credential) =>
    dispatch(saveCredential({ group: parseInt(group), id, credential }));

  const group = parseInt(selected.sectionId);
  const credentialId = selected.itemId;
  const credential = authenticationDetails[group][credentialId];

  const vaultErrors = useVault ? checkVault(oas, vault, credentialId, credential) : [];

  return (
    <Container>
      <TryAndServerSelector
        servers={servers}
        onTry={(server: string) => {
          dispatch(startTryAuthentication(server));
        }}
      />

      <CollapsibleSection title="Security Scheme">
        <CredentialDetails
          credential={credential}
          saveCredential={(credential) =>
            onUpdateCredential(selected.sectionId, selected.itemId, credential)
          }
          key={selected.itemId}
        />
      </CollapsibleSection>

      {useVault && (
        <CollapsibleSection
          title="Vault"
          defaultOpen={vaultErrors.length > 0}
          icon={
            vaultErrors.length > 0 && (
              <Warning>
                <TriangleExclamation />
              </Warning>
            )
          }
        >
          <VaultDetails errors={vaultErrors} />
        </CollapsibleSection>
      )}

      <CollapsibleSection
        defaultOpen={false}
        title="Credentials"
        count={Object.keys(credential.methods).length}
      >
        <Form
          data={credential}
          saveData={(credential) =>
            onUpdateCredential(selected.sectionId, selected.itemId, credential)
          }
          wrapFormData={wrapCredential}
          unwrapFormData={unwrapCredential}
        >
          <CredentialValues group={group} credentialId={credentialId} />
        </Form>
      </CollapsibleSection>

      {tryResult.length > 0 && (
        <CollapsibleSection title="Result">
          <Execution result={tryResult} />
        </CollapsibleSection>
      )}
    </Container>
  );
}

const Warning = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  > svg {
    fill: var(${ThemeColorVariables.errorForeground});
  }
`;

const Container = styled.div`
  padding: 8px;
`;
