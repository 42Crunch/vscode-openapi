import { Vault } from "@xliic/common/vault";
import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";
import { Result } from "@xliic/result";
import { StepGenerator, PlaybookError } from "../playbook/execute";
import { PlaybookEnvStack } from "../playbook/playbook-env";

export type ConfigFailures = Record<string, string>;

export type TestConfig = Record<string, unknown>;

export type SuiteConfig = Result<
  Record<string, Result<TestConfig, ConfigFailures>>,
  ConfigFailures
>;

export type TestStage = {
  id: string;
  steps: StepGenerator<TestIssue[]>;
  envStack?: PlaybookEnvStack;
};

export type TestIssue = {
  id: string;
  message: string;
};

export type TestStageGenerator = AsyncGenerator<
  TestStage,
  void,
  Result<{ env: PlaybookEnvStack; result: TestIssue[] }, PlaybookError>
>;

export type Test<C extends TestConfig> = {
  configure(
    spec: BundledSwaggerOrOasSpec,
    playbook: Playbook.Bundle,
    vault: Vault
  ): Promise<Result<C, ConfigFailures>>;
  run(
    config: C,
    spec: BundledSwaggerOrOasSpec,
    playbook: Playbook.Bundle,
    vault: Vault
  ): TestStageGenerator;
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
