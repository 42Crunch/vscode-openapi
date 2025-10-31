import { Action, TypedStartListening, isAnyOf } from "@reduxjs/toolkit";

import { EnvData } from "@xliic/common/env";
import {
  HttpClient,
  HttpConfig,
  HttpRequest,
  SendHttpRequestMessage,
  ShowHttpErrorMessage,
  ShowHttpResponseMessage,
} from "@xliic/common/http";
import { Webapp } from "@xliic/common/message";
import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";

import { createAuthCache } from "../../core/playbook/auth-cache";
import {
  PlaybookList,
  executeAllPlaybooks,
  executeAuth,
  getExternalEnvironment,
} from "../../core/playbook/execute";
import {
  mockHttpClient,
  MockHttpClient,
  MockHttpResponse,
} from "../../core/http-client/mock-client";
import { PlaybookExecutorStep } from "../../core/playbook/playbook";
import { PlaybookEnvStack } from "../../core/playbook/playbook-env";
import { sendHttpRequest } from "../../features/http-client/slice";

import { addTryExecutionStep, resetTryExecution, startTryExecution } from "./tests/slice";

import { AppDispatch, RootState } from "./store";
import { webappHttpClient } from "../../core/http-client/webapp-client";

type AppStartListening = TypedStartListening<RootState, AppDispatch>;

type HttpCapableWebappHost = Webapp<
  ShowHttpErrorMessage | ShowHttpResponseMessage,
  SendHttpRequestMessage
>["host"];

export function onTryExecuteTestSuite(
  startAppListening: AppStartListening,
  host: HttpCapableWebappHost
) {
  return () =>
    startAppListening({
      actionCreator: startTryExecution,
      effect: async ({ payload: server }, listenerApi) => {
        const {
          scanconf: {
            playbook: { before, after, operations },
          },
          operations: { scenarioId, operationId },
          prefs: { useGlobalBlocks, rejectUnauthorized },
          config: {
            data: { scanProxy },
          },
        } = listenerApi.getState();

        const playbooks: PlaybookList = [
          { name: "Global Before", requests: useGlobalBlocks ? before : [] },
          //{ name: "Before", requests: operation.before },
          //{ name: "Scenario", requests: operation.scenarios[scenarioId].requests },
          //{ name: "After", requests: operation.after },
          { name: "Global After", requests: useGlobalBlocks ? after : [] },
        ].filter((playbook) => playbook.requests.length > 0);

        await execute(
          listenerApi.getState(),
          webappHttpClient(
            { https: { rejectUnauthorized, proxy: scanProxy } },
            (id: string, request: HttpRequest, config: HttpConfig) =>
              listenerApi.dispatch(sendHttpRequest({ id, request, config }))
          ),
          listenerApi.dispatch,
          resetTryExecution,
          addTryExecutionStep,
          playbooks,
          server
        );
      },
    });
}

async function execute(
  state: {
    scanconf: { oas: BundledSwaggerOrOasSpec; playbook: Playbook.Bundle };
    env: { data: EnvData };
  },
  httpClient: HttpClient | MockHttpClient,
  dispatch: (action: Action) => void,
  resetAction: () => Action,
  addExecutionStepAction: (action: PlaybookExecutorStep) => Action,
  playbooks: PlaybookList,
  server: string,
  extraEnv: PlaybookEnvStack = []
) {
  dispatch(resetAction());
  for await (const step of executeAllPlaybooks(
    httpClient,
    state.scanconf.oas,
    server,
    state.scanconf.playbook,
    playbooks,
    state.env.data,
    extraEnv
  )) {
    dispatch(addExecutionStepAction(step));
  }
}
