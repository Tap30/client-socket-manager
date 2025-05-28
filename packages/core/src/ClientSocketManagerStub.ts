import type {
  ClientSocketManagerListenerOptions,
  ClientSocketManagerOptions,
} from "./types.ts";

/**
 * A stub implementation of `ClientSocketManager` intended for use in
 * test environments or server-side rendering (SSR), where actual socket
 * connections are unnecessary or undesired.
 *
 * Provides no-op methods and tracks basic connection/disposal state.
 */
class ClientSocketManagerStub {
  private _inputListeners: Partial<ClientSocketManagerListenerOptions>;

  private _connected = false;
  private _disposed = false;

  /**
   * Indicates this is a mock/stub implementation.
   */
  public static __mock__ = true;

  /**
   * Creates a new stubbed ClientSocketManager.
   *
   * @param _uri - Optional URI string, ignored in stub.
   * @param options - Optional configuration object containing event handlers.
   */
  constructor(_uri?: string, options?: Partial<ClientSocketManagerOptions>) {
    this._inputListeners = options?.eventHandlers ?? {};
  }

  /**
   * A static session identifier.
   * Returns a mock ID if connected, otherwise null.
   */
  public get id(): string | null {
    return this._connected ? "__id__" : null;
  }

  /**
   * Whether the stub is considered connected.
   */
  public get connected(): boolean {
    return this._connected;
  }

  /**
   * Whether the connection has been recovered after interruption.
   * Always returns false in the stub.
   */
  public get recovered(): boolean {
    return false;
  }

  /**
   * Whether the client attempts reconnection automatically.
   * Always returns false in the stub.
   */
  public get autoReconnectable(): boolean {
    return false;
  }

  /**
   * Whether this instance has been disposed.
   */
  public get disposed(): boolean {
    return this._disposed;
  }

  /**
   * Emits a message to the server.
   * No-op in stub.
   *
   * @param _args - Event name and payload, ignored in stub.
   */
  public emit(): void {}

  /**
   * Subscribes to a socket channel.
   * No-op in stub.
   *
   * @param _channel - Channel name.
   * @param _cb - Callback function.
   * @param _options - Optional configuration for signal and subscription completion.
   */
  public subscribe(
    _channel: string,
    _cb: () => void,
    _options?: {
      onSubscriptionComplete?: (channel: string) => void;
      signal?: AbortSignal;
    },
  ): void {}

  /**
   * Unsubscribes from a socket channel.
   * No-op in stub.
   *
   * @param _channel - Channel name.
   * @param _cb - Callback function to remove.
   */
  public unsubscribe(_channel: string, _cb: () => void): void {}

  /**
   * Simulates connecting to a socket.
   * Triggers the `onSocketConnection` event handler if defined.
   */
  public connect(): void {
    this._connected = true;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    this._inputListeners.onSocketConnection?.call(this as any);
  }

  /**
   * Simulates disconnecting the socket.
   * Triggers the `onSocketDisconnection` event handler if defined.
   */
  public disconnect(): void {
    this._connected = false;

    this._inputListeners.onSocketDisconnection?.call(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      this as any,
      "io client disconnect",
    );
  }

  /**
   * Cleans up the instance by disconnecting and clearing handlers.
   */
  public dispose(): void {
    this.disconnect();

    this._disposed = true;
    this._inputListeners = {};
  }
}

export default ClientSocketManagerStub;
