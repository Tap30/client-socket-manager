import * as React from "react";
import type {
  ConnectionStatusValues,
  SocketInstance,
  SocketInstanceStub,
} from "./types";

export type SocketContextValue = {
  /**
   * The socket client instance.
   */
  socket: SocketInstance | SocketInstanceStub | null;
  /**
   * The connection status of the socket instance.
   */
  connectionStatus: ConnectionStatusValues;
};

export const SocketContext = React.createContext<SocketContextValue | null>(
  null,
);

SocketContext.displayName = "SocketContext";
