import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";

import { BundledOpenApiSpec, OasSecurityScheme } from "@xliic/common/oas30";

import { TryitSecurity } from "@xliic/common/messages/tryit";
import { useFormContext, useController, useFieldArray } from "react-hook-form";
import SecurityRequirements from "./SecurityRequirements";

export default function Security({
  oas,
  security,
}: {
  oas: BundledOpenApiSpec;
  security: TryitSecurity;
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
    <>
      <FloatingLabel className="m-1" label="security">
        <Form.Select
          onChange={securityIndex.onChange}
          value={securityIndex.value}
          ref={securityIndex.ref}
        >
          {security.map((requirement, index) => securityRequirementOption(requirement, index))}
        </Form.Select>
      </FloatingLabel>
      {currentField && (
        <SecurityRequirements
          key={currentField.id}
          name={`security.${securityIndex.value}`}
          schema={security[securityIndex.value]}
        />
      )}
    </>
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
