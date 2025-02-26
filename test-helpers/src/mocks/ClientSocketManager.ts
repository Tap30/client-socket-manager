import type {
  ClientSocketManagerListenerOptions,
  ClientSocketManagerOptions,
} from "@tapsioss/client-socket-manager";

class ClientSocketManager {
  private _inputListeners: Partial<ClientSocketManagerListenerOptions>;
  private _connected = false;

  public static __mock__ = true;

  constructor(uri?: string, options?: Partial<ClientSocketManagerOptions>) {
    this._inputListeners = options?.eventHandlers ?? {};
  }

  /**
   * Emits an event to the socket identified by the channel name.
   */
  public emit() {}

  /**
   * A unique identifier for the session.
   *
   * `null` when the socket is not connected.
   */
  public get id(): string | null {
    return this._connected ? "__id__" : null;
  }

  /**
   * Whether the socket is currently connected to the server.
   */
  public get connected(): boolean {
    return this._connected;
  }

  /**
   * Whether the connection state was recovered after a temporary disconnection.
   * In that case, any missed packets will be transmitted by the server.
   */
  public get recovered(): boolean {
    return false;
  }

  /**
   * Whether the Socket will try to reconnect when its Manager connects
   * or reconnects.
   */
  public get autoReconnectable(): boolean {
    return false;
  }

  /**
   * Subscribes to a specified channel with a callback function.
   * Ensures that only one listener exists per channel.
   */
  public setChannelListener(
    /**
     * The name of the channel to subscribe to.
     */
    channel: string,
    /**
     * The callback function to invoke when a message is received on the channel.
     */
    cb: () => void,
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
  ): void {}

  /**
   * Deletes the listener for a specified channel.
   */
  public deleteChannelListener(
    /**
     * The name of the channel whose listener should be deleted.
     */
    channel: string,
  ): void {}

  /**
   * Manually connects/reconnects the socket.
   */
  public connect(): void {
    this._connected = true;

    this._inputListeners.onSocketConnection?.call(this as any);
  }

  /**
   * Manually disconnects the socket.
   * In that case, the socket will not try to reconnect.
   *
   * If this is the last active Socket instance of the Manager,
   * the low-level connection will be closed.
   */
  public disconnect(): void {
    this._connected = false;

    this._inputListeners.onSocketDisconnection?.call(
      this as any,
      "io client disconnect",
    );
  }

  /**
   * Disposes of the socket, manager, and engine, ensuring all connections are
   * closed and cleaned up.
   */
  public dispose(): void {
    this.disconnect();
    this._inputListeners = {};
  }
}

export default ClientSocketManager;
