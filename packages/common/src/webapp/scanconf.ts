import { Webapp as App } from "../message";
import { SaveScanconfMessage } from "../playbook";
import {
  ShowScanconfOperationMessage,
  RunScanMessage,
  RunFullScanMessage,
  LoadUpdatedScanconf,
  UpdateScanconf,
} from "../scanconf";
import { ChangeThemeMessage } from "../theme";
import { ShowEnvWindow, LoadEnvMessage } from "../env";
import { LoadConfigMessage } from "../config";
import { OpenLinkMessage } from "../link";
import { ShowGeneralErrorMessage } from "../error";
import { SendHttpRequestMessage, ShowHttpResponseMessage, ShowHttpErrorMessage } from "../http";
import { LoadPreferencesMessage, SavePreferencesMessage } from "../prefs";
import { LoadVaultMessage } from "../vault";

export type Webapp = App<
  // consumes
  | ChangeThemeMessage
  | ShowScanconfOperationMessage
  | ShowHttpResponseMessage
  | ShowHttpErrorMessage
  | ShowGeneralErrorMessage
  | LoadEnvMessage
  | LoadPreferencesMessage
  | LoadConfigMessage
  | LoadVaultMessage
  | LoadUpdatedScanconf,
  // produces
  | SaveScanconfMessage
  | SavePreferencesMessage
  | SendHttpRequestMessage
  | ShowEnvWindow
  | RunScanMessage
  | RunFullScanMessage
  | OpenLinkMessage
  | UpdateScanconf
>;
