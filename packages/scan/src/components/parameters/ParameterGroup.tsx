import type { ResolvedOasParameter, BundledOpenApiSpec, OasSchema } from "@xliic/common/oas30";
import { deref } from "@xliic/common/jsonpointer";
import Parameter from "./Parameter";
import ArrayParameter from "./ArrayParameter";
import { escapeFieldName } from "../../util";

export default function ParameterGroup({
  oas,
  group,
}: {
  oas: BundledOpenApiSpec;
  group: Record<string, ResolvedOasParameter>;
}) {
  if (group === undefined || Object.keys(group).length === 0) {
    return null;
  }

  const defaultSchema: OasSchema = { type: "string" };

  return (
    <div>
      {Object.values(group).map((parameter: ResolvedOasParameter) => {
        const name = `parameters.${parameter.in}.${escapeFieldName(parameter.name)}`;
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
            <div className="m-1" key={name}>
              <Parameter
                name={name}
                parameter={parameter}
                schema={parameter.schema || defaultSchema}
              />
            </div>
          );
        }
      })}
    </div>
  );
}
