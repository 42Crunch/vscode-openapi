import { Webapp as App } from "../message";
import { SaveScanconfMessage } from "../playbook";
import { ShowScanconfOperationMessage, RunScanMessage, RunFullScanMessage } from "../scanconf";
import { ChangeThemeMessage } from "../theme";
import { ShowEnvWindow, LoadEnvMessage } from "../env";
import { LoadConfigMessage } from "../config";
import { OpenLinkMessage } from "../link";

import { SendHttpRequestMessage, ShowHttpResponseMessage, ShowHttpErrorMessage } from "../http";
import { LoadPreferencesMessage, SavePreferencesMessage } from "../prefs";

export type Webapp = App<
  // consumes
  | ChangeThemeMessage
  | ShowScanconfOperationMessage
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
  | RunFullScanMessage
  | OpenLinkMessage
>;
