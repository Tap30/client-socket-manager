import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "@jest/globals";
import type { AddressInfo } from "net";
import type { Socket as ClientSocket } from "socket.io-client";
import { ClientSocketManager } from "../src/index.ts";
import createPromiseResolvers from "./utils/promise-resolvers.ts";
import { httpServer, socketServer } from "./utils/server.ts";

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
    const messageResolver = createPromiseResolvers();
    const anyMessageResolver = createPromiseResolvers();

    const serverChannel = "server/message";
    const serverMessage = "Hello from the server!";

    socketManager = new ClientSocketManager(socketServerUri, {
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
        onAnySubscribedMessageReceived(channel, received) {
          anyMessageResolver.resolve();

          expect(channel).toBe(serverChannel);
          expect(received).toEqual([serverMessage]);
        },
      },
    });

    await connectResolver.promise;

    expect(socketManager.connected).toBe(true);

    socketManager.setChannelListener(serverChannel, msg => {
      messageResolver.resolve();

      expect(msg).toBe(serverMessage);
    });

    socketServer.emit(serverChannel, serverMessage);

    await Promise.all([messageResolver.promise, anyMessageResolver.promise]);
  });

  it("should send a message", async () => {
    const connectResolver = createPromiseResolvers();
    const messageResolver = createPromiseResolvers();

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
      messageResolver.resolve();

      expect(msg).toBe(clientMessage);
    });

    socketManager.emit(serverChannel, clientMessage);

    await messageResolver.promise;
  });
});
