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

export default function Credential({ selected }: { selected: ItemId }) {
  const dispatch = useAppDispatch();

  const {
    playbook: { authenticationDetails },
    servers,
  } = useAppSelector((state) => state.scanconf);

  const { tryResult } = useAppSelector((state) => state.auth);

  const onUpdateCredential = (group: string, id: string, credential: Playbook.Credential) =>
    dispatch(saveCredential({ group: parseInt(group), id, credential }));

  const group = parseInt(selected.sectionId);
  const credentialId = selected.itemId;
  const credential = authenticationDetails[group][credentialId];
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

const Container = styled.div`
  padding: 8px;
`;
