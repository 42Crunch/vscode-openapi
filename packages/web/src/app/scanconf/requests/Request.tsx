import { SimpleEnvironment } from "@xliic/common/env";
import * as playbook from "@xliic/common/playbook";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useState } from "react";
import styled from "styled-components";
import Environment from "../components/scenario/Environment";
import RequestCard from "../components/scenario/RequestCard";
import { PlaybookEnvStack } from "../../../core/playbook/playbook-env";
import { replaceEnvVariables } from "../../../core/playbook/replace";
import Form from "../components/Form";
import { saveRequest } from "../slice";
import { executeRequest } from "./slice";
import { useAppDispatch, useAppSelector } from "../store";
import CollapsibleSection from "../components/CollapsibleSection";
import ResponseCard from "../components/scenario/ResponseCard";
import Servers from "./Servers";
import { setTryitServer } from "../../../features/prefs/slice";
import { BundledSwaggerOrOasSpec, getServerUrls } from "@xliic/common/openapi";
import { RequestRef } from "@xliic/common/playbook";

export default function Request({ requestRef }: { requestRef: RequestRef }) {
  const dispatch = useAppDispatch();

  const { oas, playbook, servers } = useAppSelector((state) => state.scanconf);

  const result = useAppSelector((state) => state.requests.result);

  const onRun = (server: string, env: SimpleEnvironment) =>
    dispatch(executeRequest({ server, env }));

  const onSaveRequest = (stage: playbook.StageContent) =>
    dispatch(saveRequest({ ref: requestRef, stage }));

  const request =
    requestRef.type === "operation"
      ? playbook.operations[requestRef.id].request
      : playbook.requests?.[requestRef.id];

  const credentials = playbook.authenticationDetails[0];

  const requiredCredentials = request?.auth?.map((name) => {
    const credential = credentials[name];
    if (credential) {
      return credential.methods[credential.default].credential;
    }
  });

  const random = Math.floor(Math.random() * 10000000);

  const env: PlaybookEnvStack = [
    {
      id: "functions",
      env: {
        $random: `${random}`,
      },
      assignments: [],
    },
  ];

  const replacements = replaceEnvVariables(request, [...env]);
  const authReplacements = replaceEnvVariables(requiredCredentials || {}, [...env]);

  const missing = [...new Set([...replacements.missing, ...authReplacements.missing])];

  const inputs: SimpleEnvironment = {};
  for (const name of missing) {
    inputs[name] = "";
  }

  const [inputEnv, setInputEnv] = useState(inputs);

  const response = result.scenario?.results?.[0];

  const setServer = (server: string) => dispatch(setTryitServer(server));

  const prefs = useAppSelector((state) => state.prefs);

  const server = getPreferredServer(oas, prefs.tryitServer);

  const [isRequestOpen, setRequestOpen] = useState(true);
  const [isResponseOpen, setResponseOpen] = useState(true);

  return (
    <Container>
      <Servers
        servers={servers}
        selected={server}
        onStart={(server: string) => onRun(server, inputEnv)}
        onChange={setServer}
      />
      <CollapsibleSection
        isOpen={isRequestOpen}
        onClick={() => setRequestOpen(!isRequestOpen)}
        title="Request"
      >
        <RequestCard
          defaultCollapsed={false}
          oas={oas}
          credentials={credentials}
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
            <Environment name="env" />
          </Form>
        </Inputs>
      </CollapsibleSection>
      <CollapsibleSection
        isOpen={isResponseOpen}
        onClick={() => setResponseOpen(!isResponseOpen)}
        title="Response"
      >
        {response && <ResponseCard defaultCollapsed={false} response={response} />}
      </CollapsibleSection>
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
