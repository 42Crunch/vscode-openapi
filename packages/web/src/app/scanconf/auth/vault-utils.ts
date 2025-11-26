import { Vault, getScheme } from "@xliic/common/vault";
import { BundledSwaggerOrOasSpec, getSecurityScheme } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";

export function checkVault(
  oas: BundledSwaggerOrOasSpec,
  vault: Vault,
  credentialName: string,
  credential: Playbook.Credential
): string[] {
  const errors: string[] = [];

  const securityScheme = getSecurityScheme(oas, credentialName);
  if (!securityScheme) {
    errors.push(`Security scheme '${credentialName}' is not found in OpenAPI file`);
    return errors;
  }

  const [scheme, schemeError] = getScheme(vault, credentialName);

  if (schemeError) {
    errors.push(schemeError);
  }

  return errors;
}
