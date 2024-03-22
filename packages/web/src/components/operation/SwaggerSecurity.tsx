import styled from "styled-components";
import { useFormContext, useController, useFieldArray } from "react-hook-form";

import { ThemeColorVariables } from "@xliic/common/theme";
import { Swagger } from "@xliic/openapi";

import SwaggerSecurityRequirements from "./SwaggerSecurityRequirements";

export default function SwaggerSecurity({
  oas,
  security,
}: {
  oas: Swagger.BundledSpec;
  security: Swagger.ResolvedOperationSecurity;
}) {
  if (security === undefined) {
    return null;
  }

  const { control, formState } = useFormContext();

  const { field: securityIndex } = useController({
    name: "securityIndex",
    control,
  });

  const { fields } = useFieldArray({
    control,
    name: "security",
  });

  const currentField = fields[securityIndex.value];

  return (
    <Container>
      <select onChange={securityIndex.onChange} value={securityIndex.value} ref={securityIndex.ref}>
        {security.map((requirement, index) => securityRequirementOption(requirement, index))}
      </select>
      {currentField && (
        <SwaggerSecurityRequirements
          key={currentField.id}
          name={`security.${securityIndex.value}`}
          schema={security[securityIndex.value]}
        />
      )}
    </Container>
  );
}

function securityRequirementOption(
  requirement: Record<string, Swagger.SecurityScheme>,
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
    border-bottom: 1px solid var(${ThemeColorVariables.tabBorder});
  }
`;
