import { BrowseFile, Convert, SendFileSegment, ShowBrowseFile } from "../bigfiles";
import { Webapp as App } from "../message";
import { ChangeThemeMessage } from "../theme";

export type Webapp = App<
  // consumes
  ChangeThemeMessage | ShowBrowseFile | SendFileSegment,
  // produces
  BrowseFile | Convert
>;
