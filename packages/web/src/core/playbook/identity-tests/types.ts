import { Vault } from "@xliic/common/vault";
import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";
import { Result } from "@xliic/result";
import { StepGenerator } from "../execute";
import { PlaybookEnvStack } from "../playbook-env";

export type ConfigFailures = Record<string, string>;

export type TestConfig = Record<string, unknown>;

export type SuiteConfig = Result<
  Record<string, Result<TestConfig, ConfigFailures>>,
  ConfigFailures
>;

export type TestStage = {
  id: string;
  steps: () => StepGenerator;
};

export type Test<C extends TestConfig> = {
  configure(
    spec: BundledSwaggerOrOasSpec,
    playbook: Playbook.Bundle,
    vault: Vault
  ): Result<C, ConfigFailures>;
  run(
    config: C,
    spec: BundledSwaggerOrOasSpec,
    playbook: Playbook.Bundle,
    vault: Vault
  ): AsyncGenerator<TestStage, void, PlaybookEnvStack | undefined>;
};

export type Suite = {
  description: string;
  configure(
    spec: BundledSwaggerOrOasSpec,
    playbook: Playbook.Bundle,
    vault: Vault
  ): Result<Record<string, Test<TestConfig>>, ConfigFailures>;
  tests: Record<string, Test<TestConfig>>;
};
