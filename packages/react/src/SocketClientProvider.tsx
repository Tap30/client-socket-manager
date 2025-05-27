import {
  ClientSocketManager as ClientSocketManagerOriginal,
  ClientSocketManagerStub,
} from "@tapsioss/client-socket-manager";
import * as React from "react";
import { ConnectionStatus } from "./constants.ts";
import { SocketContext, type SocketContextValue } from "./Context.ts";
import type {
  ConnectionStatusValues,
  SocketClientProviderProps,
} from "./types";

const __SINGLETON_REFS__: Record<
  string,
  | InstanceType<typeof ClientSocketManagerOriginal>
  | InstanceType<typeof ClientSocketManagerStub>
  | null
> = {};

/**
 * React provider that initializes and manages a socket connection via `ClientSocketManager`.
 *
 * It optionally uses a stubbed socket manager in server-side rendering or testing environments.
 * The provider ensures a singleton instance per URI and updates the connection status accordingly.
 *
 * Properties:
 * - `children` (`React.ReactNode`): React children to render within the provider.
 * - `uri` (`string`): The URI to connect the socket client to.
 * - `shouldUseStob?` (`boolean`): Optional flag indicating whether to use the stubbed version of `ClientSocketManager` (useful for SSR or testing).
 * - Additional props from `ClientSocketManagerOptions` can be provided, such as `eventHandlers`, `reconnectionDelay`, etc.
 *
 * @param props - Props for the provider, including connection URI, stub flag, and socket manager options.
 * @returns A context provider that supplies the socket instance and its connection status.
 *
 * @example
 * ```tsx
 * <SocketClientProvider uri="https://example.com/socket" shouldUseStob={typeof window === "undefined"}>
 *   <App />
 * </SocketClientProvider>
 * ```
 */
const SocketClientProvider = (props: SocketClientProviderProps) => {
  const { children, uri, ...options } = props;

  const [clientInstance, setClientInstance] = React.useState(
    __SINGLETON_REFS__[uri] ?? null,
  );

  const [connectionStatus, setConnectionStatus] =
    React.useState<ConnectionStatusValues>(ConnectionStatus.DISCONNECTED);

  const registerClientSocketManager = (
    client: SocketContextValue["socket"],
  ) => {
    setClientInstance(client);
    __SINGLETON_REFS__[uri] = client;
  };

  React.useEffect(() => {
    if (!__SINGLETON_REFS__[uri]) {
      if (props.shouldUseStob) {
        registerClientSocketManager(new ClientSocketManagerStub(uri, {}));
      } else {
        const client = new ClientSocketManagerOriginal(uri, {
          ...options,
          eventHandlers: {
            ...(options.eventHandlers ?? {}),
            onSocketConnection() {
              options.eventHandlers?.onSocketConnection?.call(client);
              setConnectionStatus(ConnectionStatus.CONNECTED);
            },
            onSocketDisconnection(reason, details) {
              options.eventHandlers?.onSocketDisconnection?.call(
                client,
                reason,
                details,
              );
              setConnectionStatus(ConnectionStatus.DISCONNECTED);
            },
            onReconnecting(attempt) {
              options.eventHandlers?.onReconnecting?.call(client, attempt);
              setConnectionStatus(ConnectionStatus.RECONNECTING);
            },
          },
        });

        registerClientSocketManager(client);
      }
    } else {
      throw new Error(
        [
          `ClientSocketManager: An active client already exists for the URI "${uri}".`,
          "Multiple clients for the same URI are not allowed.",
        ].join(" "),
      );
    }

    return () => {
      if (__SINGLETON_REFS__[uri]) {
        __SINGLETON_REFS__[uri].dispose();
        __SINGLETON_REFS__[uri] = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ctx = React.useMemo<SocketContextValue>(
    () => ({
      connectionStatus,
      get socket() {
        if (!clientInstance) return null;
        if (clientInstance.disposed) return null;

        return clientInstance;
      },
    }),
    [connectionStatus, clientInstance],
  );

  return (
    <SocketContext.Provider value={ctx}>{children}</SocketContext.Provider>
  );
};

export default SocketClientProvider;
