import { Swagger } from "@xliic/openapi";

import { escapeFieldName } from "../../util";
import { SecurityHttpBasic } from "./SecurityHttpBasic";
import { SecurityGeneric } from "./SecurityGeneric";
import ErrorMessage from "./ErrorMessage";

export default function SecurityRequirements({
  name,
  schema,
}: {
  name: string;
  schema: Record<string, Swagger.SecurityScheme>;
}) {
  if (!schema) {
    return null;
  }

  return (
    <>
      {Object.keys(schema).map((key) => {
        if (schema[key] === undefined) {
          return <ErrorMessage key={key} message={`Unable to find securitySchema '${key}'`} />;
        }
        if (schema[key]?.type === "basic") {
          return <SecurityHttpBasic key={key} name={`${name}.${escapeFieldName(key)}`} />;
        }
        return (
          <SecurityGeneric key={key} name={`${name}.${escapeFieldName(key)}`} placeholder={key} />
        );
      })}
    </>
  );
}
