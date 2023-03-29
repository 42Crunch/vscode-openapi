import { useForm, FormProvider } from "react-hook-form";

import { TryitSecurityAllValues, TryitSecurityValue } from "@xliic/common/tryit";
import { SecretsForSecurity } from "@xliic/common/prefs";
import { BundledSwaggerOrOasSpec, getServerUrls } from "@xliic/common/openapi";

import { useAppDispatch, useAppSelector } from "./store";
import { sendHttpRequest, showGeneralError } from "./slice";
import { setTryitServer, setSecretForSecurity } from "../../features/prefs/slice";

import Operation from "../../components/operation/Operation";
import OperationHeader from "../../components/operation/OperationHeader";

import { wrapFormDefaults, unwrapFormDefaults } from "../../util";
import { makeHttpRequest } from "../../core/http";
import Settings from "./Settings";

import Response from "./Response";
import HttpError from "./HttpError";
import GeneralError from "./GeneralError";
import Section from "../../components/Section";
import { useEffect, useState } from "react";

export default function TryOperation() {
  const dispatch = useAppDispatch();

  const { path, method, oas, defaultValues, tryitConfig, response, waiting } = useAppSelector(
    (state) => state.tryit
  );
  const prefs = useAppSelector((state) => state.prefs);
  const env = useAppSelector((state) => state.env.data);

  const server = getPreferredServer(oas, prefs.tryitServer, defaultValues!.server);

  const updatedDefaults = {
    ...defaultValues!,
    server,
    security: updateSecurityWithPrefs(defaultValues!.security, prefs.security),
  };

  const values = wrapFormDefaults(updatedDefaults);

  const tryOperation = async (data: Record<string, any>) => {
    const values = unwrapFormDefaults(data);
    try {
      const httpRequest = await makeHttpRequest(tryitConfig, oas, method!, path!, values, env);
      const security = values.security[values.securityIndex];
      if (security) {
        for (const [scheme, value] of Object.entries(security)) {
          if (typeof value === "string" && value.startsWith("{{") && value.endsWith("}}")) {
            dispatch(setSecretForSecurity({ scheme, secret: value }));
          }
        }
      }
      dispatch(setTryitServer(values.server));
      dispatch(sendHttpRequest({ defaultValues: values, request: httpRequest }));
    } catch (ex) {
      dispatch(
        showGeneralError({
          message: `Failed to build HTTP Request: ${ex}`,
        })
      );
    }
  };

  const [requestCollapsed, setRequestCollapsed] = useState(false);

  useEffect(() => {
    setRequestCollapsed(response !== undefined);
  }, [response]);

  const methods = useForm({
    reValidateMode: "onChange",
    values: values,
  });

  const { handleSubmit, formState } = methods;

  const hasErrors = Object.keys(formState.errors || {}).length > 0;

  return (
    <>
      <FormProvider {...methods}>
        <OperationHeader
          method={method!}
          path={path!}
          servers={getServerUrls(oas)}
          onSubmit={handleSubmit(tryOperation)}
          buttonText={"Send"}
          waiting={waiting}
          submitDisabled={hasErrors}
        />
        <Section
          collapsed={requestCollapsed}
          title="Request"
          onExpand={() => setRequestCollapsed(false)}
        >
          <Operation
            oas={oas}
            settings={<Settings config={tryitConfig} />}
            path={path!}
            method={method!}
          />
        </Section>
      </FormProvider>
      <HttpError />
      <GeneralError />
      {response && <Response />}
    </>
  );
}

function updateSecurityWithPrefs(
  security: TryitSecurityAllValues,
  prefs: SecretsForSecurity
): TryitSecurityAllValues {
  const result: TryitSecurityAllValues = [];
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
  oas: BundledSwaggerOrOasSpec,
  preferredServer: string | undefined,
  defaultServer: string
): string {
  const servers = getServerUrls(oas);

  const exists = servers.some((url) => url === preferredServer);
  if (preferredServer !== undefined && preferredServer !== "" && exists) {
    return preferredServer;
  }
  return defaultServer;
}
