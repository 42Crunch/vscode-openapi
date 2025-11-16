import { Action, isAnyOf, TypedStartListening } from "@reduxjs/toolkit";

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
import { configure } from "../../core/playbook/identity-tests";

import {
  addTryExecutionTest,
  addTryExecutionStep,
  resetTryExecution,
  startTryExecution,
  updateTestConfig,
} from "./tests/slice";

import { AppDispatch, RootState } from "./store";
import { webappHttpClient } from "../../core/http-client/webapp-client";
import { testPlaybook } from "../../core/playbook/test";
import { SuiteConfig } from "../../core/playbook/identity-tests/types";
import { SuiteId } from "../../core/playbook/identity-tests/index";
import basic from "../../core/playbook/identity-tests/basic";
import { HookExecutorStep } from "../../core/playbook/playbook-tests";
import { loadPlaybook } from "./actions";
import { loadVault } from "../../features/vault/slice";

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

        const suiteConfig = config[suiteId as SuiteId];

        listenerApi.dispatch(resetTryExecution({ suiteId }));

        await execute(
          listenerApi.getState(),
          webappHttpClient(
            { https: { rejectUnauthorized, proxy: scanProxy } },
            (id: string, request: HttpRequest, config: HttpConfig) =>
              listenerApi.dispatch(sendHttpRequest({ id, request, config }))
          ),
          listenerApi.dispatch,
          addTryExecutionTest,
          addTryExecutionStep,
          server,
          suiteConfig
        );
      },
    });
}

export function onUpdateVaultOrPlaybook(
  startAppListening: AppStartListening,
  host: HttpCapableWebappHost
) {
  return () =>
    startAppListening({
      matcher: isAnyOf(loadPlaybook, loadVault),

      effect: async (action, listenerApi) => {
        const {
          scanconf: { oas, playbook },
          vault: { data: vault },
        } = listenerApi.getState();

        const config = configure(oas, playbook, vault);

        listenerApi.dispatch(updateTestConfig(config));
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
  addTestExecutionAction: (action: { testId: string }) => Action,
  addStepExecutionAction: (action: {
    testId: string;
    stageId: string;
    step: PlaybookExecutorStep | HookExecutorStep;
  }) => Action,
  server: string,
  suiteConfig: SuiteConfig,
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
    addTestExecutionAction,
    addStepExecutionAction
  );
}
