import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { UnionToIntersection } from "type-fest";

export type Message = {
  command: string;
  payload: any;
};

export type NoopMessage = {
  command: "noop";
  payload: unknown;
};

export type Webapp<C extends Message, P extends Message> = {
  consumes: C;
  produces: P;

  webappHandlers: UnionToIntersection<
    C extends Message
      ? { [key in C["command"]]: ActionCreatorWithPayload<C["payload"], string> | (() => null) }
      : never
  >;

  hostHandlers: UnionToIntersection<
    P extends Message
      ? {
          [key in P["command"]]: (
            payload: P["payload"]
          ) => Promise<C | void> | AsyncGenerator<C, void, unknown>;
        }
      : never
  >;

  host: {
    postMessage(message: P): void;
  };
};
