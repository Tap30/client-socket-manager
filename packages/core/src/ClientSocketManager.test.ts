import {
  createPromiseResolvers,
  httpServer,
  socketServer,
} from "@repo/test-helpers";
import type { AddressInfo } from "net";
import type { Socket as ClientSocket } from "socket.io-client";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import * as devtool from "./devtool/devtool.ts";
import { ClientSocketManager } from "./index.ts";

describe("ClientSocketManager: unit tests", () => {
  let httpServerAddr: AddressInfo | string | null = null;
  let socketServerUri: string = "";
  let socketManager: ClientSocketManager | null = null;

  beforeAll(() => {
    return new Promise<void>(resolve => {
      httpServer.listen(3000, () => {
        httpServerAddr = httpServer.address();

        resolve();
      });
    });
  });

  afterAll(() => {
    return new Promise<void>(resolve => {
      void socketServer.close().then(() => {
        httpServer.close(() => {
          resolve();
        });
      });
    });
  });

  beforeEach(() => {
    if (!httpServerAddr) {
      throw new Error(
        `Expected valid http-server address. Received \`${httpServerAddr}\`.`,
      );
    }

    socketServerUri =
      typeof httpServerAddr === "string"
        ? httpServerAddr
        : `http://localhost:${httpServerAddr.port}`;
  });

  afterEach(() => {
    socketManager?.dispose();
    socketManager = null;
  });

  it("should connect", async () => {
    const connectResolver = createPromiseResolvers();

    socketManager = new ClientSocketManager(socketServerUri, {
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
      },
    });

    await connectResolver.promise;

    expect(socketManager.connected).toBe(true);
  });

  it("should handle disconnection", async () => {
    const connectResolver = createPromiseResolvers();
    const disconnectResolver =
      createPromiseResolvers<ClientSocket.DisconnectReason>();

    socketManager = new ClientSocketManager(socketServerUri, {
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
        onSocketDisconnection(reason) {
          disconnectResolver.resolve(reason);
        },
      },
    });

    await connectResolver.promise;

    socketManager.disconnect();

    const clientReason = await disconnectResolver.promise;

    expect(socketManager.connected).toBe(false);
    expect(clientReason).toBe("io client disconnect");

    connectResolver.renew();
    disconnectResolver.renew();

    socketManager.connect();

    await connectResolver.promise;

    expect(socketManager.connected).toBe(true);

    const connectedSocketsMap = socketServer.of("/").sockets;
    const clientSocket = connectedSocketsMap.get(socketManager.id!);

    expect(clientSocket).toBeDefined();

    clientSocket!.disconnect();

    const serverReason = await disconnectResolver.promise;

    expect(socketManager.connected).toBe(false);
    expect(serverReason).toBe("io server disconnect");
  });

  it("should handle reconnection", async () => {
    const connectResolver = createPromiseResolvers();
    const serverDisconnectResolver = createPromiseResolvers();

    socketManager = new ClientSocketManager(socketServerUri, {
      eventHandlers: {
        onSocketDisconnection(reason) {
          if (reason === "io server disconnect") {
            serverDisconnectResolver.resolve();
          }
        },
        onSocketConnection() {
          connectResolver.resolve();
        },
      },
    });

    await connectResolver.promise;

    expect(socketManager.connected).toBe(true);

    socketManager.disconnect();

    // Should not reconnect when manually disconnected by client
    expect(socketManager.connected).toBe(false);

    connectResolver.renew();
    socketManager.connect();

    await connectResolver.promise;

    expect(socketManager.connected).toBe(true);

    const connectedSocketsMap = socketServer.of("/").sockets;
    const clientSocket = connectedSocketsMap.get(socketManager.id!);

    connectResolver.renew();

    expect(clientSocket).toBeDefined();

    clientSocket!.disconnect();

    await serverDisconnectResolver.promise;

    expect(socketManager.connected).toBe(false);

    await connectResolver.promise;

    // Should reconnect when manually disconnected by the server
    expect(socketManager.connected).toBe(true);
  });

  it("should receive a message", async () => {
    const connectResolver = createPromiseResolvers();
    const messageResolver = createPromiseResolvers<string>();
    const anyMessageResolver = createPromiseResolvers<[string, string[]]>();

    const serverChannel = "server/message";
    const serverMessage = "Hello from the server!";

    socketManager = new ClientSocketManager(socketServerUri, {
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
        onAnySubscribedMessageReceived(channel, received) {
          anyMessageResolver.resolve([channel, received as string[]]);
        },
      },
    });

    await connectResolver.promise;

    expect(socketManager.connected).toBe(true);

    socketManager.subscribe(serverChannel, msg => {
      messageResolver.resolve(msg as string);
    });

    socketServer.emit(serverChannel, serverMessage);

    const [message, anyMessage] = await Promise.all([
      messageResolver.promise,
      anyMessageResolver.promise,
    ]);

    const [channel, received] = anyMessage;

    expect(message).toBe(serverMessage);
    expect(channel).toBe(serverChannel);
    expect(received).toEqual([serverMessage]);
  });

  it("should send a message", async () => {
    const connectResolver = createPromiseResolvers();
    const messageResolver = createPromiseResolvers<string>();

    const serverChannel = "server/message";
    const clientMessage = "Hello from the client!";

    socketManager = new ClientSocketManager(socketServerUri, {
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
      },
    });

    await connectResolver.promise;

    expect(socketManager.connected).toBe(true);

    const connectedSocketsMap = socketServer.of("/").sockets;
    const clientSocket = connectedSocketsMap.get(socketManager.id!);

    expect(clientSocket).toBeDefined();

    clientSocket!.on(serverChannel, msg => {
      messageResolver.resolve(msg as string);
    });

    socketManager.emit(serverChannel, clientMessage);

    const message = await messageResolver.promise;

    expect(message).toBe(clientMessage);
  });

  it("should handle init and dipose", async () => {
    const connectResolver = createPromiseResolvers();
    const initResolver = createPromiseResolvers();
    const initMessageResolver = createPromiseResolvers();
    const diposeResolver = createPromiseResolvers();

    socketManager = new ClientSocketManager(socketServerUri, {
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
        onInit() {
          initResolver.resolve();
          this.subscribe("test/init", () => {
            initMessageResolver.resolve();
          });
        },
        onDispose() {
          diposeResolver.resolve();
        },
      },
    });

    await connectResolver.promise;

    expect(socketManager.connected).toBe(true);
    expect(socketManager.disposed).toBe(false);

    await initResolver.promise;

    socketServer.emit("test/init");

    await initMessageResolver.promise;

    socketManager.dispose();

    await diposeResolver.promise;

    expect(socketManager.connected).toBe(false);
    expect(socketManager.disposed).toBe(true);
  });

  it("should show devtool when the `devtool` option is true", () => {
    socketManager = new ClientSocketManager(socketServerUri, {});
    expect(devtool.getDevtoolElement()).toBeNull();
    socketManager.dispose();

    socketManager = new ClientSocketManager(socketServerUri, {
      devtool: true,
    });
    expect(devtool.getDevtoolElement()).not.toBeNull();
  });

  it("should update devtool ui when socket was updated", async () => {
    const connectResolver = createPromiseResolvers();
    const initResolver = createPromiseResolvers();
    const initMessageResolver = createPromiseResolvers();
    const diposeResolver = createPromiseResolvers();

    socketManager = new ClientSocketManager(socketServerUri, {
      devtool: true,
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
        onInit() {
          initResolver.resolve();
          this.subscribe("test/init", () => {
            initMessageResolver.resolve();
          });
        },
        onDispose() {
          diposeResolver.resolve();
        },
      },
    });

    // at first the devtool should be in the dom but because no we have lo logs or channels, these sections shouldn't exist.
    expect(devtool.getDevtoolElement()).not.toBeNull();
    expect(devtool.getDevtoolLogSectionElement()).toBeNull();
    expect(devtool.getDevtoolChannelsElement()).toBeNull();
    expect(devtool.getDevtoolInfoElement()).not.toBeNull();
    expect(devtool.getDevtoolStatusElement()?.innerHTML).not.toEqual(
      devtool.Status.CONNECTED,
    );

    await connectResolver.promise;

    // now the log should be visible to the user
    expect(devtool.getDevtoolLogSectionElement()).not.toBeNull();
    expect(devtool.getDevtoolStatusElement()?.innerHTML).toEqual(
      devtool.Status.CONNECTED,
    );
    await initResolver.promise;

    // subscribing to a channel...
    expect(devtool.getDevtoolLogSectionElement()!.innerHTML).not.toContain(
      devtool.LogType.SUBSCRIBED,
    );
    expect(devtool.getDevtoolChannelsElement()).toBeNull();

    socketManager.subscribe("test/init", () => {});

    expect(devtool.getDevtoolChannelsElement()).not.toBeNull();
    expect(devtool.getDevtoolLogSectionElement()!.innerHTML).toContain(
      devtool.LogType.SUBSCRIBED,
    );
    expect(devtool.getDevtoolChannelsElement()!.innerHTML).contain("test/init");

    // unsubscribing a channel...
    expect(devtool.getDevtoolLogSectionElement()!.innerHTML).not.toContain(
      devtool.LogType.UNSUBSCRIBED,
    );

    socketManager.unsubscribe("test/init", () => {});

    expect(devtool.getDevtoolLogSectionElement()!.innerHTML).toContain(
      devtool.LogType.UNSUBSCRIBED,
    );
    expect(devtool.getDevtoolChannelsElement()).toBeNull();

    socketManager.dispose();

    await diposeResolver.promise;

    expect(socketManager.connected).toBe(false);
    expect(socketManager.disposed).toBe(true);
  });
});
