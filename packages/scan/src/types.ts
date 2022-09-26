import { ThemeRequests } from "@xliic/common/messages/theme";
import { ScanRequest, ScanResponse } from "@xliic/common/messages/scan";
import { TryItRequest, TryItResponse } from "@xliic/common/messages/tryit";
import { EnvRequest, EnvResponse } from "@xliic/common/messages/env";
import { PrefRequest, PrefResponse } from "@xliic/common/messages/prefs";

type WebAppResponse = ScanResponse | TryItResponse | EnvResponse | PrefResponse;

export interface HostApplication {
  postMessage(message: WebAppResponse): void;
}

export type WebAppRequest = ThemeRequests | ScanRequest | TryItRequest | EnvRequest | PrefRequest;
