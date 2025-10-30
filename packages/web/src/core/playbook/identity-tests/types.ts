import { Vault } from "@xliic/common/vault";
import { BundledSwaggerOrOasSpec } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";
import { PlaybookExecutorStep } from "../playbook";
import { HttpClient } from "@xliic/common/http";

export type TestSuite = {
  id: string;
  description?: string;
  requirements: [string, (spec: BundledSwaggerOrOasSpec, vault: Vault) => string[]][];
  tests: Test[];
};

export type TestExecutor = (
  client: HttpClient,
  oas: BundledSwaggerOrOasSpec,
  playbook: Playbook.Bundle,
  vault: Vault,
  test: Test,
  config: TestConfiguration
) => AsyncGenerator<PlaybookExecutorStep>;

export type Test = {
  id: string;
  requirements: [string, (spec: BundledSwaggerOrOasSpec, vault: Vault) => string[]][];
  generate: (value: string) => string[];
  execute: TestExecutor;
};

export type TestConfiguration = {
  failures: string[];
};

export type SuiteConfiguration = {
  failures: Record<string, string[]>;
  tests: Record<string, TestConfiguration>;
};
