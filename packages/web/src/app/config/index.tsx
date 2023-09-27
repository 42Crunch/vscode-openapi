import { Webapp } from "@xliic/common/webapp/config";
import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import styled from "styled-components";
import ThemeStyles from "../../features/theme/ThemeStyles";
import { ThemeState } from "../../features/theme/slice";
import { makeWebappMessageHandler } from "../webapp";
import Config from "./Config";
import { createListener } from "./listener";
import { initStore, messageHandlers } from "./store";

function renderWebView(host: Webapp["host"], theme: ThemeState) {
  const store = initStore(createListener(host), theme);

  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Provider store={store}>
        <App>
          <ThemeStyles />
          <Config />
        </App>
      </Provider>
    </React.StrictMode>
  );

  window.addEventListener("message", makeWebappMessageHandler(store, messageHandlers));
}

(window as any).renderWebView = renderWebView;

const App = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  > div:last-child {
    flex: 1;
  }
`;
