import ThemeStyles from "../features/theme/ThemeStyles";
import Router from "../features/router/Router";
import Navigation from "../features/router/Navigation";
import styled from "styled-components";

export function makeWebappMessageHandler(store: any, handlers: any) {
  return function webappMessageHandler(event: MessageEvent<any>) {
    const { command, payload } = event.data;
    if (command) {
      const handler = handlers[command];
      if (handler) {
        store.dispatch(handler(payload));
      } else {
        console.error(`Unable to find handler for command: ${command}`);
      }
    } else {
      console.error("Received message with unknown command", event.data);
    }
  };
}

export function startListeners(listeners: Record<string, () => unknown>) {
  const listenerNames = Object.keys(listeners);
  for (const listenerName of listenerNames) {
    console.log("starting listener for: ", listenerName);
    listeners[listenerName]();
  }
}

export function RouterApp() {
  return (
    <>
      <ThemeStyles />
      <Router />
    </>
  );
}

export function NavigationRouterApp() {
  return (
    <Container>
      <ThemeStyles />
      <Navigation />
      <Router />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  > div:last-child {
    flex: 1;
  }
`;
