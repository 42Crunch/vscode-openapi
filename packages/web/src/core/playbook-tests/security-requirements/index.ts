import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { success, failure } from "@xliic/result";
import { Vault } from "@xliic/common/vault";
import { Playbook } from "@xliic/scanconf";

import { Suite } from "../types";
import { hasMultipleBasicAuthCredentials, usesBasicAuth } from "../requirements";
import basicSecurityRequirements from "./basic";

function configure(spec: BundledSwaggerOrOasSpec, playbook: Playbook.Bundle, vault: Vault) {
  const basicAuthFailed = usesBasicAuth(spec, playbook, vault);
  if (basicAuthFailed) {
    return failure({ usesBasicAuth: basicAuthFailed });
  }

  const credentialsFailed = hasMultipleBasicAuthCredentials(spec, vault, 2);
  if (credentialsFailed) {
    return failure({ hasMultipleCredentials: credentialsFailed });
  }

  return success({ basicSecurityRequirements });
}

export default {
  description: "Simple BOLA test suite",
  configure,
  tests: {
    basicSecurityRequirements,
  },
} satisfies Suite;
