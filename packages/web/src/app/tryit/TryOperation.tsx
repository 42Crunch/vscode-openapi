import { useForm, FormProvider } from "react-hook-form";

import { TryitSecurityAllValues, TryitSecurityValue } from "@xliic/common/tryit";
import { SecretsForSecurity } from "@xliic/common/prefs";
import { BundledSwaggerOrOasSpec, HttpMethod, getServerUrls } from "@xliic/openapi";

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
  const { path, method, oas, defaultValues } = useAppSelector((state) => state.tryit);

  const prefs = useAppSelector((state) => state.prefs);

  const server = getPreferredServer(oas, prefs.tryitServer, defaultValues!.server);

  const updatedDefaults = {
    ...defaultValues!,
    server,
    security: updateSecurityWithPrefs(defaultValues!.security, prefs.security),
  };

  const values = wrapFormDefaults(updatedDefaults);

  return <TryOperationForm oas={oas} method={method} path={path} values={values} />;
}

function TryOperationForm({
  oas,
  method,
  path,
  values,
}: {
  oas: BundledSwaggerOrOasSpec;
  method: HttpMethod | undefined;
  path: string | undefined;
  values: Record<string, any>;
}) {
  const dispatch = useAppDispatch();
  const env = useAppSelector((state) => state.env.data);
  const { response, waiting } = useAppSelector((state) => state.tryit);
  const config = useAppSelector((state) => state.config.data);

  const [requestCollapsed, setRequestCollapsed] = useState(false);

  useEffect(() => {
    setRequestCollapsed(response !== undefined);
  }, [response]);

  const tryOperation = async (data: Record<string, any>) => {
    const values = unwrapFormDefaults(data);
    try {
      const [httpRequest, httpConfig] = await makeHttpRequest(
        config,
        oas,
        method!,
        path!,
        values,
        env
      );
      const security = values.security[values.securityIndex];
      if (security) {
        for (const [scheme, value] of Object.entries(security)) {
          if (typeof value === "string" && value.startsWith("{{") && value.endsWith("}}")) {
            dispatch(setSecretForSecurity({ scheme, secret: value }));
          }
        }
      }
      dispatch(setTryitServer(values.server));
      dispatch(
        sendHttpRequest({ defaultValues: values, request: httpRequest, config: httpConfig })
      );
    } catch (ex) {
      dispatch(
        showGeneralError({
          message: `Failed to build HTTP request: ${ex}`,
        })
      );
    }
  };

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
            settings={<Settings config={config} />}
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
