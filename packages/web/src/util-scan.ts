import { OpenApi30, HttpMethod } from "@xliic/openapi";
import { ScanConfig } from "@xliic/common/scan";

export function generateDefaultValues(
  method: HttpMethod,
  parameters: OpenApi30.OperationParametersMap,
  configuration: ScanConfig
): Record<string, any> {
  const values: Record<string, any> = { parameters: {} };
  const locations = Object.keys(parameters) as OpenApi30.ParameterLocation[];
  for (const location of locations) {
    for (const name of Object.keys(parameters[location])) {
      const value = configuration.parameters[location]?.[name];
      if (value !== undefined) {
        if (!values.parameters[location]) {
          values.parameters[location] = {};
        }
        values.parameters[location][name] = Array.isArray(value) ? wrap(value) : value;
      }
    }
  }

  if (configuration.requestBody !== undefined) {
    values["requestBody"] = JSON.stringify(configuration.requestBody, null, 2);
  }

  values["host"] = configuration.host;
  values["method"] = method;

  return values;
}

// arrays must be wrapped for react form hook
function wrap(array: unknown[]): unknown {
  return array.map((value) => ({ value }));
}
