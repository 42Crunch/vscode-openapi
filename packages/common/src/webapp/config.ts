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
  ShowCliTestMessage,
  TestCliMessage,
  DownloadCliMessage,
  ShowCliDownloadMessage,
} from "../config";
import { ChangeThemeMessage } from "../theme";
import { OpenLinkMessage } from "../link";

export type Webapp = App<
  // consumes
  | ChangeThemeMessage
  | LoadConfigMessage
  | ShowPlatformConnectionTestMessage
  | ShowOverlordConnectionTestMessage
  | ShowScandManagerConnectionTestMessage
  | ShowCliTestMessage
  | ShowCliDownloadMessage,
  // produces
  | SaveConfigMessage
  | TestPlatformConnectionMessage
  | TestOverlordConnectionMessage
  | TestScandManagerConnectionMessage
  | TestCliMessage
  | DownloadCliMessage
  | OpenLinkMessage
>;
