import { FullDataDictionary } from "../data-dictionary";

declare type ShowDictionaryMessage = {
  command: "showDictionary";
  payload: FullDataDictionary[];
};

declare type NoopMessage = {
  command: "noop";
  payload: unknown;
};

export declare type DataDictionaryRequest = ShowDictionaryMessage;
export declare type DataDictionaryResponse = NoopMessage;
