import { useFormContext, useController } from "react-hook-form";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";

import type { OasSecurityScheme } from "@xliic/common/oas30";
import { escapeFieldName } from "../../util";
import { SecurityHttpBasic } from "./SecurityHttpBasic";
import { SecurityGeneric } from "./SecurityGeneric";

export default function SecurityRequirements({
  name,
  schema,
}: {
  name: string;
  schema: Record<string, OasSecurityScheme>;
}) {
  if (!schema) {
    return null;
  }
  return (
    <>
      {Object.keys(schema).map((key) => {
        if (schema[key].type === "http" && /^basic$/i.test(schema[key].scheme)) {
          return (
            <SecurityHttpBasic
              key={key}
              name={`${name}.${escapeFieldName(key)}`}
              schema={schema[key]}
              schemaKey={key}
            />
          );
        }
        return (
          <SecurityGeneric
            key={key}
            name={`${name}.${escapeFieldName(key)}`}
            schema={schema[key]}
            schemaKey={key}
          />
        );
      })}
    </>
  );
}
