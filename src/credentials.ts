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
  const credentials = undefined; //await hasCredentials(configuration, secrets);
  if (credentials === undefined) {
    // try asking for credentials if not found
    const configured = await configureCredentials(signUpWebView);
    if (configured === undefined) {
      // or don't do audit if no credentials been supplied
      return false;
    } else {
      await delay(3000);
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

async function chooseNewOrExisting(): Promise<"existing" | "new" | undefined> {
  await delay(100); // workaround for #133073
  const options = [
    "I have an existing 42Crunch Platform account",
    "I'm a new user, please email me the token",
  ];
  const response = await vscode.window.showInformationMessage(
    "VS Code needs an API key to use the service.",
    {
      detail:
        "42Crunch Audit runs 300+ checks for security best practices in your API. Use your existing platform credentials or provide an email to receive a freemium token.",
      modal: true,
    },
    ...options
  );
  if (response === options[0]) {
    return "existing";
  }
  if (response === options[1]) {
    return "new";
  }
  return undefined;
}

async function configureAnondUser(configuration: Configuration): Promise<boolean> {
  const email = await vscode.window.showInputBox({
    prompt: "Enter your email to receive the token.",
    ignoreFocusOut: true,
    placeHolder: "email address",
    validateInput: (value) =>
      value.indexOf("@") > 0 && value.indexOf("@") < value.length - 1
        ? null
        : "Please enter valid email address",
  });

  if (!email) {
    return false;
  }

  const tokenRequestResult = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: "Requesting token" },
    async (progress, token) => {
      try {
        return await requestToken(email);
      } catch (e) {
        vscode.window.showErrorMessage("Unexpected error when trying to request token: " + e);
      }
    }
  );

  if (!tokenRequestResult || tokenRequestResult.status !== "success") {
    return false;
  }

  const token = await vscode.window.showInputBox({
    prompt:
      "The token has been sent. If you don't get the mail within a couple minutes, check your spam folder and that the address is correct. Paste the token above.",
    ignoreFocusOut: true,
    placeHolder: "token",
  });

  if (!token) {
    return false;
  }

  await configuration.update("securityAuditToken", token, vscode.ConfigurationTarget.Global);
  await configuration.update("platformAuthType", "anond-token", vscode.ConfigurationTarget.Global);

  return true;
}

export async function configurePlatformUser(
  configuration: Configuration,
  secrets: vscode.SecretStorage
): Promise<boolean> {
  const platformUrl = await vscode.window.showInputBox({
    prompt: "Enter 42Crunch platform URL",
    placeHolder: "platform url",
    value: "https://platform.42crunch.com/",
    ignoreFocusOut: true,
    validateInput: (input) => {
      try {
        const url = vscode.Uri.parse(input, true);
        if (url.scheme !== "https") {
          return 'URL scheme must be "https"';
        }
        if (!url.authority) {
          return "URL authority must not be empty";
        }
        if (url.path != "/") {
          return "URL path must be empty";
        }
      } catch (ex) {
        return `${ex}`;
      }
    },
  });

  if (!platformUrl) {
    return false;
  }

  const UUID_REGEX =
    /^(ide_|api_)?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const token = await vscode.window.showInputBox({
    prompt: "Enter 42Crunch IDE token",
    placeHolder: "IDE Token",
    ignoreFocusOut: true,
    validateInput: (input) => {
      if (!input || !input.match(UUID_REGEX)) {
        return "Must be a valid IDE Token";
      }
    },
  });

  if (!token) {
    return false;
  }

  await configuration.update(
    "platformUrl",
    vscode.Uri.parse(platformUrl).toString(),
    vscode.ConfigurationTarget.Global
  );

  await secrets.store("platformApiToken", token);
  await configuration.update("platformAuthType", "api-token", vscode.ConfigurationTarget.Global);

  return true;
}
