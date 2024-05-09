import { useEffect, useState } from "react";
import styled from "styled-components";

import { Environment as UnknownEnvironment } from "@xliic/common/env";
import { BundledSwaggerOrOasSpec, getServerUrls } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";
import { ThemeColorVariables } from "@xliic/common/theme";

import { DynamicVariableNames } from "../../../core/playbook/builtin-variables";
import { PlaybookEnvStack } from "../../../core/playbook/playbook-env";
import { FileExport } from "../../../icons";
import Form from "../../../new-components/Form";
import CollapsibleSection from "../components/CollapsibleSection";
import Execution from "../components/execution/Execution";
import Environment from "../components/environment/Environment";
import RequestCardExternal from "../components/scenario/RequestCardExternal";
import { saveRequest } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import { executeRequest } from "./slice";
import DescriptionTooltip from "../../../new-components/DescriptionTooltip";
import { findResult } from "../playbook-execution-handler";
import { ErrorBanner } from "../../../components/Banner";

export default function RequestExternal({
  request,
  requestRef,
}: {
  request: Playbook.ExternalStageContent;
  requestRef: Playbook.RequestRef;
}) {
  const { oas } = useAppSelector((state) => state.scanconf);
  const useGlobalBlocks = useAppSelector((state) => state.prefs.useGlobalBlocks);

  const {
    tryResult,
    mockResult,
    mockMissingVariables: missingVariables,
  } = useAppSelector((state) => state.requests);

  const dispatch = useAppDispatch();

  const onRun = (server: string, inputs: UnknownEnvironment) =>
    dispatch(executeRequest({ server, inputs }));

  const onSaveRequest = (stage: Playbook.ExternalStageContent) =>
    dispatch(saveRequest({ ref: requestRef, stage }));

  const beforeExecutionResult = findResult(mockResult, "Global Before");
  const afterExecutionResult = findResult(mockResult, "Global After");
  const requestResult = findResult(mockResult, "Request");

  const variables = [
    ...DynamicVariableNames,
    ...getVariableNamesFromEnvStack(requestResult?.results?.[0]?.variablesReplaced?.stack || []),
  ];

  const [inputs, setInputs] = useState<UnknownEnvironment>({});

  const prefs = useAppSelector((state) => state.prefs);

  const server = getPreferredServer(oas, prefs.tryitServer);

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
      <Try>
        <Action
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRun(server, inputs);
          }}
        >
          <FileExport />
          Try
        </Action>
      </Try>

      <CollapsibleSection title="Request">
        <RequestCardExternal
          defaultCollapsed={false}
          variables={variables}
          requestRef={requestRef}
          stage={request!}
          saveRequest={onSaveRequest}
        />
        <Title>
          Unset variables
          <DescriptionTooltip>
            <h4>Unset variables in the Operation.</h4>
            <p>
              In certain cases, you might want to use variables which do not have a value in a
              context of a specific Operation. These might be useful, for example, when you intend
              to use this Operation in multiple Scenarios, each of which might provide a different
              set of values through its Environment.
            </p>
            <p>
              However, if the Operation contains an unset variable, you cannot use the 'Try' feature
              to test the Operation unless you provide a value for it.
            </p>
            <p>
              These inputs enumerate the unset variables and can be used to provide values for them.
            </p>
            <p>Please note that test inputs are not saved to the scan configuration.</p>
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
          <ErrorBanner message="Global Before block failed" />
        </GlobalBlockError>
      )}

      {useGlobalBlocks && afterExecutionResult?.status === "failure" && (
        <GlobalBlockError>
          <ErrorBanner message="Global After block failed" />
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

const Try = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
  display: flex;
  justify-content: flex-end;
`;

const Action = styled.div`
  display: flex;
  padding: 8px 12px;
  gap: 4px;
  cursor: pointer;
  align-items: center;
  cusror: pointer;
  color: var(${ThemeColorVariables.linkForeground});
  > svg {
    fill: var(${ThemeColorVariables.linkForeground});
  }
`;

const GlobalBlockError = styled.div`
  margin-top: 8px;
  margin-bottom: 8px;
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

function getPreferredServer(
  oas: BundledSwaggerOrOasSpec,
  preferredServer: string | undefined
): string {
  const servers = getServerUrls(oas);

  const exists = servers.some((url) => url === preferredServer);
  if (preferredServer !== undefined && preferredServer !== "" && exists) {
    return preferredServer;
  }
  return servers[0];
}

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
