import type {
  ClientSocketManagerListenerOptions,
  ClientSocketManagerOptions,
} from "@tapsioss/client-socket-manager";

class ClientSocketManager {
  private _inputListeners: Partial<ClientSocketManagerListenerOptions>;
  private _connected = false;
  private _disposed = false;

  public static __mock__ = true;

  constructor(_uri?: string, options?: Partial<ClientSocketManagerOptions>) {
    this._inputListeners = options?.eventHandlers ?? {};
  }

  public get id(): string | null {
    return this._connected ? "__id__" : null;
  }

  public get connected(): boolean {
    return this._connected;
  }

  public get recovered(): boolean {
    return false;
  }

  public get autoReconnectable(): boolean {
    return false;
  }

  public get disposed() {
    return this._disposed;
  }

  public emit() {}

  public subscribe(
    _channel: string,
    _cb: () => void,
    _options?: {
      onSubscriptionComplete?: (channel: string) => void;
      signal?: AbortSignal;
    },
  ): void {}

  public unsubscribe(_channel: string, _cb: () => void): void {}

  public connect(): void {
    this._connected = true;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    this._inputListeners.onSocketConnection?.call(this as any);
  }

  public disconnect(): void {
    this._connected = false;

    this._inputListeners.onSocketDisconnection?.call(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      this as any,
      "io client disconnect",
    );
  }

  public dispose(): void {
    this.disconnect();

    this._disposed = true;
    this._inputListeners = {};
  }
}

export default ClientSocketManager;
