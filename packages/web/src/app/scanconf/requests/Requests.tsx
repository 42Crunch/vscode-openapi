import { HttpMethod } from "@xliic/openapi";
import { Playbook, serialize } from "@xliic/scanconf";

import { ItemId, SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { Menu, MenuItem } from "../../../new-components/Menu";
import Button from "../../../new-components/Button";
import { removeRequest, saveRequest } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import AddExternalRequestDialog from "./AddExternalRequestDialog";
import Request from "./Request";
import { setRequestId } from "./slice";
import { runFullScan } from "../actions";
import { optionallyReplaceLocalhost } from "../operations/util";
import { makeEnvEnv } from "../../../core/playbook/execute";

export default function Operations() {
  const dispatch = useAppDispatch();

  const { oas, playbook, servers } = useAppSelector((state) => state.scanconf);

  const requestRef = useAppSelector((state) => state.requests.ref);

  const config = useAppSelector((state) => state.config.data);
  const env = useAppSelector((state) => state.env.data);
  const preferredScanServer = useAppSelector((state) => state.prefs.scanServer);

  const onSetOperationId = ({ sectionId, itemId }: { sectionId: string; itemId: string }) => {
    const type = sectionId === "operation" ? "operation" : "request";
    dispatch(setRequestId({ type, id: itemId }));
  };

  const onRemoveRequest = (id: string) => {
    if (requestRef?.type === "request" && requestRef.id === id) {
      // removing currently selected request, reset selection to the first available operation
      const firstOperationId = Object.keys(playbook.operations)?.[0];
      if (firstOperationId !== undefined) {
        dispatch(setRequestId({ type: "operation", id: firstOperationId }));
      }
    }
    dispatch(removeRequest({ type: "request", id }));
  };

  const operationItems = Object.keys(playbook.operations).map((id) => ({ id, label: id }));

  const requestItems = Object.entries(playbook.requests || {})
    .filter(([id, request]) => request.operationId !== undefined)
    .map(([id, request]) => ({ id, label: id }));

  const externalRequestItems = Object.entries(playbook.requests || {})
    .filter(([id, request]) => request.operationId === undefined)
    .map(([id, request]) => ({
      id,
      label: id,
      menu: (
        <Menu>
          <MenuItem onClick={(e) => e.stopPropagation()} onSelect={() => onRemoveRequest(id)}>
            Delete
          </MenuItem>
        </Menu>
      ),
    }));

  let selected: ItemId | undefined = undefined;
  if (requestRef?.type === "operation" && playbook.operations[requestRef.id] !== undefined) {
    selected = { itemId: requestRef.id, sectionId: "operation" };
  } else if (requestRef?.type === "request" && playbook.requests?.[requestRef.id] !== undefined) {
    if (playbook.requests[requestRef.id].operationId !== undefined) {
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
          onAddExternalRequest={(
            id: string,
            method: HttpMethod,
            url: string,
            mode: "json" | "urlencoded"
          ) => {
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
                      header: [],
                      path: [],
                      query: [],
                      cookie: [],
                    },
                    body: hasBody(method)
                      ? {
                          mediaType:
                            mode === "urlencoded"
                              ? "application/x-www-form-urlencoded"
                              : "application/json",
                          value: {},
                        }
                      : undefined,
                  },
                  responses: {
                    "200": {
                      expectations: {
                        httpStatus: 200,
                      },
                      variableAssignments: {},
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

  const runScan = (server: string) => {
    const updatedServer = optionallyReplaceLocalhost(
      server,
      config.platformAuthType,
      config.scanRuntime,
      config.docker.replaceLocalhost,
      config.platform
    );

    const [serialized, error] = serialize(oas, playbook);
    if (error !== undefined) {
      console.log("failed to serialize", error);
      // FIXME show error when serializing
      return;
    }

    const { simple } = makeEnvEnv(Playbook.getCurrentEnvironment(playbook), env);

    dispatch(
      runFullScan({
        env: {
          SCAN42C_HOST: updatedServer,
          ...simple,
        },
        scanconf: JSON.stringify(serialized, null, 2),
      })
    );
  };

  return (
    <SearchSidebarControlled
      title="operations"
      selected={selected}
      sections={sections}
      onSelected={onSetOperationId}
      renderButtons={() => (
        <Button
          style={{ width: "100%" }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            runScan(preferredScanServer || servers[0]);
          }}
        >
          Scan all operations
        </Button>
      )}
      hideEmptySections={true}
      render={(selected) => (
        <Request
          requestRef={{ type: selected.sectionId, id: selected.itemId } as Playbook.RequestRef}
          key={`${selected.sectionId}-${selected.itemId}`}
        />
      )}
    />
  );
}

function hasBody(method: HttpMethod): boolean {
  const withBody: HttpMethod[] = ["post", "put", "patch"];
  return withBody.includes(method);
}
