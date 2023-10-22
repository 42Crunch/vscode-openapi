import { SimpleEnvironment } from "@xliic/common/env";
import { BundledSwaggerOrOasSpec, getServerUrls } from "@xliic/common/openapi";
import * as playbook from "@xliic/common/playbook";
import { RequestRef } from "@xliic/common/playbook";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { PlaybookEnvStack } from "../../../core/playbook/playbook-env";
import { setTryitServer } from "../../../features/prefs/slice";
import Form from "../../../new-components/Form";
import CollapsibleSection from "../components/CollapsibleSection";
import Execution from "../components/execution/Execution";
import Environment from "../components/scenario/Environment";
import RequestCard from "../components/scenario/RequestCard";
import { saveRequest } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import Servers from "./Servers";
import { executeRequest } from "./slice";

export default function RequestInternal({
  request,
  requestRef,
}: {
  request: playbook.StageContent;
  requestRef: RequestRef;
}) {
  const dispatch = useAppDispatch();

  const { oas, playbook, servers } = useAppSelector((state) => state.scanconf);

  const {
    tryResult,
    mockResult,
    mockMissingVariables: missingVariables,
  } = useAppSelector((state) => state.requests);

  const onRun = (server: string, inputs: SimpleEnvironment) =>
    dispatch(executeRequest({ server, inputs }));

  const onSaveRequest = (stage: playbook.StageContent) =>
    dispatch(saveRequest({ ref: requestRef, stage }));

  const credentials = playbook.authenticationDetails[0];

  const variables = getVariableNamesFromEnvStack(
    mockResult?.[0]?.results?.[0]?.variablesReplaced?.stack || []
  );

  const [inputs, setInputs] = useState<SimpleEnvironment>({});

  const setServer = (server: string) => dispatch(setTryitServer(server));

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
      <Servers
        servers={servers}
        selected={server}
        onStart={(server: string) => onRun(server, inputs)}
        onChange={setServer}
      />
      <CollapsibleSection title="Request">
        <RequestCard
          defaultCollapsed={false}
          oas={oas}
          credentials={credentials}
          availableVariables={variables}
          requestVariables={[]}
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
            saveData={(data) => setInputs(data)}
          >
            <Environment name="env" variables={[]} names={[]} />
          </Form>
        </Inputs>
      </CollapsibleSection>

      {tryResult.length > 0 && (
        <CollapsibleSection title="Result">
          <Execution result={tryResult} />
        </CollapsibleSection>
      )}
    </Container>
  );
}

const Container = styled.div`
  padding: 8px;
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
