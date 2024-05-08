import { SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { useAppDispatch, useAppSelector } from "../store";
import Operation from "./Operation";
import { setOperationId } from "./slice";
import { customizeOperation } from "../slice";
import NewScenarioDialog from "./NewScenarioDialog";

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
    .map(([id, operation]) => ({ id, label: id }));

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
          <p>To test operations that involve complex request flows, use Scenarios.</p>
          <p>
            Scenarios allow definition of specific request and response sequences, extraction of
            values from responses, and passing of extracted values between subsequent operations.
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
