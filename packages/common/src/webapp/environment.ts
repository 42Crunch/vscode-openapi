import { Webapp as App } from "../message";
import { LoadEnvMessage, SaveEnvMessage } from "../env";
import { ChangeThemeMessage } from "../theme";

export type Webapp = App<
  // consumes
  LoadEnvMessage | ChangeThemeMessage,
  // produces
  SaveEnvMessage
>;
