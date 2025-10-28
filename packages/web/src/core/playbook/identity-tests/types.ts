import { Vault } from "@xliic/common/vault";
import { BundledSwaggerOrOasSpec } from "@xliic/openapi";

export type AuthenticationTestSuite = {
  id: string;
  description?: string;
  requirements: [string, (spec: BundledSwaggerOrOasSpec, vault: Vault) => string[]][];
  tests: AuthenticationTest[];
};

export type AuthenticationTest = {
  id: string;
  description?: string;
  requirements: [string, (spec: BundledSwaggerOrOasSpec, vault: Vault) => string[]][];
  generate: (value: string) => string[];
};

export type TestSuiteConfigurationResult = {
  tests: TestConfigurationResult[];
};

export type TestConfigurationResult = {
  name: string;
  status: "active" | "inactive";
  message: string;
};
