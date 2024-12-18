import {
  BrowseFiles,
  DownloadFile,
  Convert,
  ShowCaptureWindow,
  SaveCapture,
  DeleteJob,
} from "../capture";
import { OpenLinkMessage } from "../link";
import { Webapp as App } from "../message";
import { ChangeThemeMessage } from "../theme";

export type Webapp = App<
  // consumes
  ChangeThemeMessage | ShowCaptureWindow | SaveCapture,
  // produces
  BrowseFiles | Convert | DownloadFile | DeleteJob | OpenLinkMessage
>;
