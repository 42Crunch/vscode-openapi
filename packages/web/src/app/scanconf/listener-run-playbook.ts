import { TypedStartListening, isAnyOf } from "@reduxjs/toolkit";
import {
  HttpError,
  HttpRequest,
  HttpResponse,
  SendHttpRequestMessage,
  ShowHttpErrorMessage,
  ShowHttpResponseMessage,
} from "@xliic/common/http";
import { Webapp } from "@xliic/common/message";
import { Stage } from "@xliic/common/playbook";
import { Result } from "@xliic/common/result";
import { executeAllPlaybooks } from "../../core/playbook/execute";
import { MockHttpClient, MockHttpResponse } from "../../core/playbook/mock-http";
import { PlaybookEnvStack } from "../../core/playbook/playbook-env";
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
  executeRequest,
  addExecutionStep,
  setRequestId,
  addMockRequestExecutionStep,
  resetMockRequestExecution,
} from "./requests/slice";
import { AppDispatch, RootState } from "./store";
import { addStage, moveStage, saveEnvironment, saveOperationReference, saveRequest } from "./slice";
import { showScanconfOperation } from "./actions";
import { createDynamicVariables } from "../../core/playbook/builtin-variables";
import { goTo } from "../../features/router/slice";

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
        setOperationId,
        setScenarioId,
        addStage,
        moveStage,
        saveOperationReference,
        saveRequest,
        showScanconfOperation
      ),
      effect: async (action, listenerApi) => {
        const {
          scanconf: { oas, playbook },
          operations: { scenarioId, operationId },
          env: { data: envData },
        } = listenerApi.getState();

        const before = playbook.before;
        const after = playbook.after;

        const operation = playbook.operations[operationId!];

        const mockHttpClient: MockHttpClient = async () => [MockHttpResponse, undefined];

        const env: PlaybookEnvStack = [createDynamicVariables()];

        const playbooks: [string, Stage[]][] = [];

        if (before.length > 0) {
          playbooks.push(["Global Before", before]);
        }

        if (operation.before.length > 0) {
          playbooks.push(["Before", operation.before]);
        }

        playbooks.push(["Scenario", operation.scenarios[scenarioId].requests]);

        if (operation.after.length > 0) {
          playbooks.push(["After", operation.after]);
        }

        if (after.length > 0) {
          playbooks.push(["Global After", after]);
        }

        console.log("mock running playbook from listener");
        listenerApi.dispatch(resetMockOperationExecution());
        for await (const step of executeAllPlaybooks(
          mockHttpClient,
          oas,
          "http://localhost", // doesn't matter
          playbook,
          envData,
          env,
          playbooks
        )) {
          listenerApi.dispatch(addMockOperationExecutionStep(step));
        }
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
          scanconf: { oas, playbook },
          env: { data: envData },
          requests: { ref },
          router: {
            current: [page],
          },
        } = listenerApi.getState();

        if (page !== "requests") {
          return;
        }

        const mockHttpClient: MockHttpClient = async () => [MockHttpResponse, undefined];

        const env: PlaybookEnvStack = [createDynamicVariables()];

        const playbooks: [string, Stage[]][] = [["", [{ ref: ref! }]]];

        console.log("mock request running playbook from listener");
        listenerApi.dispatch(resetMockRequestExecution());
        for await (const step of executeAllPlaybooks(
          mockHttpClient,
          oas,
          "http://localhost", // doesn't matter
          playbook,
          envData,
          env,
          playbooks
        )) {
          listenerApi.dispatch(addMockRequestExecutionStep(step));
        }
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
          scanconf: { oas, playbook },
          operations: { scenarioId, operationId },
          env: { data: envData },
        } = listenerApi.getState();

        const before = playbook.before;
        const after = playbook.after;

        const operation = playbook.operations[operationId!];

        const send = makeSend(host);
        const receive = makeReceive(listenerApi.take);
        const httpClient = makeHttpClient(send, receive);

        const env: PlaybookEnvStack = [createDynamicVariables()];

        const playbooks: [string, Stage[]][] = [];

        if (before.length > 0) {
          playbooks.push(["Global Before", before]);
        }

        if (operation.before.length > 0) {
          playbooks.push(["Before", operation.before]);
        }

        playbooks.push(["Scenario", operation.scenarios[scenarioId].requests]);

        if (operation.after.length > 0) {
          playbooks.push(["After", operation.after]);
        }

        if (after.length > 0) {
          playbooks.push(["Global After", after]);
        }

        console.log("try running playbook from listener");
        listenerApi.dispatch(resetTryExecution());
        for await (const step of executeAllPlaybooks(
          httpClient,
          oas,
          server,
          playbook,
          envData,
          env,
          playbooks
        )) {
          listenerApi.dispatch(addTryExecutionStep(step));
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
      effect: async (action, listenerApi) => {
        const {
          scanconf: { oas, playbook },
          requests: { ref },
          env: { data: envData },
        } = listenerApi.getState();

        const { inputs, server } = action.payload;

        const send = makeSend(host);
        const receive = makeReceive(listenerApi.take);
        const httpClient = makeHttpClient(send, receive);

        const env: PlaybookEnvStack = [
          createDynamicVariables(),
          {
            id: "inputs",
            env: inputs,
            assignments: [],
          },
        ];

        console.log("running request from listener");

        // FIXME allow running request from requests
        for await (const step of executeAllPlaybooks(
          httpClient,
          oas,
          server,
          playbook,
          envData,
          env,
          [
            [
              "",
              [
                {
                  ref: ref!,
                },
              ],
            ],
          ]
        )) {
          listenerApi.dispatch(addExecutionStep(step));
        }
        console.log("done running from listener");
      },
    });
}

function makeSend(host: HttpCapableWebappHost) {
  const send = (request: HttpRequest) => {
    const id = window.crypto.randomUUID();
    host.postMessage({
      command: "sendHttpRequest",
      payload: {
        request,
        id,
        config: {
          https: {
            rejectUnauthorized: false,
          },
        },
      },
    });
    return id;
  };
  return send;
}

function makeReceive(take: (pattern: any) => any) {
  return async (id: string): Promise<Result<HttpResponse, HttpError>> => {
    const [action] = await take((action: any, currentState: any) => {
      return (
        (action.type === "http/showHttpResponse" || action.type === "http/showHttpError") &&
        action?.payload?.id === id
      );
    });
    if (action.type === "http/showHttpResponse") {
      return [action.payload.response, undefined];
    } else {
      return [undefined, action.payload.error];
    }
  };
}

function makeHttpClient(
  send: (request: HttpRequest) => string,
  receive: (id: string) => Promise<Result<HttpResponse, HttpError>>
) {
  return async function httpClient(request: HttpRequest): Promise<Result<HttpResponse, HttpError>> {
    const id = send(request);
    const received = await receive(id);
    return received;
  };
}
