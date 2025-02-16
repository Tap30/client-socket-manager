import { ClientSocketManager } from "@tapsioss/client-socket-manager";
import * as React from "react";
import { ConnectionStatus } from "./constants.ts";
import { SocketContext, type SocketContextValue } from "./Context.ts";
import type {
  ConnectionStatusValues,
  SocketClientProviderProps,
} from "./types";

const __SINGLETON_REFS__: {
  socket: ClientSocketManager | null;
} = {
  socket: null,
};

const SocketClientProvider = (props: SocketClientProviderProps) => {
  const { children, uri, ...options } = props;

  const [socketClient, setSocketClient] = React.useState(
    __SINGLETON_REFS__.socket,
  );

  const [connectionStatus, setConnectionStatus] =
    React.useState<ConnectionStatusValues>(ConnectionStatus.DISCONNECTED);

  const outerCtx = React.useContext(SocketContext);

  if (outerCtx) {
    throw new Error(
      [
        "ClientSocketManager: Nested `<SocketClientProvider>`s detected.",
        "Please ensure that `<SocketClientProvider>`s are not nested within each other.",
      ].join(" "),
    );
  }

  React.useEffect(() => {
    if (__SINGLETON_REFS__.socket) return;

    const client = new ClientSocketManager(uri, {
      ...options,
      eventHandlers: {
        ...(options.eventHandlers ?? {}),
        onSocketConnection() {
          options.eventHandlers?.onSocketConnection?.();

          setConnectionStatus(ConnectionStatus.CONNECTED);
        },
        onSocketDisconnection(reason, details) {
          options.eventHandlers?.onSocketDisconnection?.(reason, details);

          setConnectionStatus(ConnectionStatus.DISCONNECTED);
        },
        onReconnecting(attempt) {
          options.eventHandlers?.onReconnecting?.(attempt);

          setConnectionStatus(ConnectionStatus.RECONNECTING);
        },
      },
    });

    setSocketClient(client);

    return () => {
      client.dispose();

      __SINGLETON_REFS__.socket = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ctx = React.useMemo<SocketContextValue>(
    () => ({ socketClient, connectionStatus }),
    [connectionStatus, socketClient],
  );

  return (
    <SocketContext.Provider value={ctx}>{children}</SocketContext.Provider>
  );
};

export default SocketClientProvider;
