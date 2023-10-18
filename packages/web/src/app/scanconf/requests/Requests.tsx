import { RequestRef } from "@xliic/common/playbook";
import { useEffect, useState } from "react";
import { ItemId, SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { saveRequest } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import AddExternalRequestDialog from "./AddExternalRequestDialog";
import Request from "./Request";
import { setRequestId } from "./slice";
import { removeRequest } from "../slice";
import { HttpMethod } from "@xliic/common/http";
import { Menu, MenuItem } from "../../../new-components/Menu";

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

  const onRemoveRequest = (id: string) => {
    if (requestRef?.type === "request" && requestRef.id === id) {
      // removing currently selected request, reset selection to the first available operation
      const firstOperationId = Object.keys(operations)?.[0];
      if (firstOperationId !== undefined) {
        dispatch(setRequestId({ type: "operation", id: firstOperationId }));
      }
    }
    dispatch(removeRequest({ type: "request", id }));
  };

  const operationItems = Object.keys(operations).map((id) => ({ id, label: id }));

  const requestItems = Object.entries(requests || {})
    .filter(([id, request]) => request.operationId !== undefined)
    .map(([id, request]) => ({ id, label: id }));

  const externalRequestItems = Object.entries(requests || {})
    .filter(([id, request]) => request.operationId === undefined)
    .map(([id, request]) => ({
      id,
      label: id,
      menu: (
        <Menu>
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
            }}
            onSelect={(e) => {
              e.stopPropagation();
              onRemoveRequest(id);
            }}
          >
            Delete
          </MenuItem>
        </Menu>
      ),
    }));

  let selected: ItemId | undefined = undefined;
  if (requestRef?.type === "operation" && operations[requestRef.id] !== undefined) {
    selected = { itemId: requestRef.id, sectionId: "operation" };
  } else if (requestRef?.type === "request" && requests?.[requestRef.id] !== undefined) {
    if (requests[requestRef.id].operationId !== undefined) {
      selected = { itemId: requestRef.id, sectionId: "requests" };
    } else {
      selected = { itemId: requestRef.id, sectionId: "external" };
    }
  }

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
          onAddExternalRequest={(id: string, method: HttpMethod, url: string) => {
            dispatch(
              saveRequest({
                ref: { id, type: "request" },
                stage: {
                  operationId: undefined,
                  defaultResponse: "200",
                  request: {
                    url,
                    method: method,
                    parameters: {
                      header: {},
                      path: {},
                      query: {},
                      cookie: {},
                    },
                    body: hasBody(method)
                      ? {
                          mediaType: "application/json",
                          value: {},
                        }
                      : undefined,
                  },
                  responses: {
                    "200": {
                      expectations: {
                        httpStatus: 200,
                      },
                    },
                  },
                },
              })
            );
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

function hasBody(method: HttpMethod): boolean {
  const withBody: HttpMethod[] = ["post", "put", "patch"];
  return withBody.includes(method);
}
