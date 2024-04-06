import { serialize } from "@xliic/scanconf";
import { Playbook } from "@xliic/scanconf";

import { SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import Button from "../../../new-components/Button";
import { useAppDispatch, useAppSelector } from "../store";
import Operation from "./Operation";
import { setOperationId } from "./slice";
import { runFullScan } from "../actions";
import { optionallyReplaceLocalhost } from "./util";
import { makeEnvEnv } from "../../../core/playbook/execute";

export default function Operations() {
  const dispatch = useAppDispatch();
  const operationId = useAppSelector((state) => state.operations.operationId);
  const onSetOperationId = (operationId: string) => dispatch(setOperationId(operationId));
  const { oas, playbook, servers } = useAppSelector((state) => state.scanconf);
  const config = useAppSelector((state) => state.config.data);
  const env = useAppSelector((state) => state.env.data);
  const preferredScanServer = useAppSelector((state) => state.prefs.scanServer);

  const items = Object.keys(playbook.operations).map((id) => ({ id, label: id }));

  const sections = [
    {
      id: "operations",
      title: "Operations",
      items,
    },
  ];

  const runScan = (server: string) => {
    const updatedServer = optionallyReplaceLocalhost(
      server,
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
      noSectionTitles
      selected={operationId ? { sectionId: "operations", itemId: operationId } : undefined}
      sections={sections}
      onSelected={(selected) => onSetOperationId(selected.itemId)}
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
      render={(selected) => {
        if (selected !== undefined)
          return <Operation operationId={selected.itemId} key={selected.itemId} />;
      }}
    />
  );
}
