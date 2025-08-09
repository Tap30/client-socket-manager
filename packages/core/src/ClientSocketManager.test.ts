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
      devtool: {
        enabled: true,
      },
    });
    expect(devtool.getDevtoolElement()).not.toBeNull();
  });

  it("should be synchronized with the devtool", async () => {
    const connectResolver = createPromiseResolvers();
    const initResolver = createPromiseResolvers();
    const initMessageResolver = createPromiseResolvers();
    const diposeResolver = createPromiseResolvers();

    socketManager = new ClientSocketManager(socketServerUri, {
      devtool: {
        enabled: true,
      },
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

    // at first the devtool should be in the dom but because we have no logs or channels, these sections shouldn't exist.
    expect(devtool.getDevtoolElement()).not.toBeNull();
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

    // hiding devtool hide the devtool from the browser...
    socketManager.hideDevtool();
    expect(devtool.getDevtoolElement()).toBeNull();
    // ... but the devtool state should remain the same
    expect(socketManager.connected).toBe(true);
    expect(socketManager.disposed).toBe(false);

    // the devtool can be visible again
    socketManager.showDevtool();
    expect(devtool.getDevtoolElement()).not.toBeNull();
    expect(devtool.getDevtoolStatusElement()?.innerHTML).toEqual(
      devtool.Status.CONNECTED,
    );
    expect(devtool.getDevtoolLogSectionElement()!.children).toHaveLength(3);

    socketManager.dispose();

    await diposeResolver.promise;

    expect(socketManager.connected).toBe(false);
    expect(socketManager.disposed).toBe(true);
  });

  it("should apply the specified z-index to the devtool and ensure correct click behavior", async () => {
    const connectResolver = createPromiseResolvers();
    const zIndex = 20;

    // Create a div with a higher z-index to be on top of the devtool
    const overlayDiv = document.createElement("div");

    overlayDiv.style.position = "fixed";
    overlayDiv.style.top = "0";
    overlayDiv.style.left = "0";
    overlayDiv.style.width = "100%";
    overlayDiv.style.height = "100%";
    overlayDiv.style.backgroundColor = "rgba(0,0,0,0.1)"; // Semi-transparent
    overlayDiv.style.zIndex = (zIndex + 1).toString(); // Higher z-index
    overlayDiv.id = "overlay-div";
    document.body.appendChild(overlayDiv);

    // Track clicks on the overlay and the devtool
    let overlayClicked = false;
    let devtoolClicked = false;

    overlayDiv.addEventListener("click", () => {
      overlayClicked = true;
    });

    socketManager = new ClientSocketManager(socketServerUri, {
      devtool: {
        enabled: true,
        zIndex,
      },
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
      },
    });

    await connectResolver.promise;

    const devtoolElement = devtool.getDevtoolElement();

    expect(devtoolElement).not.toBeNull();

    // Add a click listener to the devtool itself to detect if it's reachable
    devtoolElement?.addEventListener("click", () => {
      devtoolClicked = true;
    });

    if (overlayDiv) {
      const { left, top, width, height } = overlayDiv.getBoundingClientRect();
      const clientX = left + width / 2;
      const clientY = top + height / 2;

      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
      });

      overlayDiv.dispatchEvent(clickEvent); // Dispatch click on the overlay
    }

    // Assert that only the overlay was clicked, indicating it was on top
    expect(overlayClicked).toBe(true);
    expect(devtoolClicked).toBe(false); // This should now pass if the overlay intercepted the click

    // Clean up the overlay div
    document.body.removeChild(overlayDiv);
  });

  it("should capture click when devtool z-index is higher than overlay", async () => {
    const connectResolver = createPromiseResolvers();
    const devtoolZIndex = 30; // Devtool will have a higher z-index

    // Create an overlay div with a lower z-index
    const overlayDiv = document.createElement("div");

    overlayDiv.style.position = "fixed";
    overlayDiv.style.top = "0";
    overlayDiv.style.left = "0";
    overlayDiv.style.width = "100%";
    overlayDiv.style.height = "100%";
    overlayDiv.style.backgroundColor = "rgba(0,0,0,0.1)"; // Semi-transparent
    overlayDiv.style.zIndex = (devtoolZIndex - 1).toString(); // Lower z-index than devtool
    overlayDiv.id = "lower-overlay-div";
    document.body.appendChild(overlayDiv);

    let overlayClicked = false;
    let devtoolClicked = false;

    overlayDiv.addEventListener("click", () => {
      overlayClicked = true;
    });

    socketManager = new ClientSocketManager(socketServerUri, {
      devtool: {
        enabled: true,
        zIndex: devtoolZIndex, // Set devtool's z-index to be higher
      },
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
      },
    });

    await connectResolver.promise;

    const devtoolElement = devtool.getDevtoolElement();

    expect(devtoolElement).not.toBeNull();

    devtoolElement?.addEventListener("click", () => {
      devtoolClicked = true;
    });

    // Simulate a click on the devtool.
    // Since the devtool's z-index is higher, it should receive the click.
    if (devtoolElement) {
      const { left, top, width, height } =
        devtoolElement.getBoundingClientRect();

      const clientX = left + width / 2;
      const clientY = top + height / 2;

      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
      });

      devtoolElement.dispatchEvent(clickEvent); // Dispatch click directly on the devtool
    }

    // Assert that the devtool was clicked, and the overlay was not
    expect(devtoolClicked).toBe(true);
    expect(overlayClicked).toBe(false);

    // Clean up the overlay div
    document.body.removeChild(overlayDiv);
  });
});
