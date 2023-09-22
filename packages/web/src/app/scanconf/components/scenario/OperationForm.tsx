import { useForm, useWatch, useFormContext, FormProvider } from "react-hook-form";

import { TryitSecurityAllValues, TryitSecurityValue } from "@xliic/common/tryit";
import { SecretsForSecurity } from "@xliic/common/prefs";
import * as playbook from "@xliic/common/playbook";

import { BundledSwaggerOrOasSpec, getServerUrls } from "@xliic/common/openapi";
import { HttpMethod } from "@xliic/common/http";

import Operation from "../../components/operation/Operation";
import OperationHeader from "../../components/operation/OperationHeader";

export function OperationForm({
  oas,
  credentials,
  method,
  path,
}: {
  oas: BundledSwaggerOrOasSpec;
  credentials: playbook.Credentials;
  method: HttpMethod | undefined;
  path: string | undefined;
}) {
  return (
    <>
      <Operation oas={oas} credentials={credentials} path={path!} method={method!} />
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
