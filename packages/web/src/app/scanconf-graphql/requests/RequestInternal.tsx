import { useEffect, useState } from "react";
import styled from "styled-components";

import { Environment as UnknownEnvironment } from "@xliic/common/env";
import { Playbook, serialize } from "@xliic/scanconf";

import { simpleClone } from "@xliic/preserving-json-yaml-parser";
import { DynamicVariableNames } from "../../../core/playbook/builtin-variables";
import { makeEnvEnv } from "../../../core/playbook/execute";
import CollapsibleSection from "../../scanconf/components/CollapsibleSection";
import Execution from "../../scanconf/components/execution/Execution";
import { getVariableNamesFromEnvStack } from "../../scanconf/requests/RequestInternal";
import { runScan } from "../actions";
import RequestCard from "../components/scenario/RequestCard";
import TryAndServerSelector from "../components/TryAndServerSelector";
import { saveRequest } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import { executeRequest } from "./slice";

export default function RequestInternal({
  request,
  requestRef,
}: {
  request: Playbook.StageContent;
  requestRef: Playbook.RequestRef;
}) {
  const dispatch = useAppDispatch();

  const { graphQl, playbook, servers } = useAppSelector((state) => state.scanconf);
  const config = useAppSelector((state) => state.config.data);
  const env = useAppSelector((state) => state.env.data);
  const useGlobalBlocks = useAppSelector((state) => state.prefs.useGlobalBlocks);

  const {
    tryResult,
    mockResult,
    mockMissingVariables: missingVariables,
  } = useAppSelector((state) => state.requests);

  const onRun = (server: string, inputs: UnknownEnvironment) =>
    dispatch(executeRequest({ server, inputs }));

  const onSaveRequest = (stage: Playbook.StageContent) =>
    dispatch(saveRequest({ ref: requestRef, stage }));

  const credentials = playbook?.authenticationDetails
    ? playbook?.authenticationDetails[0]
    : undefined;

  const variables = [...DynamicVariableNames, ...getVariableNamesFromEnvStack([])];

  const [inputs, setInputs] = useState<UnknownEnvironment>({});

  const {
    simple,
    environment: {
      env: { host },
    },
  } = makeEnvEnv(Playbook.getCurrentEnvironment(playbook), env);

  useEffect(() => {
    const updated = { ...inputs };
    // remove stale variables
    for (const name of Object.keys(updated)) {
      if (!missingVariables.includes(name)) {
        delete updated[name];
      }
    }
    // create new variables
    for (const name of missingVariables) {
      if (updated[name] === undefined) {
        updated[name] = "";
      }
    }
    setInputs(updated);
  }, [missingVariables]);

  return (
    <Container>
      <TryAndServerSelector
        menu={true}
        servers={servers}
        host={host as string | undefined}
        onTry={(server: string) => onRun(server, inputs)}
        onScan={(server: string) => {
          const [serialized, error] = serialize(playbook);
          if (error !== undefined) {
            console.log("failed to serialize", error);
            // FIXME show error when serializing
            return;
          }
          dispatch(
            runScan({
              path: request.request.path,
              method: request.request.method,
              operationId: request.operationId,
              env: {
                SCAN42C_HOST: server,
                ...simple,
              },
              scanconf: extractScanconf(serialized, request.operationId),
            })
          );
        }}
      />

      <CollapsibleSection title="Request">
        <RequestCard
          defaultCollapsed={false}
          config={undefined}
          credentials={credentials}
          availableVariables={variables}
          requestRef={requestRef}
          stage={request!}
          saveRequest={onSaveRequest}
        />
      </CollapsibleSection>

      {tryResult.length > 0 && (
        <CollapsibleSection title="Result">
          <Execution result={tryResult} collapsible={useGlobalBlocks} />
        </CollapsibleSection>
      )}
    </Container>
  );
}

const Container = styled.div`
  padding: 8px;
`;

function extractScanconf(mutable: any, operationId: string): string {
  if (mutable.operations !== undefined) {
    for (const key of Object.keys(mutable?.operations)) {
      if (key !== operationId) {
        delete mutable.operations[key];
      }
    }
  }
  return JSON.stringify(mutable, null, 2);
}
