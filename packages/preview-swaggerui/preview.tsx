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
          globalThis["previewPayload"] = message.text;
          setOas(JSON.parse(message.text));
          setVersion(Date.now());
          break;
        case "changeTheme":
          if (message.payload.kind === "dark" || message.payload.kind === "highContrast") {
            document.documentElement.classList.add("dark-mode");
          } else {
            document.documentElement.classList.remove("dark-mode");
          }
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
