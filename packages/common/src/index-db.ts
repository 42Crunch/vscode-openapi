export type TextChunk = {
  id: number;
  file: string;
  textSegment: string;
  progress: number; // 0 <= value <= 1, 1 = means the last chunk has been sent
};

export type StartInitDbMessage = {
  command: "startInitDb";
  payload: undefined; // todo: pass dbName
};

export type ParseChunkMessage = {
  command: "parseChunk";
  payload: TextChunk;
};

export type SendParseChunkCompleteMessage = {
  // todo: add parsing error handling
  command: "sendParseChunkComplete";
  payload: { id: number };
};

export type CloseInitDbMessage = {
  command: "closeInitDb";
  payload: undefined;
};

export type SendInitDbCompleteMessage = {
  command: "sendInitDbComplete";
  payload: { status: boolean; message: string };
};
