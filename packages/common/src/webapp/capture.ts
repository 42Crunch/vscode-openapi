import {
  SelectFiles,
  DownloadFile,
  Convert,
  ShowCaptureWindow,
  SaveCapture,
  DeleteJob,
  SaveCaptureSettings,
} from "../capture";
import { OpenLinkMessage } from "../link";
import { Webapp as App } from "../message";
import { ChangeThemeMessage } from "../theme";

export type Webapp = App<
  // consumes
  ChangeThemeMessage | ShowCaptureWindow | SaveCapture,
  // produces
  SelectFiles | Convert | DownloadFile | DeleteJob | OpenLinkMessage | SaveCaptureSettings
>;
