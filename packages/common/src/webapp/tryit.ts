import { Webapp as App } from "../message";
import { SendHttpRequestMessage, ShowHttpResponseMessage, ShowHttpErrorMessage } from "../http";
import { TryOperationMessage, CreateSchemaCommandMessage } from "../tryit";
import { LoadPreferencesMessage, SavePreferencesMessage } from "../prefs";
import { LoadEnvMessage, ShowEnvWindow } from "../env";
import { ChangeThemeMessage } from "../theme";
import { LoadConfigMessage, SaveConfigMessage } from "../config";

export type Webapp = App<
  // consumes
  | TryOperationMessage
  | ShowHttpResponseMessage
  | ShowHttpErrorMessage
  | LoadEnvMessage
  | LoadPreferencesMessage
  | LoadConfigMessage
  | ChangeThemeMessage,
  // produces
  | SendHttpRequestMessage
  | CreateSchemaCommandMessage
  | ShowEnvWindow
  | SavePreferencesMessage
  | SaveConfigMessage
>;
