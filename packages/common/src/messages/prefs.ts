export type SecretsForSecurity = Record<string, string>;

export interface Preferences {
  scanServer: string;
  tryitServer: string;
  security: SecretsForSecurity;
}

export type LoadPrefs = { command: "loadPrefs"; payload: Preferences };
type PrefRequest = LoadPrefs;

export type SavePrefs = { command: "savePrefs"; payload: Preferences };
type PrefResponse = SavePrefs;

export type { PrefRequest, PrefResponse };
