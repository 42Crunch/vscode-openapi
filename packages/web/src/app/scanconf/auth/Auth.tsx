import * as playbook from "@xliic/common/playbook";
import { SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { addCredential, selectCredential } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import Credential from "./Credential";
import NewCredentialDialog from "./NewCredentialDialog";

export default function Auth() {
  const dispatch = useAppDispatch();

  const {
    playbook: { authenticationDetails },
    selectedCredentialGroup,
    selectedCredential,
  } = useAppSelector((state) => state.scanconf);

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

  return (
    <SearchSidebarControlled
      sections={sections}
      render={(selected) => (selected === undefined ? null : <Credential selected={selected} />)}
      renderButtons={() => <NewCredentialDialog onAddCredential={onAddCredential} />}
      selected={
        selectedCredential !== undefined
          ? { sectionId: `${selectedCredentialGroup}`, itemId: selectedCredential }
          : undefined
      }
      onSelected={(selected) => {
        dispatch(
          selectCredential({ group: parseInt(selected.sectionId), credential: selected.itemId })
        );
      }}
    />
  );
}
