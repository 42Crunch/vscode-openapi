import { Base64EncodedFileContent } from "@xliic/common/file-picker";

export function webappFilePicker(
  dispatch: (id: string, title: string, extensions: string[]) => void
): (title: string, extensions: string[]) => Promise<Base64EncodedFileContent | undefined> {
  return async function pickFile(title: string, extensions: string[]) {
    const id = crypto.randomUUID();
    const response = receive(id);
    dispatch(id, title, extensions);
    return response;
  };
}

async function receive(id: string): Promise<Base64EncodedFileContent | undefined> {
  return new Promise((resolve) => {
    function messageHandler(event: any) {
      const { command, payload } = event.data;
      if (command === "loadFile" && payload.id === id) {
        window.removeEventListener("message", messageHandler);
        resolve(payload.file);
      } else if (command === "cancelFile" && payload.id === id) {
        window.removeEventListener("message", messageHandler);
        resolve(undefined);
      }
    }

    window.addEventListener("message", messageHandler);
  });
}
