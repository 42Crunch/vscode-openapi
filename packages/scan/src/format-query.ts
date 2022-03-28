import { OasMediaType, ResolvedOasParameter } from "@xliic/common/oas30";

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

export function formatValue(value: any, parameter: ResolvedOasParameter): string {
  return "";
}
