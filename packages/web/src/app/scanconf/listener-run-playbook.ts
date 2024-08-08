import { Action, TypedStartListening, isAnyOf } from "@reduxjs/toolkit";

import { EnvData } from "@xliic/common/env";
import {
  HttpClient,
  HttpConfig,
  HttpError,
  HttpRequest,
  HttpResponse,
  SendHttpRequestMessage,
  ShowHttpErrorMessage,
  ShowHttpResponseMessage,
} from "@xliic/common/http";
import { Webapp } from "@xliic/common/message";
import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";
import { Result } from "@xliic/result";

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
import { goTo } from "../../features/router/slice";
import { sendHttpRequest } from "../../features/http-client/slice";

import {
  addMockAuthRequestsExecutionStep,
  addTryAuthenticationStep,
  resetMockAuthRequestsExecution,
  resetTryAuthentication,
  startTryAuthentication,
} from "./auth/slice";
import {
  addMockGlobalStep,
  addTryGlobalStep,
  resetMockGlobal,
  resetTryGlobal,
  selectGlobal,
  startTryGlobal,
} from "./global/slice";
import {
  addMockOperationExecutionStep,
  addTryExecutionStep,
  resetMockOperationExecution,
  resetTryExecution,
  setOperationId,
  setScenarioId,
  startTryExecution,
} from "./operations/slice";
import {
  addExecutionStep,
  addMockRequestExecutionStep,
  executeRequest,
  resetExecuteRequest,
  resetMockRequestExecution,
  setRequestId,
} from "./requests/slice";
import {
  addStage,
  moveStage,
  removeStage,
  saveOperationReference,
  saveRequest,
  selectCredential,
  selectSubcredential,
} from "./slice";
import { AppDispatch, RootState } from "./store";
import { webappHttpClient } from "../../core/http-client/webapp-client";

type AppStartListening = TypedStartListening<RootState, AppDispatch>;

type HttpCapableWebappHost = Webapp<
  ShowHttpErrorMessage | ShowHttpResponseMessage,
  SendHttpRequestMessage
>["host"];

export function onMockExecuteScenario(
  startAppListening: AppStartListening,
  host: HttpCapableWebappHost
) {
  return () =>
    startAppListening({
      matcher: isAnyOf(
        goTo,
        setOperationId,
        setScenarioId,
        saveOperationReference,
        addStage,
        moveStage,
        removeStage
      ),
      effect: async (action, listenerApi) => {
        const {
          scanconf: {
            playbook: { before, after, operations },
          },
          operations: { scenarioId, operationId },
          router: {
            current: [parent, page],
          },
        } = listenerApi.getState();

        if (parent !== "scanconf" || page !== "operations" || operationId === undefined) {
          return;
        }

        listenerApi.cancelActiveListeners();
        await listenerApi.delay(1000);

        const operation = operations[operationId!];

        const playbooks: PlaybookList = [
          { name: "before", requests: before },
          { name: "operationBefore", requests: operation.before },
          { name: "operationScenarios", requests: operation.scenarios[scenarioId].requests },
          { name: "operationAfter", requests: operation.after },
          { name: "after", requests: after },
        ].filter((playbook) => playbook.requests.length > 0);

        await execute(
          listenerApi.getState(),
          mockHttpClient(),
          listenerApi.dispatch,
          resetMockOperationExecution,
          addMockOperationExecutionStep,
          playbooks,
          "http://localhost"
        );
      },
    });
}

export function onMockExecuteRequest(
  startAppListening: AppStartListening,
  host: HttpCapableWebappHost
) {
  return () =>
    startAppListening({
      matcher: isAnyOf(goTo, setRequestId, saveRequest),
      effect: async (action, listenerApi) => {
        const {
          requests: { ref },
          scanconf: {
            playbook: { before, after },
          },
          router: {
            current: [parent, page],
          },
          prefs: { useGlobalBlocks },
        } = listenerApi.getState();

        if (parent !== "scanconf" || page !== "requests") {
          return;
        }

        listenerApi.cancelActiveListeners();
        await listenerApi.delay(1000);

        await execute(
          listenerApi.getState(),
          mockHttpClient(),
          listenerApi.dispatch,
          resetMockRequestExecution,
          addMockRequestExecutionStep,
          [
            { name: "Global Before", requests: useGlobalBlocks ? before : [] },
            { name: "Request", requests: [{ ref: ref! }] },
            { name: "Global After", requests: useGlobalBlocks ? after : [] },
          ],
          "http://localhost"
        );
      },
    });
}

export function onMockExecuteAuthRequests(
  startAppListening: AppStartListening,
  host: HttpCapableWebappHost
) {
  return () =>
    startAppListening({
      matcher: isAnyOf(
        goTo,
        saveOperationReference,
        selectCredential,
        selectSubcredential,
        addStage,
        moveStage,
        removeStage
      ),
      effect: async (action, listenerApi) => {
        const {
          scanconf: {
            playbook,
            selectedCredentialGroup,
            selectedCredential,
            selectedSubcredential,
          },
          router: {
            current: [parent, page],
          },
        } = listenerApi.getState();

        if (parent !== "scanconf" || page !== "auth") {
          return;
        }

        listenerApi.cancelActiveListeners();
        await listenerApi.delay(1000);

        if (selectedCredential === undefined || selectedSubcredential === undefined) {
          return;
        }

        const subcredential =
          playbook?.authenticationDetails?.[selectedCredentialGroup]?.[selectedCredential]
            ?.methods?.[selectedSubcredential];

        if (
          subcredential === undefined ||
          subcredential.requests === undefined ||
          subcredential.requests.length === 0
        ) {
          return;
        }

        await execute(
          listenerApi.getState(),
          mockHttpClient(),
          listenerApi.dispatch,
          resetMockAuthRequestsExecution,
          addMockAuthRequestsExecutionStep,
          [{ name: "auth", requests: subcredential.requests }],
          "http://localhost"
        );
      },
    });
}

export function onMockExecuteGlobal(
  startAppListening: AppStartListening,
  host: HttpCapableWebappHost
) {
  return () =>
    startAppListening({
      matcher: isAnyOf(
        goTo,
        selectGlobal,
        addStage,
        moveStage,
        removeStage,
        saveOperationReference
      ),
      effect: async (action, listenerApi) => {
        const {
          scanconf: {
            playbook: { before, after },
          },
          global: { selected },
          router: {
            current: [parent, page],
          },
        } = listenerApi.getState();

        if (parent !== "scanconf" || page !== "global") {
          return;
        }

        listenerApi.cancelActiveListeners();
        await listenerApi.delay(1000);

        const playbooks =
          selected === "before"
            ? [{ name: "Global Before", requests: before }]
            : [{ name: "Global After", requests: after }];

        await execute(
          listenerApi.getState(),
          mockHttpClient(),
          listenerApi.dispatch,
          resetMockGlobal,
          addMockGlobalStep,
          playbooks,
          "http://localhost"
        );
      },
    });
}

export function onTryExecuteScenario(
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
        } = listenerApi.getState();

        const operation = operations[operationId!];

        const playbooks: PlaybookList = [
          { name: "Global Before", requests: useGlobalBlocks ? before : [] },
          { name: "Before", requests: operation.before },
          { name: "Scenario", requests: operation.scenarios[scenarioId].requests },
          { name: "After", requests: operation.after },
          { name: "Global After", requests: useGlobalBlocks ? after : [] },
        ].filter((playbook) => playbook.requests.length > 0);

        await execute(
          listenerApi.getState(),
          webappHttpClient(
            { https: { rejectUnauthorized } },
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

export function onExecuteAuthentication(
  startAppListening: AppStartListening,
  host: HttpCapableWebappHost
) {
  return () =>
    startAppListening({
      actionCreator: startTryAuthentication,
      effect: async ({ payload: server }, listenerApi) => {
        const {
          scanconf: { oas, playbook, selectedCredential, selectedSubcredential },
          env: { data: envenv },
          prefs: { rejectUnauthorized },
        } = listenerApi.getState();

        if (selectedCredential === undefined || selectedSubcredential === undefined) {
          return;
        }

        const env: PlaybookEnvStack = [getExternalEnvironment(playbook, envenv)];

        listenerApi.dispatch(resetTryAuthentication());
        listenerApi.dispatch(addTryAuthenticationStep({ event: "playbook-started", name: "" }));
        listenerApi.dispatch(addTryAuthenticationStep({ event: "request-started" }));
        for await (const step of executeAuth(
          createAuthCache(),
          webappHttpClient(
            { https: { rejectUnauthorized } },
            (id: string, request: HttpRequest, config: HttpConfig) =>
              listenerApi.dispatch(sendHttpRequest({ id, request, config }))
          ),
          oas,
          server,
          playbook,
          [`${selectedCredential}/${selectedSubcredential}`],
          env,
          0
        )) {
          listenerApi.dispatch(addTryAuthenticationStep(step));
        }
      },
    });
}

export function onExecuteRequest(
  startAppListening: AppStartListening,
  host: HttpCapableWebappHost
) {
  return () =>
    startAppListening({
      actionCreator: executeRequest,
      effect: async ({ payload: { inputs, server } }, listenerApi) => {
        const {
          requests: { ref },
          scanconf: {
            playbook: { before, after },
          },
          prefs: { useGlobalBlocks, rejectUnauthorized },
        } = listenerApi.getState();

        const playbooks: PlaybookList = [
          { name: "Global Before", requests: useGlobalBlocks ? before : [] },
          { name: "Request", requests: [{ ref: ref! }] },
          { name: "Global After", requests: useGlobalBlocks ? after : [] },
        ].filter((playbook) => playbook.requests.length > 0);

        await execute(
          listenerApi.getState(),
          webappHttpClient(
            { https: { rejectUnauthorized } },
            (id: string, request: HttpRequest, config: HttpConfig) =>
              listenerApi.dispatch(sendHttpRequest({ id, request, config }))
          ),
          listenerApi.dispatch,
          resetExecuteRequest,
          addExecutionStep,
          playbooks,
          server,
          [{ id: { type: "try-inputs" }, env: inputs, assignments: [] }]
        );
      },
    });
}

export function onExecuteGlobal(startAppListening: AppStartListening, host: HttpCapableWebappHost) {
  return () =>
    startAppListening({
      actionCreator: startTryGlobal,
      effect: async ({ payload: server }, listenerApi) => {
        const {
          scanconf: {
            playbook: { before, after },
          },
          global: { selected },
          prefs: { rejectUnauthorized },
        } = listenerApi.getState();

        const playbooks =
          selected === "before"
            ? [{ name: "Global Before", requests: before }]
            : [{ name: "Global After", requests: after }];

        await execute(
          listenerApi.getState(),
          webappHttpClient(
            { https: { rejectUnauthorized } },
            (id: string, request: HttpRequest, config: HttpConfig) =>
              listenerApi.dispatch(sendHttpRequest({ id, request, config }))
          ),
          listenerApi.dispatch,
          resetTryGlobal,
          addTryGlobalStep,
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
