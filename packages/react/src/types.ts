import type {
  ClientSocketManager,
  ClientSocketManagerOptions,
  ClientSocketManagerStub,
} from "@tapsioss/client-socket-manager";
import type * as React from "react";
import type { ConnectionStatus } from "./constants.ts";
import type { SocketContextValue } from "./Context.ts";

/**
 * Type representing the union of all possible connection status values
 * defined in `ConnectionStatus`.
 */
type StatusType = typeof ConnectionStatus;

/**
 * All valid connection state values for the socket client.
 */
export type ConnectionStatusValues = StatusType[keyof StatusType];

/**
 * The default ClientSocketManager implementation used in production.
 */
export type SocketInstance = ClientSocketManager;

/**
 * A stubbed version of the ClientSocketManager, typically used in
 * testing or server-side rendering (SSR) environments.
 */
export type SocketInstanceStub = ClientSocketManagerStub;

/**
 * The return type of the `useSocketClient` hook,
 * derived from the context value shape.
 */
export type SocketClientHookReturnType = SocketContextValue;

/**
 * Props for the `SocketClientProvider` component.
 */
export type SocketClientProviderProps = {
  /**
   * React children to render within the provider.
   */
  children: React.ReactNode;

  /**
   * The URI to connect the socket client to.
   */
  uri: string;

  /**
   * Optional flag indicating whether to use the stubbed version of
   * ClientSocketManager. This is useful for SSR or tests.
   */
  shouldUseStub?: boolean;
} & Partial<ClientSocketManagerOptions>;
