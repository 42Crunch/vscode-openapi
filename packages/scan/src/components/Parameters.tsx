import styled from "styled-components";
import type {
  ResolvedOasParameter,
  OasParameterLocation,
  OperationParametersMap,
  BundledOpenApiSpec,
  OasSchema,
} from "@xliic/common/oas30";
import { deref } from "@xliic/common/jsonpointer";
import Parameter from "./Parameter";
import ArrayParameter from "./ArrayParameter";
import Section from "./Section";

export default function Parameters({
  oas,
  parameters,
}: {
  oas: BundledOpenApiSpec;
  parameters: OperationParametersMap;
}) {
  return (
    <>
      <ParametersBlock location="path" oas={oas} parameters={parameters.path} />
      <ParametersBlock location="query" oas={oas} parameters={parameters.query} />
      <ParametersBlock location="header" oas={oas} parameters={parameters.header} />
      <ParametersBlock location="cookie" oas={oas} parameters={parameters.cookie} />
    </>
  );
}

function ParametersBlock({
  oas,
  location,
  parameters,
}: {
  oas: BundledOpenApiSpec;
  location: OasParameterLocation;
  parameters: Record<string, ResolvedOasParameter>;
}) {
  if (parameters === undefined || Object.keys(parameters).length === 0) {
    return null;
  }

  const defaultSchema: OasSchema = { type: "string" };

  return (
    <div>
      <Section>{location} parameters</Section>
      {Object.values(parameters).map((parameter: ResolvedOasParameter) => {
        const name = `parameters.${parameter.in}.${parameter.name}`;
        if (parameter.schema?.type === "array") {
          const items = deref(oas, parameter.schema.items);
          return (
            <ArrayParameter
              name={name}
              key={name}
              parameter={parameter}
              schema={items || defaultSchema}
            />
          );
        } else {
          return (
            <Parameter
              key={name}
              name={name}
              parameter={parameter}
              schema={parameter.schema || defaultSchema}
            />
          );
        }
      })}
    </div>
  );
}
