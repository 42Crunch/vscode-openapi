import { Webapp as App } from "../message";
import { LoadVaultMessage, SaveVaultMessage } from "../vault";
import { ChangeThemeMessage } from "../theme";

export type Webapp = App<
  // consumes
  ChangeThemeMessage | LoadVaultMessage,
  // produces
  SaveVaultMessage
>;
