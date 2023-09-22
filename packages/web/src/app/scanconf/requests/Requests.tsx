import { useEffect } from "react";
import { SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { useAppDispatch, useAppSelector } from "../store";
import Request from "./Request";
import { setRequestId } from "./slice";
import { RequestRef } from "@xliic/common/playbook";

export default function Operations() {
  const dispatch = useAppDispatch();

  const requestRef = useAppSelector((state) => state.requests.ref);

  const onSetOperationId = ({ sectionId, itemId }: { sectionId: string; itemId: string }) =>
    dispatch(setRequestId({ type: sectionId as any, id: itemId }));

  const {
    playbook: { operations, requests },
  } = useAppSelector((state) => state.scanconf);

  const operationItems = Object.keys(operations).map((id) => ({ id, label: id }));
  const requestItems = Object.keys(requests || {}).map((id) => ({ id, label: id }));

  useEffect(() => {
    if (requestRef === undefined && operationItems.length > 0) {
      setRequestId({ id: operationItems[0].id, type: "operation" });
    }
  }, []);

  const sections = [
    {
      id: "operation",
      title: "Operations",
      items: operationItems,
    },
    {
      id: "request",
      title: "Requests",
      items: requestItems,
    },
  ];

  return (
    <SearchSidebarControlled
      selected={requestRef && { sectionId: requestRef.type, itemId: requestRef.id }}
      sections={sections}
      onSelected={onSetOperationId}
      render={(selected) => {
        if (selected !== undefined)
          return (
            <Request
              requestRef={{ type: selected.sectionId, id: selected.itemId } as RequestRef}
              key={`${selected.sectionId}-${selected.itemId}`}
            />
          );
      }}
    />
  );
}
