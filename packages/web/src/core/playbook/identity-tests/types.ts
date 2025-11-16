import { Vault } from "@xliic/common/vault";
import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";
import { StageGenerator } from "../execute";

/*
export type TestSuite = {
  id: string;
  description?: string;
  requirements: [
    string,
    (spec: BundledSwaggerOrOasSpec, playbook: Playbook.Bundle, vault: Vault) => string[]
  ][];
  tests: Record<string, Test<any>>;
};

export type Test<T extends TestConfiguration = TestConfiguration> = {
  id: string;
  requirements: [
    string,
    (spec: BundledSwaggerOrOasSpec, playbook: Playbook.Bundle, vault: Vault) => string[]
  ][];
  configure: (spec: BundledSwaggerOrOasSpec, playbook: Playbook.Bundle, vault: Vault) => T;
  run: (config: T) => { id: string; stages: () => StageGenerator }[];
};

export type TestConfiguration = {
  failures: string[];
};

export type SuiteConfiguration = {
  failures: Record<string, string[]>;
  tests: Record<string, TestConfiguration>;
};
*/

export type TestConfig = {
  ready: boolean;
  failures: Record<string, string>;
};

export type SuiteConfig = {
  ready: boolean;
  failures: Record<string, string>;
  tests: Record<string, TestConfig>;
};

export type Test<C extends TestConfig> = {
  requirements: Record<
    string,
    (spec: BundledSwaggerOrOasSpec, playbook: Playbook.Bundle, vault: Vault) => string | undefined
  >;
  configure(spec: BundledSwaggerOrOasSpec, playbook: Playbook.Bundle, vault: Vault): C;
  run(config: C): { id: string; stages: () => StageGenerator }[];
};

export type Suite = {
  description: string;
  requirements: Record<
    string,
    (spec: BundledSwaggerOrOasSpec, playbook: Playbook.Bundle, vault: Vault) => string | undefined
  >;
  tests: Record<string, Test<TestConfig>>;
};
