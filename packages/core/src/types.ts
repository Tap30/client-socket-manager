// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ManagerOptions, Socket, SocketOptions } from "socket.io-client";
import type { DisconnectDescription } from "socket.io-client/build/esm/socket";
import type ClientSocketManager from "./ClientSocketManager";

export type SubscribeCallback = (...args: any[]) => void;

export type EventsMap = Record<string, any>;
export type DefaultEventsMap = Record<string, SubscribeCallback>;

export type EventNames<Map extends EventsMap> = keyof Map & string;
export type EventParams<
  Map extends EventsMap,
  Ev extends EventNames<Map>,
> = Parameters<Map[Ev]>;

type OverrideMembers<
  Origin extends Record<PropertyKey, any>,
  Destination extends Record<PropertyKey, any>,
> = Omit<Origin, keyof Destination> & Destination;

export type ClientSocketManagerListenerOptions = {
  /**
   * Fired upon instantiation.
   */
  onInit: (this: ClientSocketManager) => void;
  /**
   * Fired upon disposal.
   */
  onDispose: (this: ClientSocketManager) => void;
  /**
   * Fired upon a connection error.
   *
   * @param err - The connection error instance.
   */
  onConnectionError: (this: ClientSocketManager, err: Error) => void;
  /**
   * Fired when a ping packet is received from the server.
   */
  onServerPing: (this: ClientSocketManager) => void;
  /**
   * Fired upon an attempt to reconnect.
   *
   * @param attempt - The number of reconnection attempts.
   */
  onReconnecting: (this: ClientSocketManager, attempt: number) => void;
  /**
   * Fired upon a reconnection attempt error.
   *
   * @param err - The reconnection attempt error instance.
   */
  onReconnectingError: (this: ClientSocketManager, err: Error) => void;
  /**
   * Fired when couldn't reconnect within `reconnectionAttempts`.
   */
  onReconnectionFailure: (this: ClientSocketManager) => void;
  /**
   * Fired upon a successful reconnection.
   *
   * @param attempt - The number of reconnection attempts.
   */
  onSuccessfulReconnection: (
    this: ClientSocketManager,
    attempt: number,
  ) => void;
  /**
   * This event is fired by the Socket instance upon connection and reconnection.
   */
  onSocketConnection: (this: ClientSocketManager) => void;
  /**
   * This event is fired upon connection failure.
   *
   * @param err - The connection error instance.
   */
  onSocketConnectionError: (this: ClientSocketManager, err: Error) => void;
  /**
   * This event is fired upon disconnection.
   *
   * @param reason - The reason of disconnection.
   * @param details - The details of the disconnection.
   */
  onSocketDisconnection: (
    this: ClientSocketManager,
    reason: Socket.DisconnectReason,
    details?: DisconnectDescription,
  ) => void;
  /**
   * The callback is fired when page's `visibilityState` changes to `visible`.
   *
   * The page content may be at least partially visible.
   * In practice this means that the page is the foreground tab of a non-minimized window.
   */
  onVisiblePage: (this: ClientSocketManager) => void;
  /**
   * This callback is fired when page's `visibilityState` changes to `hidden`.
   *
   * The page's content is not visible to the user, either due to
   * the document's tab being in the background or part of a window that is
   * minimized, or because the device's screen is off.
   */
  onHiddenPage: (this: ClientSocketManager) => void;
  /**
   * The callback is fired when any message is received from a subscribed channel.
   *
   * @param channel - The name of the channel from which the message is received.
   * @param received - The data received from the channel.
   */
  onAnySubscribedMessageReceived: (
    this: ClientSocketManager,
    channel: string,
    received: any[],
  ) => void;
};

export type ClientSocketManagerOptions = OverrideMembers<
  ManagerOptions & SocketOptions,
  {
    /**
     * The time delay in milliseconds between reconnection attempts.
     *
     * @default 500
     */
    reconnectionDelay: number;
    /**
     * The max time delay in milliseconds between reconnection attempts.
     *
     * @default 2000
     */
    reconnectionDelayMax: number;
  }
> & {
  /**
   * Handlers for various events.
   */
  eventHandlers: Partial<ClientSocketManagerListenerOptions>;
};
