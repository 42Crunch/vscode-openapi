import { Vault } from "@xliic/common/vault";

export function wrapFormValues(values: Vault): Vault {
  const mutable = JSON.parse(JSON.stringify(values)) as Vault;
  return mutable;
}

export function unwrapFormValues(values: any): any {
  return JSON.parse(JSON.stringify(values));
}
