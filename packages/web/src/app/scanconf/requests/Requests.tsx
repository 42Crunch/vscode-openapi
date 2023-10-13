import { RequestRef } from "@xliic/common/playbook";
import { useEffect, useState } from "react";
import { SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { saveRequest } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import AddExternalRequestDialog from "./AddExternalRequestDialog";
import Request from "./Request";
import { setRequestId } from "./slice";

export default function Operations() {
  const dispatch = useAppDispatch();

  const {
    playbook: { operations, requests },
  } = useAppSelector((state) => state.scanconf);

  const requestRef = useAppSelector((state) => state.requests.ref);

  const onSetOperationId = ({ sectionId, itemId }: { sectionId: string; itemId: string }) => {
    const type = sectionId === "operation" ? "operation" : "request";
    dispatch(setRequestId({ type, id: itemId }));
  };

  const operationItems = Object.keys(operations).map((id) => ({ id, label: id }));

  const requestItems = Object.entries(requests || {})
    .filter(([id, request]) => request.operationId !== undefined)
    .map(([id, request]) => ({ id, label: id }));

  const externalRequestItems = Object.entries(requests || {})
    .filter(([id, request]) => request.operationId === undefined)
    .map(([id, request]) => ({ id, label: id }));

  const [selected, setSelected] = useState(
    operationItems.length > 0 ? { itemId: operationItems[0].id, sectionId: "operation" } : undefined
  );

  useEffect(() => {
    if (requestRef !== undefined) {
      if (requestRef?.type === "operation") {
        setSelected({ itemId: requestRef.id, sectionId: "operation" });
      } else {
        if (requestItems.filter((item) => true).length > 0) {
          setSelected({ itemId: requestRef.id, sectionId: "requests" });
        } else {
          setSelected({ itemId: requestRef.id, sectionId: "external" });
        }
      }
    }
  }, [requestRef, requests]);

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
    {
      id: "external",
      title: "External Requests",
      items: externalRequestItems,
      menu: (
        <AddExternalRequestDialog
          onAddExternalRequest={(id: string) => {
            dispatch(
              saveRequest({
                ref: { id, type: "request" },
                stage: {
                  operationId: undefined,
                  defaultResponse: "200",
                  request: {
                    url: "http://localhost/",
                    method: "post",
                    parameters: {
                      header: {},
                      path: {},
                      query: {},
                      cookie: {},
                    },
                    body: {
                      mediaType: "application/json",
                      value: {},
                    },
                  },
                },
              })
            );
            console.log("dispatchibg");
            dispatch(setRequestId({ type: "request", id }));
          }}
        />
      ),
    },
  ];

  return (
    <SearchSidebarControlled
      selected={selected}
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
