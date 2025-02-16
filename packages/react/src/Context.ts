import type { ClientSocketManager } from "@tapsioss/client-socket-manager";
import * as React from "react";
import type { ConnectionStatusValues } from "./types";

export type SocketContextValue = {
  socketClient: ClientSocketManager | null;
  connectionStatus: ConnectionStatusValues;
};

export const SocketContext = React.createContext<SocketContextValue | null>(
  null,
);

SocketContext.displayName = "SocketContext";
