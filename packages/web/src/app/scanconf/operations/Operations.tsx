import { useEffect } from "react";
import Button from "../../../components/Button";
import { SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { useAppDispatch, useAppSelector } from "../store";
import Operation from "./Operation";
import { setOperationId } from "./slice";
import GeneralError from "../components/GeneralError";

export default function Operations() {
  const dispatch = useAppDispatch();

  const operationId = useAppSelector((state) => state.operations.operationId);
  const onSetOperationId = (operationId: string) => dispatch(setOperationId(operationId));

  const {
    playbook: { operations },
    gerror,
  } = useAppSelector((state) => state.scanconf);

  const items = Object.keys(operations).map((id) => ({ id, label: id }));

  const sections = [
    {
      id: "operations",
      title: "Operations",
      items,
    },
  ];

  if (gerror !== undefined) {
    return <GeneralError error={gerror} />;
  }

  return (
    <SearchSidebarControlled
      noSectionTitles
      selected={operationId ? { sectionId: "operations", itemId: operationId } : undefined}
      sections={sections}
      onSelected={(selected) => onSetOperationId(selected.itemId)}
      render={(selected) => {
        if (selected !== undefined)
          return <Operation operationId={selected.itemId} key={selected.itemId} />;
      }}
      // renderButtons={() => <Button style={{ width: "100%" }}>Run scan</Button>}
    />
  );
}
