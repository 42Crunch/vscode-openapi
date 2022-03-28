import { useAppDispatch, useAppSelector } from "../store/hooks";
import { sendRequest } from "../store/oasSlice";

import Operation from "./Operation";
import { HttpMethod, HttpRequest } from "@xliic/common/http";
import { OperationValues } from "@xliic/common/messages/tryit";

import { getParameters, wrapFormDefaults, unwrapFormDefaults } from "../util";

export default function TryOperation() {
  const dispatch = useAppDispatch();
  const { path, method, oas, defaultValues } = useAppSelector((state) => state.oas);

  const parameters = getParameters(oas, path!, method!);

  const tryOperation = (data: Record<string, any>) => {
    const values = unwrapFormDefaults(oas, parameters, data);
    const httpRequest = makeHttpRequest(method!, path!, values);
    dispatch(sendRequest({ defaultValues: values, request: httpRequest }));
  };

  return (
    <>
      <Operation
        oas={oas}
        path={path!}
        method={method!}
        defaultValues={wrapFormDefaults(defaultValues!)}
        onSubmit={tryOperation}
        buttonText="Try It"
      />
    </>
  );
}

function makeHttpRequest(method: HttpMethod, path: string, values: OperationValues): HttpRequest {
  const url = makeUrl(values.server, path, values?.parameters?.path);

  const headers: Record<string, string> = {};
  let body: unknown | undefined = undefined;

  if (values.body) {
    headers["content-type"] = values.body.mediaType;
    headers["accept"] = values.body.mediaType;
    if (values.body.mediaType === "application/json") {
      body = JSON.stringify(values.body.value);
    } else {
      body = values.body.value;
    }
  }

  // FIXME add query string handling
  // FIXME add cookie params handling

  return {
    method,
    url,
    headers: { ...headers, ...(values.parameters?.header as HttpRequest["headers"]) },
    body,
  };
}

function makeUrl(host: string, path: string, pathParameters?: Record<string, any>): string {
  const trimmedHost = host.endsWith("/") ? host.slice(0, -1) : host;
  const substitutedPath = pathParameters ? substitutePathParams(path, pathParameters) : path;
  return trimmedHost + substitutedPath;
}

function substitutePathParams(path: string, pathParameters: Record<string, any>) {
  let substituted = path;
  for (const [name, value] of Object.entries(pathParameters)) {
    substituted = substituted.replaceAll(`{${name}}`, value as string);
  }
  return substituted;
}
