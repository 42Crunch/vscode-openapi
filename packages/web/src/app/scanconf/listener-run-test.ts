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
import { Vault } from "@xliic/common/vault";

import { PlaybookEnvStack } from "../../core/playbook/playbook-env";
import { sendHttpRequest } from "../../features/http-client/slice";
import { configure } from "../../core/playbook-tests";

import {
  resetTryExecution,
  startTryExecution,
  addTryExecutionStep,
  updateTestConfig,
} from "./tests/slice";

import { AppDispatch, RootState } from "./store";
import { webappHttpClient } from "../../core/http-client/webapp-client";
import { testPlaybook } from "../../core/playbook-tests/test";
import type { SuiteConfig, SuiteId } from "../../core/playbook-tests";
import basic from "../../core/playbook-tests/basic";
import { loadPlaybook } from "./actions";
import { loadVault } from "../../features/vault/slice";
import { PlaybookExecutorStep } from "../../core/playbook/playbook";

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

        console.log("Updating test config due to vault or playbook change");
        const config = await configure(oas, playbook, vault);
        console.log("New test config:", config);

        listenerApi.dispatch(updateTestConfig(config));
      },
    });
}

async function execute(
  state: {
    scanconf: { oas: BundledSwaggerOrOasSpec; playbook: Playbook.Bundle };
    env: { data: EnvData };
    vault: { data: Vault };
  },
  httpClient: HttpClient,
  dispatch: (action: Action) => void,
  addStepExecutionAction: (action: {
    testId: string;
    stageId: string;
    step: PlaybookExecutorStep;
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
    state.vault.data,
    state.env.data,
    extraEnv,
    basic,
    suiteConfig,
    dispatch,
    addStepExecutionAction
  );
}
