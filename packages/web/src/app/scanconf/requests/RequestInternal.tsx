import { useEffect, useState } from "react";
import styled from "styled-components";

import { Environment as UnknownEnvironment } from "@xliic/common/env";
import { Playbook, serialize } from "@xliic/scanconf";
import { ThemeColorVariables } from "@xliic/common/theme";

import { DynamicVariableNames } from "../../../core/playbook/builtin-variables";
import { PlaybookEnvStack } from "../../../core/playbook/playbook-env";
import Form from "../../../new-components/Form";
import CollapsibleSection from "../components/CollapsibleSection";
import Execution from "../components/execution/Execution";
import Environment from "../components/environment/Environment";
import RequestCard from "../components/scenario/RequestCard";
import { saveRequest } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import { executeRequest } from "./slice";
import TryAndServerSelector from "../components/TryAndServerSelector";
import { extractScanconf, optionallyReplaceLocalhost } from "../operations/util";
import { makeEnvEnv } from "../../../core/playbook/execute";
import { runScan } from "../actions";
import DescriptionTooltip from "../../../new-components/DescriptionTooltip";
import { findResult } from "../playbook-execution-handler";
import { ErrorBanner } from "../../../components/Banner";

export default function RequestInternal({
  request,
  requestRef,
}: {
  request: Playbook.StageContent;
  requestRef: Playbook.RequestRef;
}) {
  const dispatch = useAppDispatch();

  const { oas, playbook, servers } = useAppSelector((state) => state.scanconf);
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

  const credentials = playbook.authenticationDetails[0];

  const beforeExecutionResult = findResult(mockResult, "Global Before");
  const afterExecutionResult = findResult(mockResult, "Global After");
  const requestResult = findResult(mockResult, "Request");

  const variables = [
    ...DynamicVariableNames,
    ...getVariableNamesFromEnvStack(requestResult?.results?.[0]?.variablesReplaced?.stack || []),
  ];

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

          dispatch(
            runScan({
              path: request.request.path,
              method: request.request.method,
              operationId: request.operationId,
              env: {
                SCAN42C_HOST: updatedServer,
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
          oas={oas}
          credentials={credentials}
          availableVariables={variables}
          requestRef={requestRef}
          stage={request!}
          saveRequest={onSaveRequest}
        />
        <Title>
          Unset variables
          <DescriptionTooltip>
            Enter values for these unset variables to 'Try' the Operation. Note that these values
            will not be persisted in the Scan configuration.
          </DescriptionTooltip>
        </Title>
        <Inputs>
          <Form
            wrapFormData={wrapEnvironment}
            unwrapFormData={unwrapEnvironment}
            data={inputs}
            saveData={(data) => setInputs(data)}
          >
            <Environment name="env" />
          </Form>
        </Inputs>
      </CollapsibleSection>

      {useGlobalBlocks && beforeExecutionResult?.status === "failure" && (
        <GlobalBlockError>
          <ErrorBanner message="Check Global Before block" />
        </GlobalBlockError>
      )}

      {useGlobalBlocks && afterExecutionResult?.status === "failure" && (
        <GlobalBlockError>
          <ErrorBanner message="Check Global After block" />
        </GlobalBlockError>
      )}

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

function wrapEnvironment(env: UnknownEnvironment) {
  return {
    env: Object.entries(env).map(([key, value]) => ({ key, value, type: typeof value })),
  };
}

function unwrapEnvironment(data: any): UnknownEnvironment {
  const env: UnknownEnvironment = {};
  for (const { key, value, type } of data.env) {
    env[key] = convertToType(value, type);
  }
  return env;
}

function convertToType(value: string, type: string): unknown {
  if (type !== "string") {
    try {
      return JSON.parse(value);
    } catch (e) {
      // failed to convert, return string value
      return value;
    }
  }
  return `${value}`;
}

const Inputs = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
  background-color: var(${ThemeColorVariables.background});
`;

const Title = styled.div`
  display: flex;
  padding-top: 12px;
  padding-bottom: 12px;
  font-weight: 600;
  gap: 8px;
  cursor: pointer;
  align-items: center;
`;

const GlobalBlockError = styled.div`
  margin-top: 8px;
  margin-bottom: 8px;
`;

function getVariableNamesFromEnvStack(env: PlaybookEnvStack): string[] {
  const variables: string[] = [];
  for (const entry of env) {
    for (const name of Object.keys(entry.env)) {
      if (!variables.includes(name)) {
        variables.push(name);
      }
    }
  }
  variables.sort();
  return variables;
}
