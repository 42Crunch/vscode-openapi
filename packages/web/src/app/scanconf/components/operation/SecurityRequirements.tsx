import type { OasSecurityScheme } from "@xliic/common/oas30";
import type { SwaggerSecurityScheme } from "@xliic/common/swagger";
import * as playbook from "@xliic/common/playbook";
import { SecurityCredentialSelector } from "./SecurityCredentialSelector";
import { useEffect, useState } from "react";

export default function SecurityRequirements({
  schema,
  credentials,
  auth,
  onCredentialsChange,
}: {
  schema: Record<string, OasSecurityScheme | SwaggerSecurityScheme>;
  credentials: playbook.Credentials;
  auth: string[];
  onCredentialsChange: (auth: string[]) => void;
}) {
  if (!schema) {
    return null;
  }

  const matches = matchSchemaToCredentials(schema, credentials, auth);
  const [selection, setSelection] = useState({});

  useEffect(() => {
    const effective = { ...matches, ...selection };
    const noUndefined = Object.values(effective).every((value) => value !== undefined);
    const hasDifferentValues = Object.entries(effective).some(
      ([name, value]) => matches[name] !== value
    );
    if (noUndefined && hasDifferentValues) {
      onCredentialsChange(Object.values(effective));
    }
  }, [matches, selection]);

  return (
    <>
      {Object.keys(matches).map((schemeName) => {
        // if (schema[key] === undefined) {
        //   return <ErrorMessage key={key} message={`Unable to find securitySchema '${key}'`} />;
        // }
        return (
          <SecurityCredentialSelector
            key={schemeName}
            selectedCredentialName={matches[schemeName]}
            credentials={credentials}
            schema={schema[schemeName]}
            placeholder={schemeName}
            onChange={(name) => setSelection({ ...selection, [schemeName]: name })}
          />
        );
      })}
    </>
  );
}

function matchSchemaToCredentials(
  schema: Record<string, OasSecurityScheme | SwaggerSecurityScheme>,
  credentials: playbook.Credentials,
  auth: string[]
): Record<string, string> {
  const mutable = createObjectFromList(auth);
  const result: Record<string, string> = {};
  for (const name of Object.keys(schema)) {
    const found = findMatchingCredential(schema[name], credentials, Object.keys(mutable));
    if (found !== undefined) {
      result[name] = found;
      delete mutable[found];
    } else {
      result[name] == null;
    }
  }
  return result;
}

function findMatchingCredential(
  scheme: OasSecurityScheme | SwaggerSecurityScheme,
  credentials: playbook.Credentials,
  auth: string[]
) {
  for (const name of auth) {
    const credential = credentials[name];
    if (
      scheme.type === credential.type &&
      scheme.in === credential.in &&
      scheme.name === credential.name
    ) {
      return name;
    }
  }
}

function createObjectFromList(list: string[]) {
  const result: Record<string, boolean> = {};
  for (const item of list) {
    result[item] = true;
  }
  return result;
}
