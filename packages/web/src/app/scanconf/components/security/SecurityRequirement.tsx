import styled from "styled-components";
import * as playbook from "@xliic/common/playbook";
import { ThemeColorVariables } from "@xliic/common/theme";
import {
  BundledOpenApiSpec,
  OasSecurityScheme,
  ResolvedOasOperationSecurity,
} from "@xliic/common/oas30";
import {
  BundledSwaggerSpec,
  SwaggerSecurityScheme,
  ResolvedSwaggerOperationSecurity,
} from "@xliic/common/swagger";
import { useFormContext, useController, useWatch } from "react-hook-form";
import Select from "../../../../new-components/Select";
import { useState } from "react";
import CredentialPicker from "./CredentialPicker";

export default function SecurityRequirement({
  requirement,
  credentials,
  values,
  setValues,
}: {
  requirement: Record<string, OasSecurityScheme | SwaggerSecurityScheme>;
  credentials: playbook.Credentials;
  values: Record<string, string>;
  setValues: (values: Record<string, string>) => void;
}) {
  return (
    <>
      {Object.keys(requirement)
        .sort()
        .map((schemeName) => {
          const scheme = requirement[schemeName];
          return (
            <CredentialPicker
              key={schemeName}
              value={values[schemeName]}
              scheme={scheme}
              schemeName={schemeName}
              credentials={credentials}
              onChange={(value) => {
                console.log("change", schemeName, value);
                const updatedValues = { ...values };
                if (value !== undefined) {
                  updatedValues[schemeName] = value;
                } else {
                  updatedValues[schemeName] = "";
                }
                setValues(updatedValues);
              }}
            />
          );
        })}
    </>
  );
}

function match(
  requirement: Record<string, OasSecurityScheme | SwaggerSecurityScheme>,
  auth: Record<string, playbook.Credential>
) {
  const mutable = { ...auth };
  const result: Record<string, string> = {};
  for (const [schemeName, scheme] of Object.entries(requirement)) {
    for (const [credentialName, credential] of Object.entries(mutable)) {
      if (checkCredential(credential, scheme)) {
        result[schemeName] = credentialName;
        delete mutable[credentialName];
        break;
      }
    }
    if (!result[schemeName]) {
      result[schemeName] = "";
    }
  }
  return result;
}

function checkCredential(
  credential: playbook.Credential,
  scheme: OasSecurityScheme | SwaggerSecurityScheme
): boolean {
  if (
    scheme.type === credential.type &&
    scheme.in === credential.in &&
    scheme.name === credential.name
  ) {
    return true;
  } else if (scheme.type === "http" && credential.type == "basic" && scheme.in === credential.in) {
    return true;
  } else if (scheme.type === "basic" && credential.type == "basic" && scheme.in === credential.in) {
    return true;
  }

  return false;
}
