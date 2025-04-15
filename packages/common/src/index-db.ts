export type TextChunk = {
  id: number;
  file: string;
  textSegment: string;
  progress: number; // 0 <= value <= 1, 1 = means the last chunk has been sent
};

export type StartInitDbMessage = {
  command: "startInitDb";
  payload: undefined;
};

export type ParseChunkMessage = {
  command: "parseChunk";
  payload: TextChunk;
};

export type SendParseChunkCompleteMessage = {
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
