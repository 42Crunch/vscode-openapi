import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { success, failure } from "@xliic/result";
import { Vault } from "@xliic/common/vault";
import { Playbook } from "@xliic/scanconf";

import { Suite } from "../types";
import {
  hasAtLeastTwoSecuritySchemes,
  hasCredentialsForAllSchemes,
  hasMultipleBasicAuthCredentials,
  usesBasicAuth,
} from "../requirements";
import basicSecurityRequirements from "./basic";

function configure(spec: BundledSwaggerOrOasSpec, playbook: Playbook.Bundle, vault: Vault) {
  const basicAuthFailed = usesBasicAuth(spec, playbook, vault);
  if (basicAuthFailed) {
    return failure({ usesBasicAuth: basicAuthFailed });
  }

  const atLeastTwoSchemesFailed = hasAtLeastTwoSecuritySchemes(spec);

  if (atLeastTwoSchemesFailed) {
    return failure({ hasAtLeastTwoSecuritySchemes: atLeastTwoSchemesFailed });
  }

  const credentialsFailed = hasCredentialsForAllSchemes(spec, vault);
  if (credentialsFailed) {
    return failure({ hasCredentialsForAllSchemes: credentialsFailed });
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
