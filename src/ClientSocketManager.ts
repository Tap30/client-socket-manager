import { io, type Socket } from "socket.io-client";
import type { DisconnectDescription } from "socket.io-client/build/esm/socket";
import { ManagerReservedEvents, SocketReservedEvents } from "./constants.ts";
import type {
  ClientSocketManagerListenerOptions,
  ClientSocketManagerOptions,
  SubscribeCallback,
} from "./types.ts";
import { isBrowser } from "./utils.ts";

class ClientSocketManager {
  private _socket: Socket | null = null;

  private _inputListeners: Partial<ClientSocketManagerListenerOptions>;
  private _channelSubscribersMap = new Map<string, SubscribeCallback>();

  constructor(uri?: string, options?: Partial<ClientSocketManagerOptions>) {
    const {
      path = "/socket.io",
      reconnectionDelay = 500,
      reconnectionDelayMax = 2000,
      eventHandlers,
      ...restOptions
    } = options ?? {};

    this._inputListeners = eventHandlers ?? {};

    try {
      this._socket = io(uri, {
        ...restOptions,
        path,
        reconnectionDelay,
        reconnectionDelayMax,
      });
    } catch (err) {
      console.error("**HERE**", err);
    }

    this._handleSocketConnection = this._handleSocketConnection.bind(this);
    this._handleSocketConnectionError =
      this._handleSocketConnectionError.bind(this);
    this._handleSocketDisconnection =
      this._handleSocketDisconnection.bind(this);
    this._handleConnectionError = this._handleConnectionError.bind(this);
    this._handleServerPing = this._handleServerPing.bind(this);
    this._handleReconnecting = this._handleReconnecting.bind(this);
    this._handleReconnectingError = this._handleReconnectingError.bind(this);
    this._handleReconnectingFailure =
      this._handleReconnectingFailure.bind(this);
    this._handleSuccessfulReconnection =
      this._handleSuccessfulReconnection.bind(this);
    this._handleVisibilityChange = this._handleVisibilityChange.bind(this);

    this._attachPageEvents();
    this._attachSocketEvents();
    this._attachManagerEvents();
  }

  private _attachPageEvents() {
    if (!isBrowser()) return;

    document.addEventListener("visibilitychange", this._handleVisibilityChange);
  }

  private _attachSocketEvents() {
    if (!this._socket) return;

    this._socket.on(
      SocketReservedEvents.CONNECTION,
      this._handleSocketConnection,
    );

    this._socket.on(
      SocketReservedEvents.CONNECTION_ERROR,
      this._handleSocketConnectionError,
    );

    this._socket.on(
      SocketReservedEvents.DISCONNECTION,
      this._handleSocketDisconnection,
    );
  }

  private _attachManagerEvents() {
    const manager = this.reconnectionManager;

    if (!manager) return;

    manager.on(
      ManagerReservedEvents.CONNECTION_ERROR,
      this._handleConnectionError,
    );
    manager.on(ManagerReservedEvents.SERVER_PING, this._handleServerPing);
    manager.on(ManagerReservedEvents.RECONNECTING, this._handleReconnecting);
    manager.on(
      ManagerReservedEvents.RECONNECTING_ERROR,
      this._handleReconnectingError,
    );
    manager.on(
      ManagerReservedEvents.RECONNECTION_FAILURE,
      this._handleReconnectingFailure,
    );
    manager.on(
      ManagerReservedEvents.SUCCESSFUL_RECONNECTION,
      this._handleSuccessfulReconnection,
    );
  }

  private _detachPageEvents() {
    if (!isBrowser()) return;

    document.removeEventListener(
      "visibilitychange",
      this._handleVisibilityChange,
    );
  }

  private _detachSocketEvents() {
    this._socket?.off();
  }

  private _detachManagerEvents() {
    this._socket?.io.off();
  }

  private _handleVisibilityChange() {
    const isPageVisible = document.visibilityState === "visible";
    const isPageHidden = document.visibilityState === "hidden";

    if (!isPageVisible && !isPageHidden) return;

    if (isPageVisible) {
      this._inputListeners.onVisiblePage?.();
    } else {
      this._inputListeners.onHiddenPage?.();
    }
  }

  private _handleSocketConnection() {
    this._inputListeners.onSocketConnection?.();
  }

  private _handleSocketConnectionError(err: Error) {
    this._inputListeners.onSocketConnectionError?.(err);
  }

  private _handleSocketDisconnection(
    reason: Socket.DisconnectReason,
    details?: DisconnectDescription,
  ) {
    this._inputListeners.onSocketDisconnection?.(reason, details);
  }

  private _handleConnectionError(err: Error) {
    this._inputListeners.onConnectionError?.(err);
  }

  private _handleServerPing() {
    this._inputListeners.onServerPing?.();
  }

  private _handleReconnecting(attempt: number) {
    this._inputListeners.onReconnecting?.(attempt);
  }

  private _handleReconnectingError(err: Error) {
    this._inputListeners.onReconnectingError?.(err);
  }

  private _handleReconnectingFailure() {
    this._inputListeners.onReconnectionFailure?.();
  }

  private _handleSuccessfulReconnection(attempt: number) {
    this._inputListeners.onSuccessfulReconnection?.(attempt);
  }

  /**
   * A unique identifier for the session.
   *
   * `null` when the socket is not connected.
   */
  public get id() {
    return this._socket?.id ?? null;
  }

  /**
   * Whether the socket is currently connected to the server.
   */
  public get connected() {
    return this._socket?.connected ?? false;
  }

  /**
   * Whether the connection state was recovered after a temporary disconnection.
   * In that case, any missed packets will be transmitted by the server.
   */
  public get recovered() {
    return this._socket?.recovered ?? false;
  }

  /**
   * Whether the Socket will try to reconnect when its Manager connects
   * or reconnects.
   */
  public get autoReconnectable() {
    return this._socket?.active ?? false;
  }

  /**
   * The original socket.io reference.
   */
  public get originalSocketReference() {
    return this._socket;
  }

  /**
   * The underlying reconnection manager.
   */
  public get reconnectionManager() {
    return this._socket?.io ?? null;
  }

  /**
   * The Engine.IO client instance.
   */
  public get engine() {
    return this._socket?.io.engine ?? null;
  }

  /**
   * Subscribes to a specified channel with a callback function.
   * Ensures that only one listener exists per channel.
   *
   * @param channel - The name of the channel to subscribe to.
   * @param cb - The callback function to invoke when a message is received on the channel.
   * @param [onSubscriptionComplete] - Optional callback function to invoke when the subscription is complete.
   */
  public setChannelListener(
    channel: string,
    cb: SubscribeCallback,
    onSubscriptionComplete?: (channel: string) => void,
  ) {
    if (!this._socket) return;

    const listener: SubscribeCallback = (...args) => {
      if (!this._socket) return;

      this._inputListeners.onAnySubscribedMessageReceived?.(channel, args);

      cb.apply(this, args);
    };

    if (this._channelSubscribersMap.has(channel)) {
      this._socket.off(channel, this._channelSubscribersMap.get(channel));
    }

    this._socket.on(channel, listener);
    this._channelSubscribersMap.set(channel, listener);

    onSubscriptionComplete?.(channel);
  }

  /**
   * Deletes the listener for a specified channel.
   *
   * @param channel - The name of the channel whose listener should be deleted.
   */
  public deleteChannelListener(channel: string) {
    this._channelSubscribersMap.delete(channel);
    this._socket?.off(channel);
  }

  /**
   * Manually connects/reconnects the socket.
   */
  public connect() {
    this._socket?.connect();
  }

  /**
   * Manually disconnects the socket.
   * In that case, the socket will not try to reconnect.
   *
   * If this is the last active Socket instance of the Manager,
   * the low-level connection will be closed.
   */
  public disconnect() {
    this._socket?.disconnect();
  }

  /**
   * Disposes of the socket, manager, and engine, ensuring all connections are
   * closed and cleaned up.
   */
  public dispose() {
    this._detachPageEvents();
    this._detachSocketEvents();
    this._detachManagerEvents();

    this._socket?.disconnect();
    this._socket?.io.engine.close();

    this._socket = null;
    this._channelSubscribersMap.clear();
    this._inputListeners = {};
  }
}

export default ClientSocketManager;
