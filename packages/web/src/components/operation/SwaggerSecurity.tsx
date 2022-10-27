import styled from "styled-components";
import {
  BundledSwaggerSpec,
  ResolvedSwaggerOperationSecurity,
  SwaggerSecurityScheme,
} from "@xliic/common/swagger";

import { useFormContext, useController, useFieldArray } from "react-hook-form";
import SwaggerSecurityRequirements from "./SwaggerSecurityRequirements";
import { ThemeColorVariables } from "@xliic/common/theme";

export default function SwaggerSecurity({
  oas,
  security,
}: {
  oas: BundledSwaggerSpec;
  security: ResolvedSwaggerOperationSecurity;
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
  requirement: Record<string, SwaggerSecurityScheme>,
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
