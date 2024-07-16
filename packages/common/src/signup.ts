export type AnondCredentials = {
  email: string;
  anondToken: string;
};

export type AnondTokenResponseResult = { success: true } | { success: false; message: string };

export type ShowAnondTokenResponseMessage = {
  command: "showAnondTokenResponse";
  payload: AnondTokenResponseResult;
};

export type RequestAnondTokenByEmail = {
  command: "requestAnondTokenByEmail";
  payload: string;
};

export type AnondSignUpComplete = {
  command: "anondSignUpComplete";
  payload: AnondCredentials;
};

export type PlatformCredentials = {
  platformUrl: string;
  platformApiToken: string;
};

export type PlatformConnectionTestError = { error: string };

export type ShowPlatformConnectionTestErrorMessage = {
  command: "showPlatformConnectionTestError";
  payload: PlatformConnectionTestError;
};

export type PlatformSignUpComplete = {
  command: "platformSignUpComplete";
  payload: PlatformCredentials;
};
