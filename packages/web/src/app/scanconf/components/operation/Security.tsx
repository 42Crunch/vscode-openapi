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

import SecurityRequirements from "./SecurityRequirements";

export default function Security({
  oas,
  security,
  credentials,
}: {
  oas: BundledOpenApiSpec | BundledSwaggerSpec;
  security: ResolvedOasOperationSecurity | ResolvedSwaggerOperationSecurity;
  credentials: playbook.Credentials;
}) {
  if (security === undefined) {
    return null;
  }
  const { setValue } = useFormContext();
  const auth = useWatch({ name: "auth", defaultValue: [] });

  const { field: credentialSetIndex } = useController({
    name: "credentialSetIndex",
  });

  const onCredentialsChange = (auth: string[]) => {
    setValue("auth", auth);
  };

  return (
    <Container>
      <select
        onChange={credentialSetIndex.onChange}
        value={credentialSetIndex.value}
        ref={credentialSetIndex.ref}
      >
        {security.map((requirement, index) => securityRequirementOption(requirement, index))}
      </select>
      <SecurityRequirements
        credentials={credentials}
        auth={auth}
        schema={security[credentialSetIndex.value]}
        onCredentialsChange={onCredentialsChange}
      />
    </Container>
  );
}

function securityRequirementOption(
  requirement: Record<string, OasSecurityScheme | SwaggerSecurityScheme>,
  index: number
) {
  const keys = Object.keys(requirement).join(", ");
  return (
    <option key={index} value={index}>
      {keys}
    </option>
  );
}

const Container = styled.div`
  margin: 8px;
  gap: 8px;
  display: flex;
  flex-flow: column;

  & > select {
    padding: 4px;
    color: var(${ThemeColorVariables.foreground});
    background-color: var(${ThemeColorVariables.background});
    border: none;
    border-bottom: 1px solid var(${ThemeColorVariables.border});
  }
`;
