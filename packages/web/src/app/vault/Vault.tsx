import { SearchSidebarControlled } from "../../components/layout/SearchSidebar";
import {
  selectScheme,
  useFeatureSelector,
  addScheme,
  deleteScheme,
} from "../../features/vault/slice";
import { requestConfirmation } from "../../features/confirmation-dialog/slice";

import { TrashCan } from "../../icons";
import { Menu, MenuItem } from "../../new-components/Menu";
import NewSchemeDialog from "./NewSchemeDialog";
import VaultSchema from "./VaultSchema";
import { useAppDispatch, useAppSelector } from "./store";

export default function Vault() {
  const dispatch = useAppDispatch();
  const { ready, data, selectedSchemeId } = useAppSelector((state) => state.vault);

  const items = Object.keys(data?.schemes || {}).map((key) => ({
    id: key,
    label: key,
    menu: (
      <Menu>
        <MenuItem
          onClick={(e) => e.stopPropagation()}
          onSelect={() =>
            dispatch(
              requestConfirmation({
                title: "Delete scheme",
                message: `Are you sure you want to delete scheme "${key}"?`,
                actions: [deleteScheme(key)],
              })
            )
          }
        >
          <TrashCan />
          Delete
        </MenuItem>
      </Menu>
    ),
  }));

  const sections = [
    {
      id: "schemas",
      title: "Schemas",
      items: items,
    },
  ];

  if (!ready) {
    return null;
  }

  return (
    <SearchSidebarControlled
      sections={sections}
      selected={selectedSchemeId ? { sectionId: "schemas", itemId: selectedSchemeId } : undefined}
      onSelected={(selected) => {
        dispatch(selectScheme(selected.itemId));
      }}
      noSectionTitles
      //errors={errors}
      render={(selected) => {
        return <VaultSchema schema={data?.schemes?.[selected?.itemId!]!} />;
      }}
      renderButtons={() => (
        <NewSchemeDialog
          existing={Object.keys(data?.schemes || {})}
          onAddScheme={(name, type, scheme) => {
            dispatch(addScheme({ name, type, scheme }));
          }}
        />
      )}
    />
  );
}
