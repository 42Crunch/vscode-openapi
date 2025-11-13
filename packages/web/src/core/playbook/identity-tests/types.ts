import { Vault } from "@xliic/common/vault";
import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";
import { StageGenerator } from "../execute";

export type TestSuite = {
  id: string;
  description?: string;
  requirements: [
    string,
    (spec: BundledSwaggerOrOasSpec, playbook: Playbook.Bundle, vault: Vault) => string[]
  ][];
  tests: Test[];
};

export type Test = {
  id: string;
  requirements: [
    string,
    (spec: BundledSwaggerOrOasSpec, playbook: Playbook.Bundle, vault: Vault) => string[]
  ][];
  run: (config: TestConfiguration) => { id: string; stages: () => StageGenerator }[];
};

export type TestConfiguration = {
  failures: string[];
};

export type SuiteConfiguration = {
  failures: Record<string, string[]>;
  tests: Record<string, TestConfiguration>;
};
