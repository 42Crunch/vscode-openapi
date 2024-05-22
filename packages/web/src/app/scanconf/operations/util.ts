import { Scanconf } from "@xliic/scanconf";

export function extractScanconf(
  mutable: Scanconf.ConfigurationFileBundle,
  operationId: string
): string {
  if (mutable.operations !== undefined) {
    for (const key of Object.keys(mutable?.operations)) {
      if (key !== operationId) {
        mutable.operations[key].scenarios = [];
        mutable.operations[key].before = [];
        mutable.operations[key].after = [];
        mutable.operations[key].customTests = [];
        mutable.operations[key].authorizationTests = [];
      }
    }
  }
  return JSON.stringify(mutable, null, 2);
}

export function optionallyReplaceLocalhost(
  server: string,
  platformAuthType: "anond-token" | "api-token",
  runtime: "docker" | "scand-manager" | "cli",
  replaceLocalhost: boolean,
  platform: string
) {
  if (
    platformAuthType === "api-token" &&
    runtime == "docker" &&
    replaceLocalhost &&
    (platform === "darwin" || platform === "win32") &&
    (server.toLowerCase().startsWith("https://localhost") ||
      server.toLowerCase().startsWith("http://localhost"))
  ) {
    return server.replace(/localhost/i, "host.docker.internal");
  }
  return server;
}
