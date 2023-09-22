import { Webapp as App } from "../message";
import { SaveScanconfMessage, UpdateScanconfMessage } from "../playbook";
import { ShowScanconfAuthMessage, ShowScanconfOperationMessage } from "../scanconf";
import { ChangeThemeMessage } from "../theme";
import { ShowEnvWindow, LoadEnvMessage } from "../env";

import { SendHttpRequestMessage, ShowHttpResponseMessage, ShowHttpErrorMessage } from "../http";

export type Webapp = App<
  // consumes
  | ChangeThemeMessage
  | ShowScanconfAuthMessage
  | ShowScanconfOperationMessage
  | UpdateScanconfMessage
  | ShowHttpResponseMessage
  | ShowHttpErrorMessage
  | LoadEnvMessage,
  // produces
  SaveScanconfMessage | SendHttpRequestMessage | ShowEnvWindow
>;
