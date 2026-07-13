export type Base64EncodedFileContent = {
  filename: string;
  content: string;
};

export type SelectFileMessage = {
  command: "selectFile";
  payload: { id: string; title: string; extensions: string[] };
};

export type LoadFileMessage = {
  command: "loadFile";
  payload: { id: string; file: Base64EncodedFileContent };
};

export type CancelFileMessage = {
  command: "cancelFile";
  payload: { id: string };
};
