import jsf from "json-schema-faker";

import { Swagger, deref } from "@xliic/openapi";
import { TryitOperationBody } from "@xliic/common/tryit";

export function createDefaultBody(
  oas: Swagger.BundledSpec,
  operation: Swagger.Operation,
  parameters: Swagger.OperationParametersMap,
  preferredMediaType?: string,
  preferredBodyValue?: unknown
): TryitOperationBody | undefined {
  const mediaType = getMediaType(oas, operation, preferredMediaType);

  // use preferred body if available
  if (mediaType !== undefined && preferredBodyValue !== undefined) {
    return { mediaType, value: preferredBodyValue };
  }

  if (mediaType !== undefined && KNOWN_MEDIA_TYPES.includes(mediaType))
    return createBody(oas, operation, parameters, mediaType);
}

export function createBody(
  oas: Swagger.BundledSpec,
  operation: Swagger.Operation,
  parameters: Swagger.OperationParametersMap,
  mediaType: string
): TryitOperationBody {
  if (FORM_MEDIA_TYPES.includes(mediaType)) {
    // FIXME use parameters.formData to generate body
    return { mediaType, value: {} };
  }

  if (mediaType == "application/json") {
    const body = Object.values(parameters.body)?.[0];
    const schema = deref(oas, body?.schema);
    if (schema) {
      jsf.option("useExamplesValue", true);
      jsf.option("failOnInvalidFormat", false);
      jsf.option("maxLength", 4096);
      jsf.option("alwaysFakeOptionals", true);
      try {
        return {
          mediaType,
          value: jsf.generate({ ...schema, definitions: oas.definitions } as any),
        };
      } catch (e) {
        // FIXME: show error in UI
        return { mediaType, value: {} };
      }
    }
    return { mediaType, value: {} };
  }

  // FIXME in which cases we should return undefined?
  return {
    mediaType,
    value: "",
  };
}

function getMediaType(
  oas: Swagger.BundledSpec,
  operation: Swagger.Operation,
  preferredMediaType?: string
): string | undefined {
  const consumes = Swagger.getConsumes(oas, operation);
  if (preferredMediaType !== undefined && consumes.includes(preferredMediaType)) {
    return preferredMediaType;
  } else if (consumes.length > 0) {
    return consumes[0];
  }
}

export function serializeToFormText(body: TryitOperationBody): string {
  if (KNOWN_MEDIA_TYPES.includes(body.mediaType)) {
    return JSON.stringify(body.value, null, 2);
  }
  return (body.value as any).toString();
}

export function parseFromFormText(mediaType: string, value: string): unknown | Error {
  if (KNOWN_MEDIA_TYPES.includes(mediaType)) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return new Error(`failed to convert: ${e}`);
    }
  }
  return value;
}

const KNOWN_MEDIA_TYPES = [
  "application/json",
  "application/x-www-form-urlencoded",
  "multipart/form-data",
];

const FORM_MEDIA_TYPES = ["application/x-www-form-urlencoded", "multipart/form-data"];
