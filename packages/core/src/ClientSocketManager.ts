import { io, type Socket } from "socket.io-client";
import { ManagerReservedEvents, SocketReservedEvents } from "./constants.ts";
import type {
  ClientSocketManagerListenerOptions,
  ClientSocketManagerOptions,
  DefaultEventsMap,
  EventNames,
  EventParams,
  EventsMap,
  SubscribeCallback,
} from "./types.ts";
import { assertCallbackType, isBrowser, warnDisposedClient } from "./utils.ts";

class ClientSocketManager<
  ListenEvents extends EventsMap = DefaultEventsMap,
  EmitEvents extends EventsMap = ListenEvents,
> {
  private _disposed = false;

  private _socket: Socket<ListenEvents, EmitEvents> | null = null;

  private _inputListeners: Partial<ClientSocketManagerListenerOptions>;
  private _channelSubscribersMap = new Map<string, SubscribeCallback>();

  constructor(uri: string, options?: Partial<ClientSocketManagerOptions>) {
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
      // eslint-disable-next-line no-console
      console.error("Failed to initialize socket connection", {
        uri,
        path,
        err,
      });
    }

    this._handleVisibilityChange = this._handleVisibilityChange.bind(this);

    this._attachPageEvents();
    this._attachSocketEvents();
    this._attachManagerEvents();
  }

  private _attachPageEvents(): void {
    if (!isBrowser()) return;

    document.addEventListener("visibilitychange", this._handleVisibilityChange);
  }

  private _attachSocketEvents(): void {
    if (!this._socket) return;

    const { onSocketConnection, onSocketConnectionError } =
      this._inputListeners;

    if (onSocketConnection) {
      this._socket.on(
        SocketReservedEvents.CONNECTION,
        onSocketConnection.bind(this),
      );
    }

    if (onSocketConnectionError) {
      this._socket.on(
        SocketReservedEvents.CONNECTION_ERROR,
        onSocketConnectionError.bind(this),
      );
    }

    this._socket.on(SocketReservedEvents.DISCONNECTION, (reason, details) => {
      this._inputListeners.onSocketDisconnection?.call(this, reason, details);

      if (!this.autoReconnectable) {
        if (reason === "io server disconnect") {
          this.connect();
        }
      }
    });
  }

  private _attachManagerEvents(): void {
    const manager = this._socket?.io;

    if (!manager) return;

    const {
      onServerPing,
      onConnectionError,
      onReconnecting,
      onReconnectingError,
      onReconnectionFailure,
      onSuccessfulReconnection,
    } = this._inputListeners;

    if (onConnectionError) {
      manager.on(
        ManagerReservedEvents.CONNECTION_ERROR,
        onConnectionError.bind(this),
      );
    }

    if (onServerPing) {
      manager.on(ManagerReservedEvents.SERVER_PING, onServerPing.bind(this));
    }

    if (onReconnecting) {
      manager.on(ManagerReservedEvents.RECONNECTING, onReconnecting.bind(this));
    }

    if (onReconnectingError) {
      manager.on(
        ManagerReservedEvents.RECONNECTING_ERROR,
        onReconnectingError.bind(this),
      );
    }

    if (onReconnectionFailure) {
      manager.on(
        ManagerReservedEvents.RECONNECTION_FAILURE,
        onReconnectionFailure.bind(this),
      );
    }

    if (onSuccessfulReconnection) {
      manager.on(
        ManagerReservedEvents.SUCCESSFUL_RECONNECTION,
        onSuccessfulReconnection.bind(this),
      );
    }
  }

  private _detachPageEvents(): void {
    if (!isBrowser()) return;

    document.removeEventListener(
      "visibilitychange",
      this._handleVisibilityChange,
    );
  }

  private _detachSocketEvents(): void {
    this._socket?.off();
  }

  private _detachManagerEvents(): void {
    this._socket?.io.off();
  }

  private _handleVisibilityChange(): void {
    const isPageVisible = document.visibilityState === "visible";
    const isPageHidden = document.visibilityState === "hidden";

    if (!isPageVisible && !isPageHidden) return;

    if (isPageVisible) {
      this._inputListeners.onVisiblePage?.call(this);

      if (!this.connected) this.connect();
    } else {
      this._inputListeners.onHiddenPage?.call(this);

      this.disconnect();
    }
  }

  /**
   * Whether the client is disposed.
   */
  public get disposed() {
    return this._disposed;
  }

  /**
   * Emits an event to the socket identified by the channel name.
   */
  public emit<Ev extends EventNames<EmitEvents>>(
    channel: Ev,
    ...args: EventParams<EmitEvents, Ev>
  ) {
    warnDisposedClient(this.disposed);

    if (!this._socket) return;

    this._socket.emit(channel, ...args);
  }

  /**
   * A unique identifier for the session.
   *
   * `null` when the socket is not connected.
   */
  public get id(): string | null {
    warnDisposedClient(this.disposed);

    return this._socket?.id ?? null;
  }

  /**
   * Whether the socket is currently connected to the server.
   */
  public get connected(): boolean {
    warnDisposedClient(this.disposed);

    return this._socket?.connected ?? false;
  }

  /**
   * Whether the connection state was recovered after a temporary disconnection.
   * In that case, any missed packets will be transmitted by the server.
   */
  public get recovered(): boolean {
    warnDisposedClient(this.disposed);

    return this._socket?.recovered ?? false;
  }

  /**
   * Whether the Socket will try to reconnect when its Manager connects
   * or reconnects.
   */
  public get autoReconnectable(): boolean {
    warnDisposedClient(this.disposed);

    return this._socket?.active ?? false;
  }

  /**
   * Subscribes to a specified channel with a callback function.
   * Ensures that only one listener exists per channel.
   */
  public setChannelListener<Ev extends EventNames<ListenEvents>>(
    /**
     * The name of the channel to subscribe to.
     */
    channel: Ev,
    /**
     * The callback function to invoke when a message is received on the channel.
     */
    cb: ListenEvents[Ev],
    options?: {
      /**
       * The callback function to invoke when the subscription is complete.
       */
      onSubscriptionComplete?: (channel: string) => void;
      /**
       * The `AbortSignal` to unsubscribe the listener upon abortion.
       */
      signal?: AbortSignal;
    },
  ): void {
    warnDisposedClient(this.disposed);

    if (!this._socket) return;

    assertCallbackType(
      cb,
      `Expected a valid callback function. Received \`${typeof cb}\`.`,
    );

    const { onSubscriptionComplete, signal } = options ?? {};

    const listener: SubscribeCallback = (...args) => {
      if (!this._socket) return;

      this._inputListeners.onAnySubscribedMessageReceived?.call(
        this,
        channel,
        args,
      );

      (cb as SubscribeCallback).apply(this, args);
    };

    if (this._channelSubscribersMap.has(channel)) {
      const subscriber = this._channelSubscribersMap.get(channel)!;

      this._socket.off(channel, subscriber as ListenEvents[Ev]);
    }

    this._socket.on(channel, listener as ListenEvents[Ev]);
    this._channelSubscribersMap.set(channel, listener);

    const unsubscribe = () => {
      this.deleteChannelListener(channel);

      signal?.removeEventListener("abort", unsubscribe);
    };

    signal?.addEventListener("abort", unsubscribe);

    if (signal?.aborted) unsubscribe();

    onSubscriptionComplete?.call(this, channel);
  }

  /**
   * Deletes the listener for a specified channel.
   */
  public deleteChannelListener(
    /**
     * The name of the channel whose listener should be deleted.
     */
    channel: string,
  ): void {
    warnDisposedClient(this.disposed);

    this._channelSubscribersMap.delete(channel);
    this._socket?.off(channel);
  }

  /**
   * Manually connects/reconnects the socket.
   */
  public connect(): void {
    warnDisposedClient(this.disposed);

    this._socket?.connect();
  }

  /**
   * Manually disconnects the socket.
   * In that case, the socket will not try to reconnect.
   *
   * If this is the last active Socket instance of the Manager,
   * the low-level connection will be closed.
   */
  public disconnect(): void {
    warnDisposedClient(this.disposed);

    this._socket?.disconnect();
  }

  /**
   * Disposes of the socket, manager, and engine, ensuring all connections are
   * closed and cleaned up.
   */
  public dispose(): void {
    warnDisposedClient(this.disposed);

    this._detachPageEvents();
    this._detachSocketEvents();
    this._detachManagerEvents();

    this.disconnect();
    this._socket?.io.engine.close();

    this._socket = null;
    this._channelSubscribersMap.clear();
    this._inputListeners = {};
    this._disposed = true;
  }
}

export default ClientSocketManager;
