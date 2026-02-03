import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { success, failure } from "@xliic/result";
import { Vault } from "@xliic/common/vault";
import { Playbook } from "@xliic/scanconf";

import { Suite } from "../types";
import {
  hasAtLeastTwoSecuritySchemes,
  hasCredentialsForAllSchemes,
  usesAuth,
} from "../requirements";
import basicScopes from "./basic";

function configure(spec: BundledSwaggerOrOasSpec, playbook: Playbook.Bundle, vault: Vault) {
  const basicAuthFailed = usesAuth(spec, "basic");
  if (basicAuthFailed) {
    return failure({ usesAuth: basicAuthFailed });
  }

  const atLeastTwoSchemesFailed = hasAtLeastTwoSecuritySchemes(spec);

  if (atLeastTwoSchemesFailed) {
    return failure({ hasAtLeastTwoSecuritySchemes: atLeastTwoSchemesFailed });
  }

  const credentialsFailed = hasCredentialsForAllSchemes(spec, vault);
  if (credentialsFailed) {
    return failure({ hasCredentialsForAllSchemes: credentialsFailed });
  }

  return success({ basicScopes });
}

export default {
  description: "Check that scopes are handled correctly",
  configure,
  tests: {
    basicScopes,
  },
} satisfies Suite;
