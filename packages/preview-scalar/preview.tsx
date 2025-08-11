import { useEffect, useState } from "react";
import { ApiReferenceReact } from "@scalar/api-reference-react"
import "@scalar/api-reference-react/style.css"

declare var acquireVsCodeApi: any;

export const Preview = () => {
  const [oas, setOas] = useState(null);

  useEffect(() => {
    const vscode = acquireVsCodeApi();

    window.addEventListener("message", (event) => {
      const message = event.data;
      switch (message.command) {
        case "preview":
          const oas = JSON.parse(message.text);
          setOas(oas);
          break;
      }
    });
    vscode.postMessage({ command: "init" });
  }, []);

  if (!oas) {
    return <p>Loading...</p>;
  }

  return <ApiReferenceReact
    configuration={{
      content: oas,
      hideSearch: true,
      hideDownloadButton: true,
    }}
  />
};
