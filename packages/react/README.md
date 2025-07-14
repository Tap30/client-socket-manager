<div align="center">

# Client Socket Manager - React

</div>

<div align="center">

A React utility that provides context for `ClientSocketManager`, ensuring
seamless management of socket connections with `socket.io-client`.

</div>

---

`ClientSocketManager` is a flexible and robust manager for handling socket
connections using `socket.io-client`. It provides easy setup and management of
socket connections with support for automatic reconnections, event handling, and
visibility change management.

## Installation

First, install the necessary dependencies:

```sh
npm install @tapsioss/react-client-socket-manager socket.io-client
```

## Usage

Here is an example of how to use `SocketClientProvider` and `useSocketClient` in
your project:

```tsx
import * as React from "react";
import {
  ConnectionStatus,
  SocketClientProvider,
  useSocketClient,
} from "@tapsioss/react-client-socket-manager";

const MyComponent = () => {
  const { connectionStatus, socket } = useSocketClient();

  React.useEffect(() => {
    if (connectionStatus === ConnectionStatus.CONNECTED) {
      console.log("Socket is connected");
    }
  }, [connectionStatus]);

  return (
    <div>
      <p>Connection Status: {connectionStatus}</p>
      <button onClick={() => socket?.emit("message", "Hello, world!")}>
        Send Message
      </button>
    </div>
  );
};

const App = () => {
  return (
    <SocketClientProvider
      uri="http://localhost:3000"
      shouldUseStub={typeof window === "undefined"} // Use stub for SSR
      eventHandlers={{
        onSocketConnection() {
          console.log("Socket connected");
        },
        onSocketDisconnection(reason) {
          console.log("Socket disconnected:", reason);
        },
        onReconnecting(attempt) {
          console.log("Reconnecting, attempt:", attempt);
        },
      }}
    >
      <MyComponent />
    </SocketClientProvider>
  );
};
```

## API Reference

### `SocketClientProvider` Component

```ts
const SocketClientProvider: (props: SocketClientProviderProps) => JSX.Element;
```

Wraps your application to provide `ClientSocketManager` client.

#### Parameters

- `children`: The React tree to provide the socket client for.
- `uri`: The URI of the socket server.
- `shouldUseStub` (optional): When set to `true`, the provider uses a stubbed
  socket client instead of connecting to a real socket server. This is
  especially useful for **server-side rendering (SSR)** or **unit testing**
  scenarios.
- `options`: (optional): Configuration options for the socket connection.

##### Options

We have extended
[socket-io's options](https://socket.io/docs/v4/client-options/) to include
additional options:

- `eventHandlers`: Handlers for various socket events.
  - `onInit`: Fired upon instantiation.
  - `onDispose`: Fired upon disposal.
  - `onSocketConnection`: Fired when the socket is successfully connected.
  - `onSocketDisconnection`: Fired when the socket is disconnected.
  - `onServerPing`: Fired when a ping packet is received from the server.
  - `onConnectionError`: Fired upon a connection error.
  - `onReconnecting`: Fired upon an attempt to reconnect.
  - `onReconnectingError`: Fired upon a reconnection attempt error.
  - `onReconnectionFailure`: Fired when couldn't reconnect within
    `reconnectionAttempts`.
  - `onSuccessfulReconnection`: Fired upon a successful reconnection.
  - `onAnySubscribedMessageReceived`: Fired when any message is received from a
    subscribed channel.
  - `onVisiblePage`: Fired when the page's `visibilityState` changes to
    `visible`.
  - `onHiddenPage`: Fired when the page's `visibilityState` changes to `hidden`.
- `devtool`: Enables the in-browser DevTool panel for socket debugging. This is
  useful for development and debugging purposes. In production environments,
  it's recommended to leave this disabled.

### `useSocketClient` Hook

```ts
type ConnectionStatusValues = "connected" | "disconnected" | "reconnecting";

type SocketClientHookReturnType = {
  /**
   * The socket client instance.
   */
  socket: ClientSocketManager | null;
  /**
   * The connection status of the socket instance.
   */
  connectionStatus: ConnectionStatusValues;
};

const useSocketClient: () => SocketClientHookReturnType;
```

A custom hook to access the `ClientSocketManager` client.

## License

This project is licensed under the terms of the
[MIT license](https://github.com/Tap30/client-socket-manager/blob/main/packages/core/LICENSE).
