import { io, type Socket } from "socket.io-client";
import { ManagerReservedEvents, SocketReservedEvents } from "./constants.ts";
import * as devtool from "./devtool/devtool.ts";
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

  private _inputListeners: ClientSocketManagerListenerOptions = {};

  constructor(uri: string, options?: ClientSocketManagerOptions) {
    const {
      path = "/socket.io",
      reconnectionDelay = 500,
      reconnectionDelayMax = 2000,
      eventHandlers,
      devtool: devtoolOpt = false,
      ...restOptions
    } = options ?? {};

    try {
      this._socket = io(uri, {
        ...restOptions,
        path,
        reconnectionDelay,
        reconnectionDelayMax,
      });
      this._inputListeners = eventHandlers ?? {};

      this._handleVisibilityChange = this._handleVisibilityChange.bind(this);

      this._attachPageEvents();
      this._attachSocketEvents();
      this._attachManagerEvents();

      this._inputListeners.onInit?.call(this);

      if (devtoolOpt) {
        devtool.init();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to initialize socket connection", {
        uri,
        path,
        err,
      });
    }
  }

  private _attachPageEvents(): void {
    if (!isBrowser()) return;

    document.addEventListener("visibilitychange", this._handleVisibilityChange);
  }

  private _attachSocketEvents(): void {
    if (!this._socket) return;

    this._socket.on(SocketReservedEvents.CONNECTION, () => {
      this._inputListeners.onSocketConnection?.call(this);

      devtool.render(s => {
        s.status = devtool.Status.CONNECTED;
      });
    });

    if (this._inputListeners.onSocketConnectionError) {
      this._socket.on(
        SocketReservedEvents.CONNECTION_ERROR,
        this._inputListeners.onSocketConnectionError.bind(this),
      );
    }

    this._socket.on(SocketReservedEvents.DISCONNECTION, (reason, details) => {
      this._inputListeners.onSocketDisconnection?.call(this, reason, details);

      devtool.render(s => {
        s.status = devtool.Status.DISCONNECTED;
      });

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

    manager.on(ManagerReservedEvents.CONNECTION_ERROR, error => {
      onConnectionError?.call(this, error);
      devtool.render(s => {
        s.logs.enqueue({
          type: devtool.LogType.CONNECTION_ERROR,
          date: new Date(),
          detail: error.message,
        });
      });
    });

    if (onServerPing) {
      manager.on(ManagerReservedEvents.SERVER_PING, onServerPing.bind(this));
    }

    manager.on(ManagerReservedEvents.RECONNECTING, attempt => {
      onReconnecting?.call(this, attempt);
      devtool.render(s => {
        s.status = devtool.Status.RECONNECTING;
        s.logs.enqueue({
          type: devtool.LogType.RECONNECTING,
          date: new Date(),
          detail: `Reconnecting... (${attempt} attempt(s))`,
        });
      });
    });

    manager.on(ManagerReservedEvents.RECONNECTING_ERROR, error => {
      onReconnectingError?.call(this, error);
      devtool.render(s => {
        s.logs.enqueue({
          type: devtool.LogType.RECONNECTING_ERROR,
          date: new Date(),
          detail: error.message,
        });
      });
    });

    manager.on(ManagerReservedEvents.RECONNECTION_FAILURE, () => {
      onReconnectionFailure?.call(this);
      devtool.render(s => {
        s.logs.enqueue({
          type: devtool.LogType.RECONNECTION_FAILURE,
          date: new Date(),
          detail: `Failed to reconnect.`,
        });
      });
    });

    manager.on(ManagerReservedEvents.SUCCESSFUL_RECONNECTION, attempt => {
      onSuccessfulReconnection?.call(this, attempt);
      devtool.render(s => {
        s.logs.enqueue({
          type: devtool.LogType.SUCCESSFUL_RECONNECTION,
          date: new Date(),
          detail: `Successfully connected after ${attempt} attempt(s)`,
        });
      });
    });
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
   */
  public subscribe<Ev extends EventNames<ListenEvents>>(
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
      onSubscriptionComplete?: (
        this: ClientSocketManager,
        channel: string,
      ) => void;
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
      warnDisposedClient(this.disposed);

      if (!this._socket) return;

      this._inputListeners.onAnySubscribedMessageReceived?.call(
        this,
        channel,
        args,
      );

      (cb as SubscribeCallback).apply(this, args);
    };

    this._socket.on(channel, listener as ListenEvents[Ev]);

    const unsubscribe = () => {
      this.unsubscribe(channel, listener as ListenEvents[Ev]);

      signal?.removeEventListener("abort", unsubscribe);
    };

    signal?.addEventListener("abort", unsubscribe);

    if (signal?.aborted) unsubscribe();

    onSubscriptionComplete?.call(this, channel);

    devtool.render(s => {
      s.channels.add(channel);
      s.logs.enqueue({
        type: devtool.LogType.SUBSCRIBED,
        date: new Date(),
        detail: `subscribed to \`${channel}\` channel`,
      });
    });
  }

  /**
   * Removes the listener for the specified channel.
   * If no callback is provided, it removes all listeners for that channel.
   */
  public unsubscribe<Ev extends EventNames<ListenEvents>>(
    /**
     * The name of the channel whose listener should be deleted.
     */
    channel: Ev,
    /**
     * The subscriber callback function to remove.
     */
    cb?: ListenEvents[Ev],
  ): void {
    warnDisposedClient(this.disposed);

    if (!this._socket) return;

    if (cb) this._socket.off(channel, cb);
    else this._socket.off(channel);

    devtool.render(s => {
      s.channels.delete(channel);
      s.logs.enqueue({
        type: devtool.LogType.UNSUBSCRIBED,
        date: new Date(),
        detail: `unsubscribed from \`${channel}\` channel`,
      });
    });
  }

  /**
   * Manually connects/reconnects the socket.
   */
  public connect(): void {
    warnDisposedClient(this.disposed);

    this._socket?.connect();

    devtool.render(s => {
      s.logs.enqueue({
        type: devtool.LogType.CONNECTED,
        date: new Date(),
        detail: `socket was conneced manually`,
      });
    });
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

    devtool.render(s => {
      s.logs.enqueue({
        type: devtool.LogType.DISCONNECTED,
        date: new Date(),
        detail: `socket was disconneced manually`,
      });
    });
  }

  /**
   * Disposes of the socket, manager, and engine, ensuring all connections are
   * closed and cleaned up.
   */
  public dispose(): void {
    warnDisposedClient(this.disposed);

    this._inputListeners.onDispose?.call(this);

    this._detachPageEvents();
    this._detachSocketEvents();
    this._detachManagerEvents();

    this.disconnect();
    this._socket?.io.engine.close();

    this._socket = null;
    this._inputListeners = {};
    this._disposed = true;

    devtool.dispose();
  }
}

export default ClientSocketManager;
