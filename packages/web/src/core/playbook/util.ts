import { Playbook } from "@xliic/scanconf";
import { OpenApi30, Swagger } from "@xliic/openapi";

export function checkCredential(
  credential: Playbook.Credential,
  scheme: OpenApi30.SecurityScheme | Swagger.SecurityScheme
): boolean {
  if (scheme.type === credential.type && scheme.in === credential.in) {
    return true;
  } else if (scheme.type === "http" && credential.type == "basic" && scheme.in === credential.in) {
    return true;
  } else if (scheme.type === "basic" && credential.type == "basic" && scheme.in === credential.in) {
    return true;
  } else if (scheme.type === "http" && scheme.scheme == "bearer" && credential.type === "bearer") {
    return true;
  }

  return false;
}

export function parseHttpsHostname(url: string): [boolean, string] {
  try {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === "https:";
    const hostname = urlObj.hostname.toLowerCase();
    return [isHttps, hostname];
  } catch (e) {
    return [false, ""];
  }
}
