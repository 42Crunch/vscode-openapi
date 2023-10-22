import { BundledSwaggerOrOasSpec, getServerUrls } from "@xliic/common/openapi";
import * as playbook from "@xliic/common/playbook";
import { SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { setTryitServer } from "../../../features/prefs/slice";
import CollapsibleSection from "../components/CollapsibleSection";
import Execution from "../components/execution/Execution";
import { addCredential, saveCredential, selectCredential } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import CredentialAddNewDialog from "./CredentialAddNewDialog";
import CredentialCard from "./CredentialCard";
import CredentialMethods from "./CredentialMethods";
import TryIt from "./TryIt";
import { startTryAuthentication } from "./slice";
import { unwrapCredential, wrapCredential } from "./form";
import Form from "../../../new-components/Form";

export default function Auth() {
  const dispatch = useAppDispatch();

  const {
    playbook: { authenticationDetails },
    selectedCredentialGroup,
    selectedCredential,
    servers,
    oas,
  } = useAppSelector((state) => state.scanconf);

  const { tryResult } = useAppSelector((state) => state.auth);

  const sections = authenticationDetails.map((credentials, index) => {
    const items = Object.entries(credentials).map(([id, credential]) => ({ id, label: id }));
    const title = index === 0 ? "Default credential group" : `Credential group ${index}`;
    return {
      id: `${index}`,
      title,
      items,
    };
  });

  const onAddCredential = (id: string, credential: playbook.Credential) => {
    // no way to select credentialGroup for now
    dispatch(addCredential({ credentialGroup: 0, id, credential }));
    dispatch(selectCredential({ group: 0, credential: id }));
  };

  const onUpdateCredential = (group: string, id: string, credential: playbook.Credential) =>
    dispatch(saveCredential({ group: parseInt(group), id, credential }));

  const setServer = (server: string) => dispatch(setTryitServer(server));

  const prefs = useAppSelector((state) => state.prefs);

  const server = getPreferredServer(oas, prefs.tryitServer);

  return (
    <SearchSidebarControlled
      selected={
        selectedCredential !== undefined
          ? { sectionId: `${selectedCredentialGroup}`, itemId: selectedCredential }
          : undefined
      }
      sections={sections}
      onSelected={(selected) => {
        dispatch(
          selectCredential({ group: parseInt(selected.sectionId), credential: selected.itemId })
        );
      }}
      render={(selected) => {
        if (selected !== undefined) {
          const group = parseInt(selected.sectionId);
          const credentialId = selected.itemId;
          const credential = authenticationDetails[group][credentialId];
          return (
            <>
              <TryIt
                servers={servers}
                selected={server}
                onTry={(server: string) => {
                  dispatch(startTryAuthentication(server));
                }}
                onChange={setServer}
              />

              <CollapsibleSection title="Credential">
                <CredentialCard
                  credentialName={selected.itemId}
                  credential={credential}
                  saveCredential={(credential) =>
                    onUpdateCredential(selected.sectionId, selected.itemId, credential)
                  }
                  key={selected.itemId}
                />
              </CollapsibleSection>
              <CollapsibleSection
                defaultOpen={false}
                title="Credential values"
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
                  <CredentialMethods group={group} credentialId={credentialId} />
                </Form>
              </CollapsibleSection>

              {tryResult.length > 0 && (
                <CollapsibleSection title="Result">
                  <Execution result={tryResult} />
                </CollapsibleSection>
              )}
            </>
          );
        }
      }}
      renderButtons={() => <CredentialAddNewDialog onAddCredential={onAddCredential} />}
    />
  );
}

function getPreferredServer(
  oas: BundledSwaggerOrOasSpec,
  preferredServer: string | undefined
): string {
  const servers = getServerUrls(oas);

  const exists = servers.some((url) => url === preferredServer);
  if (preferredServer !== undefined && preferredServer !== "" && exists) {
    return preferredServer;
  }
  return servers[0];
}
