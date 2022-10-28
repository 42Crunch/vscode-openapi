import { useAppDispatch, useAppSelector } from "../store/hooks";
import { getParameters, wrapFormDefaults, unwrapFormDefaults } from "../util";
import { TryitSecurityValues, TryitSecurityValue } from "@xliic/common/messages/tryit";
import Operation from "./operation/Operation";
import { runScan } from "../features/scan/slice";
import { setScanServer, setSecretForSecurity } from "../features/prefs/slice";

import { updateScanConfig } from "../features/scan/util-scan";
import Navigation from "./Navigation";
import { SecretsForSecurity } from "@xliic/common/messages/prefs";
import { BundledOpenApiSpec } from "@xliic/common/oas30";

export default function ScanOperation() {
  const dispatch = useAppDispatch();
  const { path, method, oas, rawOas, defaultValues, scanConfigRaw } = useAppSelector(
    (state) => state.scan
  );

  const prefs = useAppSelector((state) => state.prefs);

  const parameters = getParameters(oas, path!, method!);

  const server = getPreferredServer(oas, prefs.scanServer, defaultValues!.server);

  const updatedDefaults = {
    ...defaultValues!,
    server,
    security: updateSecurityWithPrefs(defaultValues!.security, prefs.security),
  };

  const scan = async (data: Record<string, any>) => {
    const values = unwrapFormDefaults(oas, parameters, data);
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

  return (
    <>
      <Navigation
        tabs={[
          ["scanOperation", "Scan"],
          ["scanReport", "Report"],
          ["env", "Environment"],
        ]}
      />

      <Operation
        oas={oas}
        path={path!}
        method={method!}
        defaultValues={wrapFormDefaults(updatedDefaults!)}
        onSubmit={scan}
        buttonText="Scan"
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
