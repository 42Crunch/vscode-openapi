import jsf from "json-schema-faker";

import { OpenApi30, deref } from "@xliic/openapi";
import { TryitOperationBody } from "@xliic/common/tryit";

export function createDefaultBody(
  oas: OpenApi30.BundledSpec,
  operation?: OpenApi30.Operation,
  preferredMediaType?: string,
  preferredBodyValue?: unknown
): TryitOperationBody | undefined {
  const preferred = findPreferredBody(deref(oas, operation?.requestBody), preferredMediaType);

  if (!preferred) {
    return { mediaType: "text/plain", value: "" };
  }

  return createBody(oas, preferred[0], preferred[1], preferredBodyValue);
}

export function createBody(
  oas: OpenApi30.BundledSpec,
  mediaType: string,
  mto?: OpenApi30.MediaType,
  preferredBodyValue?: unknown
): TryitOperationBody {
  // use the preferred body value if it's provided
  if (preferredBodyValue !== undefined) {
    return { mediaType, value: preferredBodyValue };
  }

  // use example if available
  if (mto?.example) {
    return {
      mediaType,
      value: mto.example,
    };
  }

  // use any value from examples if available
  if (mto?.examples && Object.values(mto.examples).length > 0) {
    const example = Object.values(mto.examples)[0];
    return {
      mediaType,
      value: deref(oas, example)?.value ?? {},
    };
  }

  if (KNOWN_MEDIA_TYPES.includes(mediaType))
    if (mto?.schema) {
      // generate value based on schema
      const schema = deref(oas, mto.schema);
      if (schema) {
        jsf.option("useExamplesValue", true);
        jsf.option("failOnInvalidFormat", false);
        jsf.option("maxLength", 4096);
        jsf.option("alwaysFakeOptionals", true);
        try {
          return {
            mediaType,
            value: jsf.generate({ ...schema, components: oas.components } as any),
          };
        } catch (e) {
          // FIXME: show error in UI
          return { mediaType, value: {} };
        }
      }
    }

  return {
    mediaType,
    value: "",
  };
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

function findPreferredBody(
  requestBody?: OpenApi30.RequestBody,
  preferredMediaType?: string
): [string, OpenApi30.MediaType] | undefined {
  if (!requestBody || !requestBody.content) {
    return undefined;
  }

  const preferredMediaTypes = [...KNOWN_MEDIA_TYPES];
  if (preferredMediaType) {
    preferredMediaTypes.unshift(preferredMediaType);
  }

  // check our preferred media types first
  for (const mediaType of preferredMediaTypes) {
    if (requestBody.content[mediaType]) {
      return [mediaType, requestBody.content[mediaType]];
    }
  }

  // pick first media type
  const mediaType = Object.keys(requestBody.content)[0];
  return [mediaType, requestBody.content[mediaType]];
}

const KNOWN_MEDIA_TYPES = [
  "application/json",
  "application/x-www-form-urlencoded",
  "multipart/form-data",
];
