import { Webapp as App } from "../message";
import { SaveScanconfMessage, UpdateScanconfMessage } from "../playbook";
import { ShowScanconfOperationMessage, RunScanMessage } from "../scanconf";
import { ChangeThemeMessage } from "../theme";
import { ShowEnvWindow, LoadEnvMessage } from "../env";
import { LoadConfigMessage } from "../config";

import { SendHttpRequestMessage, ShowHttpResponseMessage, ShowHttpErrorMessage } from "../http";
import { LoadPreferencesMessage, SavePreferencesMessage } from "../prefs";

export type Webapp = App<
  // consumes
  | ChangeThemeMessage
  | ShowScanconfOperationMessage
  | UpdateScanconfMessage
  | ShowHttpResponseMessage
  | ShowHttpErrorMessage
  | LoadEnvMessage
  | LoadPreferencesMessage
  | LoadConfigMessage,
  // produces
  | SaveScanconfMessage
  | SavePreferencesMessage
  | SendHttpRequestMessage
  | ShowEnvWindow
  | RunScanMessage
>;
