import path from "path";
import * as vscode from "vscode";

import {
  NamingConvention,
  DefaultApiNamingPattern,
  DefaultCollectionNamingPattern,
} from "@xliic/common/platform";

import { platformUriScheme } from "./types";

export async function confirmed(prompt: string) {
  const confirmation = await vscode.window.showInformationMessage(prompt, "Yes", "Cancel");
  return confirmation && confirmation === "Yes";
}

export function isPlatformUri(uri: vscode.Uri) {
  return uri.scheme === platformUriScheme;
}

export function makePlatformUri(apiId: string) {
  return vscode.Uri.parse(`${platformUriScheme}://42crunch.com/apis/${apiId}.json`);
}

export function getApiId(uri: vscode.Uri): string | undefined {
  if (isPlatformUri(uri)) {
    const apiId = path.basename(uri.fsPath, ".json");
    return apiId;
  }
}

export function makeIcon(
  extensionUri: vscode.Uri,
  icon: string | { dark: string; light: string }
):
  | vscode.ThemeIcon
  | {
      light: vscode.Uri;
      dark: vscode.Uri;
    } {
  if (typeof icon === "string") {
    return new vscode.ThemeIcon(icon);
  }
  return {
    light: vscode.Uri.parse(extensionUri.toString() + `/resources/light/${icon.light}.svg`),
    dark: vscode.Uri.parse(extensionUri.toString() + `/resources/dark/${icon.dark}.svg`),
  };
}

function createNamingConventionInputBoxOptions(
  convention: NamingConvention,
  defaultPattern: string
) {
  const { pattern, description, example } = convention;
  const prompt = example !== "" ? `Example: ${example}` : undefined;
  return {
    prompt,
    validateInput: (input: string): string | undefined => {
      if (pattern !== "" && !input.match(pattern)) {
        return `The input does not match the expected pattern "${description}" defined in your organization. Example of the expected value: "${example}"`;
      }
      if (!input.match(defaultPattern)) {
        return `The input does not match the expected pattern "${defaultPattern}"`;
      }
    },
  };
}

export function createApiNamingConventionInputBoxOptions(convention: NamingConvention) {
  return createNamingConventionInputBoxOptions(convention, DefaultApiNamingPattern);
}

export function createCollectionNamingConventionInputBoxOptions(convention: NamingConvention) {
  return createNamingConventionInputBoxOptions(convention, DefaultCollectionNamingPattern);
}

export function formatException(info: string, ex: any) {
  const message = ex?.message;
  const transactionId = ex?.response?.headers?.["x-42c-transactionid"]
    ? `Transaction ID: ${ex.response.headers["x-42c-transactionid"]}`
    : undefined;
  const body = ex?.response?.body ? JSON.stringify(ex.response.body) : undefined;

  return [info, message, transactionId, body].filter((part) => part !== undefined).join(" ");
}
