import { Webapp as App } from "../message";
import { SendHttpRequestMessage, ShowHttpResponseMessage, ShowHttpErrorMessage } from "../http";
import { TryOperationMessage, CreateSchemaCommandMessage, SaveConfigMessage } from "../tryit";
import { LoadPreferencesMessage, SavePreferencesMessage } from "../prefs";
import { LoadEnvMessage, ShowEnvWindow } from "../env";
import { ChangeThemeMessage } from "../theme";

export type Webapp = App<
  // consumes
  | TryOperationMessage
  | ShowHttpResponseMessage
  | ShowHttpErrorMessage
  | LoadEnvMessage
  | LoadPreferencesMessage
  | ChangeThemeMessage,
  // produces
  | SendHttpRequestMessage
  | CreateSchemaCommandMessage
  | SaveConfigMessage
  | ShowEnvWindow
  | SavePreferencesMessage
>;
