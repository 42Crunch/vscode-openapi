import { assert } from "vitest";
import { parse } from "../src/index";

export function parseScenario(oas: any, scenario: any) {
  const [file, error] = parse(oas, scenario);

  if (error !== undefined) {
    assert.fail("Error parsing config: " + JSON.stringify(error));
  }

  return file;
}
