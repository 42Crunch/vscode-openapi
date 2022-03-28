import { DataDictionaryResponse } from "@xliic/common/messages/data-dictionary";

export interface HostApplication {
  postMessage(message: DataDictionaryResponse): void;
}
