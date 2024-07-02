import { Config } from "@xliic/common/config";
import { FieldValues } from "react-hook-form";

export type FormConfig = Omit<Config, "insecureSslHostnames"> & {
  insecureSslHostnames: { name: string }[];
};

export function wrapFormValues(values: Config): FormConfig {
  const mutable: FormConfig = JSON.parse(JSON.stringify(values));
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

export function unwrapFormValues(values: FieldValues): Config {
  const mutable: Config = JSON.parse(JSON.stringify(values));
  if (values.insecureSslHostnames) {
    mutable.insecureSslHostnames = [];
    for (const host of values.insecureSslHostnames) {
      mutable.insecureSslHostnames.push(host.name);
    }
  }
  return mutable;
}
