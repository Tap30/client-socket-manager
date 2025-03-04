import type {
  ClientSocketManager,
  ClientSocketManagerOptions,
} from "@tapsioss/client-socket-manager";
import type * as React from "react";
import type { ConnectionStatus } from "./constants.ts";
import type { SocketContextValue } from "./Context.ts";

type StatusType = typeof ConnectionStatus;

export type ConnectionStatusValues = StatusType[keyof StatusType];

export type SocketInstance = ClientSocketManager;

export type SocketClientHookReturnType = SocketContextValue;

export type SocketClientProviderProps = {
  children: React.ReactNode;
  uri: string;
} & Partial<ClientSocketManagerOptions>;
