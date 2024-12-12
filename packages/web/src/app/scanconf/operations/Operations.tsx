import { SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { useAppDispatch, useAppSelector } from "../store";
import Operation from "./Operation";
import { setOperationId } from "./slice";
import { customizeOperation, removeCustomizationForOperation } from "../slice";
import { requestConfirmation } from "../../../features/confirmation-dialog/slice";
import NewScenarioDialog from "./NewScenarioDialog";
import { Menu, MenuItem } from "../../../new-components/Menu";

export default function Operations() {
  const dispatch = useAppDispatch();

  const operationId = useAppSelector((state) => state.operations.operationId);
  const onSetOperationId = (operationId: string) => dispatch(setOperationId(operationId));
  const onCustomizeOperation = (operationId: string) => dispatch(customizeOperation(operationId));

  const {
    playbook: { operations },
  } = useAppSelector((state) => state.scanconf);

  const items = Object.entries(operations)
    .filter(([id, operation]) => operation.customized)
    .map(([id, operation]) => ({
      id,
      label: id,
      menu: (
        <>
          <Menu>
            <MenuItem
              onClick={(e) => e.stopPropagation()}
              onSelect={() =>
                dispatch(
                  requestConfirmation({
                    title: "Delete scenario",
                    message: `Are you sure you want to delete scenario for operation "${id}"?`,
                    actions: [
                      removeCustomizationForOperation(id),
                      // if removing the current operation, clear the operationId
                      setOperationId(operationId === id ? undefined : operationId),
                    ],
                  })
                )
              }
            >
              Delete
            </MenuItem>
          </Menu>
        </>
      ),
    }));

  const sections = [
    {
      id: "operations",
      title: "Operations",
      items,
    },
  ];

  return (
    <SearchSidebarControlled
      title="operations"
      noSectionTitles
      selected={operationId ? { sectionId: "operations", itemId: operationId } : undefined}
      sections={sections}
      onSelected={(selected) => onSetOperationId(selected.itemId)}
      render={(selected) => <Operation operationId={selected.itemId} key={selected.itemId} />}
      renderEmpty={() => (
        <div>
          <h2>Scenarios</h2>
          <p>Scan scenarios let you test operations that involve complex request flows</p>
          <p>
            Scenarios let you set up exact request and response sequences, ensuring resources are
            created or deleted as needed for testing specific API operations. Additionally, you can
            extract values from responses and pass them between subsequent operations.
          </p>
        </div>
      )}
      renderButtons={() => (
        <NewScenarioDialog
          operations={operations}
          onAddScenario={(operationId: string) => {
            onSetOperationId(operationId);
            onCustomizeOperation(operationId);
          }}
        />
      )}
    />
  );
}
