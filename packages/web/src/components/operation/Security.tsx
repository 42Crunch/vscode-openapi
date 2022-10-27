import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import {
  BundledOpenApiSpec,
  OasSecurityScheme,
  ResolvedOasOperationSecurity,
} from "@xliic/common/oas30";

import { useFormContext, useController, useFieldArray } from "react-hook-form";
import SecurityRequirements from "./SecurityRequirements";

export default function Security({
  oas,
  security,
}: {
  oas: BundledOpenApiSpec;
  security: ResolvedOasOperationSecurity;
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
        <SecurityRequirements
          key={currentField.id}
          name={`security.${securityIndex.value}`}
          schema={security[securityIndex.value]}
        />
      )}
    </Container>
  );
}

function securityRequirementOption(requirement: Record<string, OasSecurityScheme>, index: number) {
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
