import { Webapp as App } from "../message";
import { LoadConfigMessage, SaveConfigMessage } from "../config";
import { ChangeThemeMessage } from "../theme";

export type Webapp = App<
  // consumes
  LoadConfigMessage | ChangeThemeMessage,
  // produces
  SaveConfigMessage
>;
