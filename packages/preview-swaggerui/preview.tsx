import { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

declare var acquireVsCodeApi: any;

export const Preview = () => {
  const [oas, setOas] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const vscode = acquireVsCodeApi();

    window.addEventListener("message", (event) => {
      const message = event.data;
      switch (message.command) {
        case "preview":
          console.log("Received message:", version, message);
          globalThis["previewPayload"] = message.text;
          setOas(JSON.parse(message.text));
          setVersion(Date.now());
          break;
      }
    });
    vscode.postMessage({ command: "init" });
  }, []);

  if (version === 0) {
    return <p>Loading...</p>;
  }

  return <SwaggerUI spec={oas} url="http://openapi-preview.example/" />;
};
