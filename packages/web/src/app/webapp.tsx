import styled from "styled-components";
import { ErrorBoundary } from "react-error-boundary";

import ThemeStyles from "../features/theme/ThemeStyles";
import Router from "../features/router/Router";
import Navigation from "../features/router/Navigation";
import ConfirmationDialog from "../features/confirmation-dialog/ConfirmationDialog";

export function makeWebappMessageHandler(store: any, handlers: any) {
  return function webappMessageHandler(event: MessageEvent<any>) {
    const { command, payload } = event.data;
    if (command) {
      const handler = handlers[command];
      if (handler) {
        const action = handler(payload);
        if (action) {
          store.dispatch(action);
        } else {
          console.log(`Skipping dispatch for command: ${command}`);
        }
      } else {
        console.error(`Unable to find handler for command: ${command}`);
      }
    } else {
      console.error("Received message with unknown command", event.data);
    }
  };
}

export function startListeners(listeners: Record<string, (() => unknown) | undefined>) {
  const listenerNames = Object.keys(listeners);
  for (const listenerName of listenerNames) {
    if (listeners[listenerName]) {
      console.log("starting listener for: ", listenerName);
      listeners[listenerName]();
    } else {
      console.log("skipping listener for: ", listenerName);
    }
  }
}

function Fallback({ error }: { error: Error }) {
  return (
    <div>
      <p>Unexpected error:</p>
      <pre>{error.message}</pre>
    </div>
  );
}

export function RouterApp() {
  return (
    <ErrorBoundary FallbackComponent={Fallback}>
      <ThemeStyles />
      <Router />
    </ErrorBoundary>
  );
}

export function NavigationRouterApp() {
  return (
    <ErrorBoundary FallbackComponent={Fallback}>
      <ThemeStyles />
      <ConfirmationDialog />
      <NavigationContainer>
        <Navigation />
      </NavigationContainer>
      <ContentContainer>
        <Router />
      </ContentContainer>
    </ErrorBoundary>
  );
}

const NavigationContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 35px;
`;

const ContentContainer = styled.div`
  position: fixed;
  top: 35px;
  left: 0;
  right: 0;
  bottom: 0;
`;
