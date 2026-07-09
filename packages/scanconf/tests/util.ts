import { assert } from "vitest";
import { makeOasHelpers, parse } from "../src/index";

export function parseScenario(oas: any, scenario: any) {
  const [file, error] = parse(makeOasHelpers(oas), scenario);

  if (error !== undefined) {
    assert.fail("Error parsing config: " + JSON.stringify(error));
  }

  return file;
}
