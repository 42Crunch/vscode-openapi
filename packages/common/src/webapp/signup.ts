import { Webapp as App } from "../message";
import { ChangeThemeMessage } from "../theme";
import { OpenLinkMessage } from "../link";
import {
  AnondSignUpComplete,
  PlatformSignUpComplete,
  RequestAnondTokenByEmail,
  ShowPlatformConnectionTestErrorMessage,
  ShowAnondTokenResponseMessage,
} from "../signup";

export type Webapp = App<
  // consumes
  ChangeThemeMessage | ShowPlatformConnectionTestErrorMessage | ShowAnondTokenResponseMessage,
  // produces
  RequestAnondTokenByEmail | OpenLinkMessage | AnondSignUpComplete | PlatformSignUpComplete
>;
