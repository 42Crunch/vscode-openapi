import { Config } from "@xliic/common/config";

export function wrapFormValues(values: Config): Config {
  const mutable = JSON.parse(JSON.stringify(values)) as Config;
  if (mutable.platformApiToken === undefined) {
    mutable.platformApiToken = "";
  }
  return mutable;
}

export function unwrapFormValues(values: any): any {
  return JSON.parse(JSON.stringify(values));
}
