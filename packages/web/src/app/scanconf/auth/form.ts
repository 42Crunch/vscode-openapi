import { Playbook } from "@xliic/scanconf";
import { simpleClone } from "@xliic/preserving-json-yaml-parser";

export function wrapCredential(credential: Playbook.Credential) {
  const result = simpleClone(credential);
  const methods = Object.keys(credential.methods).map((key) => {
    return { key, value: credential.methods[key] };
  });
  return {
    ...result,
    ttl: wrapUndefinedString(result.ttl),
    tti: wrapUndefinedString(result.tti),
    methods,
  };
}

export function unwrapCredential(data: any): Playbook.Credential {
  const methods: Playbook.Credential["methods"] = {};
  for (const { key, value } of data.methods) {
    methods[key] = value;
  }

  return {
    ...data,
    ttl: unwrapUndefinedString(data.ttl),
    tti: unwrapUndefinedString(data.tti),
    methods,
  };
}

function wrapUndefinedString(value: string | undefined): string {
  return value === undefined ? "" : value;
}

function unwrapUndefinedString(value: string): string | undefined {
  return value === "" ? undefined : value;
}
