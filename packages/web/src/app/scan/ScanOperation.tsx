import { useForm, FormProvider } from "react-hook-form";
import { useEffect, useState } from "react";

import { useAppDispatch, useAppSelector } from "./store";
import { wrapFormDefaults, unwrapFormDefaults } from "../../util";
import { TryitSecurityAllValues, TryitSecurityValue } from "@xliic/common/tryit";
import Operation from "../../components/operation/Operation";
import OperationHeader from "../../components/operation/OperationHeader";

import { runScan } from "./slice";
import { setScanServer, setSecretForSecurity } from "../../features/prefs/slice";

import { updateScanConfig } from "./util-scan";
import { SecretsForSecurity } from "@xliic/common/prefs";
import { BundledSwaggerOrOasSpec, getServerUrls } from "@xliic/common/openapi";
import Section from "../../components/Section";
import ScanReport from "./ScanReport";
import GeneralError from "./GeneralError";

export default function ScanOperation() {
  const dispatch = useAppDispatch();
  const { path, method, oas, rawOas, defaultValues, scanConfigRaw, scanReport, waiting } =
    useAppSelector((state) => state.scan);

  const prefs = useAppSelector((state) => state.prefs);

  const server = getPreferredServer(oas, prefs.scanServer, defaultValues!.server);

  const updatedDefaults = {
    ...defaultValues!,
    server,
    security: updateSecurityWithPrefs(defaultValues!.security, prefs.security),
  };

  const scan = async (data: Record<string, any>) => {
    const values = unwrapFormDefaults(data);
    const [updatedScanConfig, env] = updateScanConfig(scanConfigRaw, path!, method!, values);
    dispatch(setScanServer(values.server));

    const security = values.security[values.securityIndex];
    if (security) {
      for (const [scheme, value] of Object.entries(security)) {
        if (typeof value === "string" && value.startsWith("{{") && value.endsWith("}}")) {
          dispatch(setSecretForSecurity({ scheme, secret: value }));
        }
      }
    }

    dispatch(
      runScan({
        defaultValues: values,
        scanConfigRaw: updatedScanConfig,
        env,
        rawOas,
      })
    );
  };

  const [scanConfigCollapsed, setScanConfigCollapsed] = useState(false);

  useEffect(() => {
    setScanConfigCollapsed(scanReport !== undefined);
  }, [scanReport]);

  const methods = useForm({
    reValidateMode: "onChange",
    values: wrapFormDefaults(updatedDefaults),
  });

  const { handleSubmit, formState } = methods;

  const hasErrors = Object.keys(formState.errors || {}).length > 0;

  return (
    <>
      <FormProvider {...methods}>
        <Section
          collapsed={scanConfigCollapsed}
          title="Scan Configuration"
          onExpand={() => setScanConfigCollapsed(false)}
        >
          <OperationHeader
            method={method!}
            path={path!}
            servers={getServerUrls(oas)}
            onSubmit={handleSubmit(scan)}
            buttonText={"Scan"}
            submitDisabled={hasErrors}
            waiting={waiting}
          />
          <Operation oas={oas} path={path!} method={method!} />
        </Section>
      </FormProvider>
      {scanReport && <ScanReport />}
      <GeneralError />
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

  const exists2 = servers.some((url) => url === preferredServer);
  if (defaultServer !== undefined && defaultServer !== "" && exists2) {
    return defaultServer;
  }

  return servers.length > 0 ? servers[0] : "";
}
