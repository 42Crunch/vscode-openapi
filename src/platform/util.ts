import path from "path";
import * as vscode from "vscode";
import { NamingConvention, platformUriScheme } from "./types";

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

export function createNamingConventionInputBoxOptions(convention: NamingConvention) {
  const example = convention.example;
  const pattern = convention.pattern;
  const description = convention.description;
  return {
    prompt: `Example: ${example}`,
    validateInput: (input: string): string | undefined => {
      if (!input.match(pattern)) {
        return `The input does not match the expected pattern "${description}" defined in your organization. Example of the expected value: "${example}"`;
      }
    },
  };
}
