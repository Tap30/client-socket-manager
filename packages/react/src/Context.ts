import type { ClientSocketManager } from "@tapsioss/client-socket-manager";
import * as React from "react";
import type { ConnectionStatusValues } from "./types";

export type SocketContextValue = {
  /**
   * The socket client instance.
   */
  socket: ClientSocketManager | null;
  /**
   * The connection status of the socket instance.
   */
  connectionStatus: ConnectionStatusValues;
};

export const SocketContext = React.createContext<SocketContextValue | null>(
  null,
);

SocketContext.displayName = "SocketContext";
