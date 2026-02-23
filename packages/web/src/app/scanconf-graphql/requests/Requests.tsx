import { Playbook, serialize } from "@xliic/scanconf";

import { ItemId, SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { makeEnvEnv } from "../../../core/playbook/execute";
import Button from "../../../new-components/Button";
import { Menu, MenuItem } from "../../../new-components/Menu";
import { runFullScan } from "../actions";
import { removeRequest } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import Request from "./Request";
import { setRequestId } from "./slice";

export default function Operations() {
  const dispatch = useAppDispatch();

  const { graphQl, playbook, servers } = useAppSelector((state) => state.scanconf);
  const requestRef = useAppSelector((state) => state.requests.ref);

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
    },
  ];

  const runScan = (server: string) => {
    const updatedServer = server; // GraphQL do not use docker
    const [serialized, error] = serialize(playbook);
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
