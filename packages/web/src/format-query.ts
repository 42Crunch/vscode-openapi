import { OpenApi30 } from "@xliic/openapi";

// export function formatQuery(
//   query: Record<string, Value>,
//   parameters: Record<string, ResolvedOasParameter>
// ): string {
//   const result: Record<string, string> = {};
//   for (const [name, parameter] of Object.entries(parameters)) {
//     if (query.hasOwnProperty(name)) {
//       result[name] = formatValue(query[name], parameter);
//     }
//   }
//   return "";
// }

export function formatValue(value: any, parameter: OpenApi30.ResolvedParameter): string {
  return "";
}
