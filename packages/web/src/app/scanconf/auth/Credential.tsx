import { BundledSwaggerOrOasSpec, getServerUrls } from "@xliic/common/openapi";
import * as playbook from "@xliic/common/playbook";
import { ItemId } from "../../../components/layout/SearchSidebar";
import { setTryitServer } from "../../../features/prefs/slice";
import Form from "../../../new-components/Form";
import CollapsibleSection from "../components/CollapsibleSection";
import Execution from "../components/execution/Execution";
import { addCredential, saveCredential, selectCredential } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import CredentialDetails from "./CredentialDetails";
import CredentialValues from "./CredentialValues";
import TryIt from "./TryIt";
import { unwrapCredential, wrapCredential } from "./form";
import { startTryAuthentication } from "./slice";

export default function Credential({ selected }: { selected: ItemId }) {
  const dispatch = useAppDispatch();

  const {
    playbook: { authenticationDetails },
    servers,
    oas,
  } = useAppSelector((state) => state.scanconf);

  const { tryResult } = useAppSelector((state) => state.auth);

  const onUpdateCredential = (group: string, id: string, credential: playbook.Credential) =>
    dispatch(saveCredential({ group: parseInt(group), id, credential }));

  const setServer = (server: string) => dispatch(setTryitServer(server));

  const prefs = useAppSelector((state) => state.prefs);

  const server = getPreferredServer(oas, prefs.tryitServer);

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
          <CredentialValues group={group} credentialId={credentialId} />
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
