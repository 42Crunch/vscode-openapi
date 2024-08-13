import * as vscode from "vscode";
import { requestToken } from "./audit/client";
import { Configuration } from "./configuration";
import { PlatformConnection } from "./platform/types";
import { deriveServices } from "./util/config";
import { delay } from "./time-util";
import { Config } from "@xliic/common/config";
import { SignUpWebView, TokenType } from "./webapps/signup/view";

export async function hasCredentials(
  configuration: Configuration,
  secrets: vscode.SecretStorage
): Promise<TokenType> {
  const platformAuthType = configuration.get<Config["platformAuthType"] | "">("platformAuthType");
  const anondToken = getAnondCredentials(configuration);
  const apiToken = await secrets.get("platformApiToken");

  // if platformAuthType is set, use it else try to derive from the available tokens
  if (platformAuthType === "anond-token" && anondToken) {
    return "anond-token";
  } else if (platformAuthType === "api-token" && apiToken) {
    return "api-token";
  } else if (anondToken) {
    return "anond-token";
  } else if (apiToken) {
    return "api-token";
  }

  return undefined;
}

export async function ensureHasCredentials(
  signUpWebView: SignUpWebView,
  configuration: Configuration,
  secrets: vscode.SecretStorage
): Promise<boolean> {
  const credentials = await hasCredentials(configuration, secrets);
  if (credentials === undefined) {
    // try asking for credentials if not found
    const configured = await configureCredentials(signUpWebView);
    if (configured === undefined) {
      // or don't do audit if no credentials been supplied
      return false;
    } else {
      return true;
    }
  }
  return true;
}

export function getAnondCredentials(configuration: Configuration): string {
  return <string>configuration.get("securityAuditToken");
}

export async function getPlatformCredentials(
  configuration: Configuration,
  secrets: vscode.SecretStorage
): Promise<PlatformConnection | undefined> {
  const platformUrl = configuration.get<string>("platformUrl")!;
  const services = configuration.get<string>("platformServices")!;
  const apiToken = await secrets.get("platformApiToken");

  if (platformUrl && apiToken) {
    // favour services specified in the configuration, else try
    // to derive services from the platformUrl
    if (services) {
      return {
        platformUrl,
        services,
        apiToken,
      };
    }
    return {
      platformUrl,
      services: deriveServices(platformUrl),
      apiToken,
    };
  }
}

export async function configureCredentials(signUpWebView: SignUpWebView): Promise<TokenType> {
  return new Promise<TokenType>((resolve, _reject) => {
    signUpWebView.showSignUp(resolve);
  });
}
