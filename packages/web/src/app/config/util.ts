import { Config } from "@xliic/common/config";

export function wrapFormValues(values: Config): any {
  const mutable = JSON.parse(JSON.stringify(values));
  if (mutable.platformApiToken === undefined) {
    mutable.platformApiToken = "";
  }
  if (values.insecureSslHostnames) {
    mutable.insecureSslHostnames = [];
    for (const hostname of values.insecureSslHostnames) {
      mutable.insecureSslHostnames.push({ name: hostname });
    }
  }
  return mutable;
}

export function unwrapFormValues(values: any): any {
  const mutable = JSON.parse(JSON.stringify(values));
  if (values.insecureSslHostnames) {
    mutable.insecureSslHostnames = [];
    for (const host of values.insecureSslHostnames) {
      mutable.insecureSslHostnames.push(host.name);
    }
  }
  return mutable;
}
