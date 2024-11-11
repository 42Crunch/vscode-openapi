import { Webapp as App } from "../message";
import { ChangeThemeMessage } from "../theme";
import { LoadTags, SaveTags } from "../tags";
import { SendHttpRequestMessage, ShowHttpResponseMessage, ShowHttpErrorMessage } from "../http";
import { LoadConfigMessage } from "../config";

export type Webapp = App<
  // consumes
  | ChangeThemeMessage
  | LoadConfigMessage
  | LoadTags
  | ShowHttpResponseMessage
  | ShowHttpErrorMessage,
  // produces
  SaveTags | SendHttpRequestMessage
>;
