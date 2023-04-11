import { Webapp as App } from "../message";
import {
  LoadConfigMessage,
  SaveConfigMessage,
  TestPlatformConnectionMessage,
  ShowPlatformConnectionTestMessage,
} from "../config";
import { ChangeThemeMessage } from "../theme";

export type Webapp = App<
  // consumes
  LoadConfigMessage | ShowPlatformConnectionTestMessage | ChangeThemeMessage,
  // produces
  SaveConfigMessage | TestPlatformConnectionMessage
>;
