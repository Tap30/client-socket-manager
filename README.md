<div align="center">

# Client Socket Manager

</div>

<div align="center">

A wrapper for `socket.io-client` that handles best practices and edge cases in a more abstracted and opinionated manner.

</div>

<hr />

`ClientSocketManager` is a flexible and robust manager for handling socket connections using `socket.io-client`. It provides easy setup and management of socket connections with support for automatic reconnections, event handling, and visibility change management.

## Installation

First, install the necessary dependencies:

```sh
npm install @tapsioss/client-socket-manager socket.io-client
```

## Usage

Here is an example of how to use `ClientSocketManager` in your project:

```ts
import ClientSocketManager from '@tapsioss/client-socket-manager';

const socketManager = new ClientSocketManager('http://localhost:3000', {
  eventHandlers: {
    onSocketConnection() {
      console.log('Socket connected');
    },
    onSocketDisconnection(reason) {
      console.log('Socket disconnected:', reason);
    },
    onSuccessfulReconnection(attempt) {
      console.log('Socket reconnected after', attempt, 'attempt(s)');
    },
    onAnySubscribedMessageReceived(channel, message) {
      console.log(`Message received on ${channel}:`, message);
    },
  },
});

// Emit an event
socketManager.emit('message', 'Hello, world!');

// Subscribe to a channel
socketManager.setChannelListener('message', (msg) => {
  console.log('Message from server:', msg);
});
```

## API Reference

### Constructor

```ts
constructor(uri?: string, options?: Partial<ClientSocketManagerOptions>)
```

#### Parameters:

- `uri`: (optional): The URI of the socket server.
- `options`: (optional): Configuration options for the socket connection.

##### Options:

- `path` (default: `'/socket.io'`): The path to get the client file from.
- `reconnectionDelay` (default: `500`): The time delay in milliseconds between reconnection attempts.
- `reconnectionDelayMax` (default: `2000`): The maximum time delay in milliseconds between reconnection attempts.
- `eventHandlers`: Handlers for various socket events.
  - `onSocketConnection`: Fired when the socket is successfully connected.
  - `onSocketDisconnection`: Fired when the socket is disconnected.
  - `onServerPing`: Fired when a ping packet is received from the server.
  - `onConnectionError`: Fired upon a connection error.
  - `onReconnecting`: Fired upon an attempt to reconnect.
  - `onReconnectingError`: Fired upon a reconnection attempt error.
  - `onReconnectionFailure`: Fired when couldn't reconnect within `reconnectionAttempts`.
  - `onSuccessfulReconnection`: Fired upon a successful reconnection.
  - `onAnySubscribedMessageReceived`: Fired when any message is received from a subscribed channel.
  - `onVisiblePage`: Fired when the page's `visibilityState` changes to `visible`.
  - `onHiddenPage`: Fired when the page's `visibilityState` changes to `hidden`.

### Properties:

#### `id: string | null`

A unique identifier for the session. `null` when the socket is not connected.

#### `connected: boolean`

Whether the socket is currently connected to the server.

#### `recovered: boolean`

Whether the connection state was recovered after a temporary disconnection.

#### `autoReconnectable: boolean`

Whether the Socket will try to reconnect when its Manager connects or reconnects.

#### `originalSocketReference: Socket | null`

The original [Socket](https://socket.io/docs/v4/client-api/#socket) reference.

### Methods:

#### emit:

```ts
emit<Ev extends EventNames<EmitEvents>>(
  channel: Ev,
  ...args: EventParams<EmitEvents, Ev>
): void;
```

Emits an event to the socket identified by the channel name.

##### Parameters:

- `channel`: The name of the channel to emit the event to.
- `args`: The arguments to pass with the event.

#### setChannelListener:

```ts
setChannelListener<Ev extends EventNames<ListenEvents>>(
  channel: Ev,
  cb: ListenEvents[Ev],
  options?: {
    onSubscriptionComplete?: (channel: string) => void;
    signal?: AbortSignal;
  },
): void;
```

Subscribes to a specified channel with a callback function. Ensures that only one listener exists per channel.

##### Parameters:

- `channel`: The name of the channel to subscribe to.
- `cb`: The callback function to invoke when a message is received on the channel.
- `options`: Optional parameters.
  - `onSubscriptionComplete`: The callback function to invoke when the subscription is complete.
  - `signal`: The `AbortSignal` to unsubscribe the listener upon abortion.
  
#### deleteChannelListener:

```ts
deleteChannelListener(channel: string): void;
```

Deletes the listener for a specified channel.

##### Parameters:

- `channel`: The name of the channel whose listener should be deleted.

#### connect:

```ts
connect(): void;
```

Manually connects/reconnects the socket.

#### disconnect:

```ts
disconnect(): void;
```

Manually disconnects the socket. In that case, the socket will not try to reconnect. If this is the last active Socket instance of the Manager, the low-level connection will be closed.

#### dispose:

```ts
dispose(): void;
```

Disposes of the socket, manager, and engine, ensuring all connections are closed and cleaned up.

## Contributing

Read the [contributing guide](https://github.com/Tap30/client-socket-manager/blob/main/CONTRIBUTING.md) to learn about our development process, how to propose bug fixes and improvements, and how to build and test your changes.

## License

This project is licensed under the terms of the [MIT license](https://github.com/Tap30/client-socket-manager/blob/main/LICENSE).
