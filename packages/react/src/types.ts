import type { ClientSocketManagerOptions } from "@tapsioss/client-socket-manager";
import type * as React from "react";
import type { ConnectionStatus } from "./constants.ts";

type StatusType = typeof ConnectionStatus;

export type ConnectionStatusValues = StatusType[keyof StatusType];

export type SocketClientProviderProps = {
  children: React.ReactNode;
  uri?: string;
} & Partial<ClientSocketManagerOptions>;
