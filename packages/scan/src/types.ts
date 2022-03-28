import { ScanResponse } from "@xliic/common/messages/scan";
import { TryItResponse } from "@xliic/common/messages/tryit";

export interface HostApplication {
  postMessage(message: ScanResponse | TryItResponse): void;
}
