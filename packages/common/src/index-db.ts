export type ParseChunkMessage = {
  command: "parseChunk";
  payload: string | null;
};

export type ParseChunkCompletedMessage = {
  command: "parseChunkCompleted";
  payload: undefined;
};

// export type TextChunk = {
//   id: number;
//   file: string;
//   textSegment: string;
//   progress: number; // 0 <= value <= 1, 1 = means the last chunk has been sent
// };
