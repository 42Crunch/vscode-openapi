import * as ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";

import "./styles.css";

import { Preview } from "./preview";

const originalFetch = globalThis.fetch;

globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = input instanceof URL ? input.toString() : input.toString();

  if (url.startsWith("http://openapi-preview.example/")) {
    return Promise.resolve(
      new Response(globalThis["previewPayload"]! as string, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      })
    );
  }

  // Pass through all other requests to the original fetch
  return originalFetch(input, init);
};

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<Preview />);
