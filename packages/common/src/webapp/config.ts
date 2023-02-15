import { Webapp as App } from "../message";
import {
  LoadConfigMessage,
  SaveConfigMessage,
  TestPlatformConnectionMessage,
  ShowPlatformConnectionTestMessage,
  TestOverlordConnectionMessage,
  ShowOverlordConnectionTestMessage,
  TestScandManagerConnectionMessage,
  ShowScandManagerConnectionTestMessage,
} from "../config";
import { ChangeThemeMessage } from "../theme";

export type Webapp = App<
  // consumes
  | ChangeThemeMessage
  | LoadConfigMessage
  | ShowPlatformConnectionTestMessage
  | ShowOverlordConnectionTestMessage
  | ShowScandManagerConnectionTestMessage,
  // produces
  | SaveConfigMessage
  | TestPlatformConnectionMessage
  | TestOverlordConnectionMessage
  | TestScandManagerConnectionMessage
>;
