import { Webapp as App } from "../message";
import {
  LoadConfigMessage,
  SaveConfigMessage,
  TestPlatformConnectionMessage,
  ShowPlatformConnectionTestMessage,
  TestOverlordConnectionMessage,
  ShowOverlordConnectionTestMessage,
} from "../config";
import { ChangeThemeMessage } from "../theme";

export type Webapp = App<
  // consumes
  | ChangeThemeMessage
  | LoadConfigMessage
  | ShowPlatformConnectionTestMessage
  | ShowOverlordConnectionTestMessage,
  // produces
  SaveConfigMessage | TestPlatformConnectionMessage | TestOverlordConnectionMessage
>;
