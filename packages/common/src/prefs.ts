export type SecretsForSecurity = Record<string, string>;

export interface Preferences {
  scanServer: string;
  tryitServer: string;
  security: SecretsForSecurity;
  useGlobalBlocks: boolean;
  rejectUnauthorized: boolean;
}

export type LoadPreferencesMessage = { command: "loadPrefs"; payload: Preferences };
export type SavePreferencesMessage = { command: "savePrefs"; payload: Preferences };
