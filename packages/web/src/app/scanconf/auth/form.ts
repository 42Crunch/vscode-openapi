import * as playbook from "@xliic/common/playbook";
import { simpleClone } from "@xliic/preserving-json-yaml-parser";

export function wrapCredential(credential: playbook.Credential) {
  const result = simpleClone(credential);
  const methods = Object.keys(credential.methods).map((key) => {
    return { key, value: credential.methods[key] };
  });
  return { ...result, methods };
}

export function unwrapCredential(data: any): playbook.Credential {
  const methods: playbook.Credential["methods"] = {};
  for (const { key, value } of data.methods) {
    methods[key] = value;
  }

  return {
    ...data,
    methods,
  };
}
