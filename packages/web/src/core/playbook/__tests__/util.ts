import { HttpError, HttpRequest, HttpResponse } from "@xliic/common/http";
import { expect, assert } from "vitest";
import { PlaybookExecutorStep } from "../playbook";
import { executeHttpRequest, httpClient } from "./httpclient";
import { parse } from "../scanconf-parser";
import * as scan from "../scanconfig";
import { executeAllPlaybooks } from "../execute";
import * as playbook from "@xliic/common/playbook";
import { PlaybookEnv } from "../playbook-env";

export function makeStepAssert(steps: PlaybookExecutorStep[]) {
  return (obj: any) => expect(steps.shift()).toMatchObject(obj);
}

export function parseScenario(oas: any, scenario: scan.ConfigurationFileBundle) {
  const [file, error] = parse(oas, scenario);

  if (error !== undefined) {
    assert.fail("Error parsing config: " + JSON.stringify(error));
  }

  return file;
}

export async function runScenario(
  oas: any,
  file: playbook.PlaybookBundle,
  vars: PlaybookEnv,
  name: string
): Promise<PlaybookExecutorStep[]> {
  const steps = [];

  for await (const step of executeAllPlaybooks(
    httpClient,
    oas,
    "http://localhost:8090",
    file,
    {
      default: {},
      secrets: {},
    },
    [vars],
    [["test", file.operations[name].scenarios[0].requests]]
  )) {
    steps.push(step);
  }

  return steps;
}
