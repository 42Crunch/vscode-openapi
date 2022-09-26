import { TryitSecurityValues, TryitSecurityValue } from "@xliic/common/messages/tryit";
import { SecretsForSecurity } from "@xliic/common/messages/prefs";
import { BundledOpenApiSpec } from "@xliic/common/oas30";

import { useAppDispatch, useAppSelector } from "../store/hooks";
import { sendRequest } from "../features/tryit/slice";
import { setTryitServer, setSecretForSecurity } from "../features/prefs/slice";

import Operation from "./operation/Operation";

import { getParameters, wrapFormDefaults, unwrapFormDefaults } from "../util";
import { makeHttpRequest } from "../core/http";

export default function TryOperation() {
  const dispatch = useAppDispatch();

  const { path, method, oas, defaultValues, tryitConfig } = useAppSelector((state) => state.tryit);
  const prefs = useAppSelector((state) => state.prefs);
  const env = useAppSelector((state) => state.env.data);

  const server = getPreferredServer(oas, prefs.tryitServer, defaultValues!.server);

  const updatedDefaults = {
    ...defaultValues!,
    server,
    security: updateSecurityWithPrefs(defaultValues!.security, prefs.security),
  };

  const parameters = getParameters(oas, path!, method!);

  const tryOperation = async (data: Record<string, any>) => {
    const values = unwrapFormDefaults(oas, parameters, data);
    const httpRequest = await makeHttpRequest(tryitConfig, oas, method!, path!, values, env);
    dispatch(setTryitServer(values.server));
    dispatch(sendRequest({ defaultValues: values, request: httpRequest }));
  };

  return (
    <>
      <Operation
        oas={oas}
        config={tryitConfig}
        path={path!}
        method={method!}
        defaultValues={wrapFormDefaults(updatedDefaults)}
        onSubmit={tryOperation}
        buttonText="Send"
      />
    </>
  );
}

function updateSecurityWithPrefs(
  security: TryitSecurityValues,
  prefs: SecretsForSecurity
): TryitSecurityValues {
  const result: TryitSecurityValues = [];
  for (const securityValue of security) {
    const updated: Record<string, TryitSecurityValue> = {};
    for (const [key, value] of Object.entries(securityValue)) {
      if (prefs[key] && typeof value === "string") {
        updated[key] = prefs[key];
      } else {
        updated[key] = value;
      }
    }
    result.push(updated);
  }
  return result;
}

function getPreferredServer(
  oas: BundledOpenApiSpec,
  preferredServer: string | undefined,
  defaultServer: string
): string {
  const exists = oas.servers?.some((server) => server.url === preferredServer);
  if (preferredServer !== undefined && preferredServer !== "" && exists) {
    return preferredServer;
  }
  return defaultServer;
}
