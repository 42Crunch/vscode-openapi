import { Action, TypedStartListening } from "@reduxjs/toolkit";

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

import { PlaybookExecutorStep } from "../../core/playbook/playbook";
import { PlaybookEnvStack } from "../../core/playbook/playbook-env";
import { sendHttpRequest } from "../../features/http-client/slice";

import { addTryExecutionStep, resetTryExecution, startTryExecution } from "./tests/slice";

import { AppDispatch, RootState } from "./store";
import { webappHttpClient } from "../../core/http-client/webapp-client";
import { testPlaybook } from "../../core/playbook/test";
import { SuiteConfiguration } from "../../core/playbook/identity-tests/types";
import basic from "../../core/playbook/identity-tests/basic";
import { HookExecutorStep } from "../../core/playbook/playbook-tests";

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
      effect: async ({ payload: { server, suiteId } }, listenerApi) => {
        const {
          prefs: { rejectUnauthorized },
          tests: { config },
          config: {
            data: { scanProxy },
          },
        } = listenerApi.getState();

        const suiteConfig = config[suiteId!];

        listenerApi.dispatch(resetTryExecution({ suiteId }));

        await execute(
          listenerApi.getState(),
          webappHttpClient(
            { https: { rejectUnauthorized, proxy: scanProxy } },
            (id: string, request: HttpRequest, config: HttpConfig) =>
              listenerApi.dispatch(sendHttpRequest({ id, request, config }))
          ),
          listenerApi.dispatch,
          addTryExecutionStep,
          server,
          suiteConfig
        );
      },
    });
}

async function execute(
  state: {
    scanconf: { oas: BundledSwaggerOrOasSpec; playbook: Playbook.Bundle };
    env: { data: EnvData };
  },
  httpClient: HttpClient,
  dispatch: (action: Action) => void,
  addExecutionStepAction: (action: {
    testId: string;
    step: PlaybookExecutorStep | HookExecutorStep;
  }) => Action,
  server: string,
  suiteConfig: SuiteConfiguration,
  extraEnv: PlaybookEnvStack = []
) {
  testPlaybook(
    httpClient,
    state.scanconf.oas,
    server,
    state.scanconf.playbook,
    state.env.data,
    extraEnv,
    basic,
    suiteConfig,
    dispatch,
    addExecutionStepAction
  );
}
