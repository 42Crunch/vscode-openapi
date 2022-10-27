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
