import { Webapp as App } from "../message";
import { ChangeThemeMessage } from "../theme";
import { OpenLinkMessage } from "../link";
import {
  AnondSignUpComplete,
  PlatformSignUpComplete,
  RequestAnondTokenByEmail,
  ShowPlatformConnectionTestErrorMessage,
  ShowAnondTokenResponseMessage,
  SetSignupType,
} from "../signup";

export type Webapp = App<
  // consumes
  | ChangeThemeMessage
  | SetSignupType
  | ShowPlatformConnectionTestErrorMessage
  | ShowAnondTokenResponseMessage,
  // produces
  RequestAnondTokenByEmail | OpenLinkMessage | AnondSignUpComplete | PlatformSignUpComplete
>;
