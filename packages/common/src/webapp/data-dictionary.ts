import { Webapp as App, NoopMessage } from "../message";
import { ShowDictionaryMessage } from "../data-dictionary";
import { ChangeThemeMessage } from "../theme";

export type Webapp = App<
  // consumes
  ShowDictionaryMessage | ChangeThemeMessage,
  // produces
  NoopMessage
>;
