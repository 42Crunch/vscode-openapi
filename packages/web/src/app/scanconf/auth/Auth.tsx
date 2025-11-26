import { Playbook } from "@xliic/scanconf";
import { getSecurityScheme } from "@xliic/openapi";

import { SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { addCredential, removeCredential, selectCredential } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import Credential from "./Credential";
import NewCredentialDialog from "./NewCredentialDialog";
import { Menu, MenuItem } from "../../../new-components/Menu";
import { TrashCan } from "../../../icons";
import { checkVault } from "./vault-utils";

export default function Auth() {
  const dispatch = useAppDispatch();

  const {
    playbook: { authenticationDetails },
    selectedCredentialGroup,
    selectedCredential,
    oas,
  } = useAppSelector((state) => state.scanconf);

  const { data: vault, enabled: useVault } = useAppSelector((state) => state.vault);

  const errors = useVault
    ? Object.fromEntries(
        Object.entries(authenticationDetails?.[0] || {}).map(([key, credential]) => [
          key,
          checkVault(oas, vault, key, credential).join(", ") === ""
            ? undefined
            : checkVault(oas, vault, key, credential).join(", "),
        ])
      )
    : {};

  const onAddCredential = (id: string, credential: Playbook.Credential) => {
    // no way to select credentialGroup for now
    dispatch(addCredential({ credentialGroup: 0, id, credential }));
    dispatch(selectCredential({ group: 0, credential: id }));
  };

  const sections = authenticationDetails.map((credentials, index) => {
    const title = index === 0 ? "Default group" : `Group ${index}`;

    const items = Object.entries(credentials).map(([id, credential]) => ({
      id,
      label: id,
      menu: (
        <Menu>
          <MenuItem
            onClick={(e) => e.stopPropagation()}
            onSelect={() => dispatch(removeCredential({ credentialGroup: index, id }))}
          >
            <TrashCan />
            Delete
          </MenuItem>
        </Menu>
      ),
    }));

    return {
      id: `${index}`,
      title,
      items,
    };
  });

  return (
    <SearchSidebarControlled
      title="security schemes"
      sections={sections}
      render={(selected) => <Credential key={selected.itemId} selected={selected} />}
      renderButtons={() => (
        <NewCredentialDialog
          existing={Object.keys(authenticationDetails?.[0] || [])}
          onAddCredential={onAddCredential}
        />
      )}
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
      errors={errors}
    />
  );
}
