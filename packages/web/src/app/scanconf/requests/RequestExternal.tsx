import { SimpleEnvironment } from "@xliic/common/env";
import * as playbook from "@xliic/common/playbook";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useState } from "react";
import styled from "styled-components";
import Environment from "../components/scenario/Environment";
import { PlaybookEnvStack } from "../../../core/playbook/playbook-env";
import { replaceEnvVariables } from "../../../core/playbook/replace";
import Form from "../../../new-components/Form";
import { saveRequest } from "../slice";
import { executeRequest } from "./slice";
import { useAppDispatch, useAppSelector } from "../store";
import CollapsibleSection from "../components/CollapsibleSection";
import ResponseCard from "../components/scenario/ResponseCard";
import Servers from "./Servers";
import { setTryitServer } from "../../../features/prefs/slice";
import { BundledSwaggerOrOasSpec, getServerUrls } from "@xliic/common/openapi";
import { RequestRef } from "@xliic/common/playbook";
import { makeEnvEnv } from "../../../core/playbook/execute";
import { createDynamicVariables } from "../../../core/playbook/builtin-variables";
import RequestCardExternal from "../components/scenario/RequestCardExternal";
import { FileExport } from "../../../icons";

export default function RequestExternal({
  request,
  requestRef,
}: {
  request: playbook.ExternalStageContent;
  requestRef: RequestRef;
}) {
  const dispatch = useAppDispatch();

  const { oas, playbook } = useAppSelector((state) => state.scanconf);

  const result = useAppSelector((state) => state.requests.result);

  const onRun = (server: string, env: SimpleEnvironment) =>
    dispatch(executeRequest({ server, env }));

  const onSaveRequest = (stage: playbook.ExternalStageContent) =>
    dispatch(saveRequest({ ref: requestRef, stage }));

  const env: PlaybookEnvStack = [createDynamicVariables()];

  const eenv = useAppSelector((state) => state.env.data);
  const [scanenv, scanenvError] = makeEnvEnv(playbook.environments["default"], eenv);
  if (scanenvError === undefined) {
    env.push(scanenv[0]);
  }

  const replacements = replaceEnvVariables(request, [...env]);

  const missing = [...new Set([...replacements.missing])];

  const variables = getVariableNamesFromEnvStack(env);

  for (const entry of env) {
    for (const name of Object.keys(entry.env)) {
      if (!variables.includes(name)) {
        variables.push(name);
      }
    }
  }

  const inputs: SimpleEnvironment = {};
  for (const name of missing) {
    inputs[name] = "";
  }

  const [inputEnv, setInputEnv] = useState(inputs);

  const response = result.operationScenarios?.results?.[0];

  const prefs = useAppSelector((state) => state.prefs);

  const server = getPreferredServer(oas, prefs.tryitServer);

  const [isRequestOpen, setRequestOpen] = useState(true);
  const [isResponseOpen, setResponseOpen] = useState(true);

  return (
    <Container>
      <Try>
        <Action
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRun(server, inputEnv);
          }}
        >
          <FileExport />
          Try
        </Action>
      </Try>
      <CollapsibleSection
        isOpen={isRequestOpen}
        onClick={() => setRequestOpen(!isRequestOpen)}
        title="Request"
      >
        <RequestCardExternal
          defaultCollapsed={false}
          variables={variables}
          requestRef={requestRef}
          stage={request!}
          saveRequest={onSaveRequest}
        />
        <Title>Required variables</Title>
        <Inputs>
          <Form
            wrapFormData={wrapEnvironment}
            unwrapFormData={unwrapEnvironment}
            data={inputs}
            saveData={(data) => setInputEnv(data)}
          >
            <Environment name="env" variables={variables} />
          </Form>
        </Inputs>
      </CollapsibleSection>
      {response && (
        <CollapsibleSection
          isOpen={isResponseOpen}
          onClick={() => setResponseOpen(!isResponseOpen)}
          title="Result"
        >
          <ResponseCard defaultCollapsed={false} response={response} />
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

function wrapEnvironment(env: SimpleEnvironment) {
  return {
    env: Object.entries(env).map(([key, value]) => ({ key, value })),
  };
}

function unwrapEnvironment(data: any): SimpleEnvironment {
  const env: SimpleEnvironment = {};
  for (const { key, value } of data.env) {
    env[key] = value;
  }
  return env;
}

const Inputs = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
  margin: 8px;
`;

const Title = styled.div`
  display: flex;
  padding: 8px;
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