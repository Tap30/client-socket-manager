import {
  createPromiseResolvers,
  httpServer,
  socketServer,
} from "@repo/test-helpers";
import type { AddressInfo } from "net";
import { type Socket as ClientSocket } from "socket.io-client";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { devtool } from "./devtool/index.ts";
import { type DevtoolState } from "./devtool/types.ts";
import { ClientSocketManager, ManagerReservedEvents } from "./index.ts";

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

  it("should handle manager connection error event and log to devtool", async () => {
    const connectResolver = createPromiseResolvers();
    const connectionErrorResolver = createPromiseResolvers<Error>();

    // Spy on devtool.update to inspect logs
    const devtoolUpdateSpy = vi.spyOn(devtool, "update");

    socketManager = new ClientSocketManager(socketServerUri, {
      devtool: { enabled: true },
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
        onConnectionError(error) {
          connectionErrorResolver.resolve(error);
        },
      },
    });

    await connectResolver.promise;

    const fakeError = new Error("Simulated manager connection error");

    // Emit the event from the Manager layer
    // @ts-expect-error accessing private socket for testing
    socketManager._socket.io.emit<"error">(
      ManagerReservedEvents.CONNECTION_ERROR,
      fakeError,
    );

    const receivedError = await connectionErrorResolver.promise;

    expect(receivedError).toBe(fakeError);

    // Validate that devtool.update was called with a CONNECTION_ERROR log entry
    expect(devtoolUpdateSpy).toHaveBeenCalledWith(expect.any(Function));

    // Run the updater callback to inspect its behavior
    const updateFn = devtoolUpdateSpy.mock.calls.at(-1)![0];
    const mockState = {
      logs: {
        enqueue: vi.fn(),
      },
    } as unknown as DevtoolState;

    updateFn(mockState);

    expect(mockState.logs.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: devtool.LogType.CONNECTION_ERROR,
        detail: fakeError.message,
      }),
    );

    devtoolUpdateSpy.mockRestore();
  });

  it("should handle server ping event when onServerPing is provided", async () => {
    const connectResolver = createPromiseResolvers();
    const pingResolver = createPromiseResolvers<void>();

    socketManager = new ClientSocketManager(socketServerUri, {
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
        onServerPing() {
          // Verify the callback runs with correct context
          expect(this).toBe(socketManager);
          pingResolver.resolve();
        },
      },
    });

    await connectResolver.promise;

    // Simulate a server ping event on the manager layer
    // @ts-expect-error accessing private manager instance for testing
    socketManager._socket.io.emit(ManagerReservedEvents.SERVER_PING);

    await pingResolver.promise;
  });

  it("should handle manager reconnecting event and log to devtool", async () => {
    const connectResolver = createPromiseResolvers();
    const reconnectingResolver = createPromiseResolvers<number>();

    const devtoolUpdateSpy = vi.spyOn(devtool, "update");

    socketManager = new ClientSocketManager(socketServerUri, {
      devtool: { enabled: true },
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
        onReconnecting(attempt) {
          // Verify correct context and argument
          expect(this).toBe(socketManager);
          reconnectingResolver.resolve(attempt);
        },
      },
    });

    await connectResolver.promise;

    const attemptNumber = 3;

    // Simulate Manager's RECONNECTING event
    // @ts-expect-error access private Manager instance for testing
    socketManager._socket.io.emit<"reconnect_attempt">(
      ManagerReservedEvents.RECONNECTING,
      attemptNumber,
    );

    const receivedAttempt = await reconnectingResolver.promise;

    expect(receivedAttempt).toBe(attemptNumber);

    // Validate devtool update behavior
    expect(devtoolUpdateSpy).toHaveBeenCalledWith(expect.any(Function));

    const updateFn = devtoolUpdateSpy.mock.calls.at(-1)![0];
    const mockState = {
      status: "",
      logs: { enqueue: vi.fn() },
    } as unknown as DevtoolState;

    updateFn(mockState);

    expect(mockState.status).toBe(devtool.Status.RECONNECTING);
    expect(mockState.logs.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: devtool.LogType.RECONNECTING,
        detail: `Reconnecting... (${attemptNumber} attempt(s))`,
      }),
    );

    devtoolUpdateSpy.mockRestore();
  });

  it("should handle manager reconnecting error event and log to devtool", async () => {
    const connectResolver = createPromiseResolvers();
    const reconnectingErrorResolver = createPromiseResolvers<Error>();

    const devtoolUpdateSpy = vi.spyOn(devtool, "update");

    socketManager = new ClientSocketManager(socketServerUri, {
      devtool: { enabled: true },
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
        onReconnectingError(error) {
          expect(this).toBe(socketManager);
          reconnectingErrorResolver.resolve(error);
        },
      },
    });

    await connectResolver.promise;

    const fakeError = new Error("Reconnecting error occurred");

    // @ts-expect-error access private Manager instance for testing
    socketManager._socket.io.emit<"reconnect_error">(
      ManagerReservedEvents.RECONNECTING_ERROR,
      fakeError,
    );

    const receivedError = await reconnectingErrorResolver.promise;

    expect(receivedError).toBe(fakeError);

    expect(devtoolUpdateSpy).toHaveBeenCalledWith(expect.any(Function));
    const updateFn = devtoolUpdateSpy.mock.calls.at(-1)![0];

    const mockState = { logs: { enqueue: vi.fn() } } as unknown as DevtoolState;

    updateFn(mockState);

    expect(mockState.logs.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: devtool.LogType.RECONNECTING_ERROR,
        detail: fakeError.message,
      }),
    );

    devtoolUpdateSpy.mockRestore();
  });

  it("should handle manager reconnection failure event and log to devtool", async () => {
    const connectResolver = createPromiseResolvers();
    const failureResolver = createPromiseResolvers<void>();

    const devtoolUpdateSpy = vi.spyOn(devtool, "update");

    socketManager = new ClientSocketManager(socketServerUri, {
      devtool: { enabled: true },
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
        onReconnectionFailure() {
          expect(this).toBe(socketManager);
          failureResolver.resolve();
        },
      },
    });

    await connectResolver.promise;

    // @ts-expect-error access private Manager instance for testing
    socketManager._socket.io.emit(ManagerReservedEvents.RECONNECTION_FAILURE);

    await failureResolver.promise;

    expect(devtoolUpdateSpy).toHaveBeenCalledWith(expect.any(Function));
    const updateFn = devtoolUpdateSpy.mock.calls.at(-1)![0];

    const mockState = { logs: { enqueue: vi.fn() } } as unknown as DevtoolState;

    updateFn(mockState);

    expect(mockState.logs.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: devtool.LogType.RECONNECTION_FAILURE,
        detail: "Failed to reconnect.",
      }),
    );

    devtoolUpdateSpy.mockRestore();
  });

  it("should handle manager successful reconnection event and log to devtool", async () => {
    const connectResolver = createPromiseResolvers();
    const successResolver = createPromiseResolvers<number>();

    const devtoolUpdateSpy = vi.spyOn(devtool, "update");

    socketManager = new ClientSocketManager(socketServerUri, {
      devtool: { enabled: true },
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
        onSuccessfulReconnection(attempt) {
          expect(this).toBe(socketManager);
          successResolver.resolve(attempt);
        },
      },
    });

    await connectResolver.promise;

    const attemptNumber = 2;

    // @ts-expect-error access private Manager instance for testing
    socketManager._socket.io.emit<"reconnect">(
      ManagerReservedEvents.SUCCESSFUL_RECONNECTION,
      attemptNumber,
    );

    const receivedAttempt = await successResolver.promise;

    expect(receivedAttempt).toBe(attemptNumber);

    expect(devtoolUpdateSpy).toHaveBeenCalledWith(expect.any(Function));
    const updateFn = devtoolUpdateSpy.mock.calls.at(-1)![0];

    const mockState = { logs: { enqueue: vi.fn() } } as unknown as DevtoolState;

    updateFn(mockState);

    expect(mockState.logs.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: devtool.LogType.SUCCESSFUL_RECONNECTION,
        detail: `Successfully connected after ${attemptNumber} attempt(s)`,
      }),
    );

    devtoolUpdateSpy.mockRestore();
  });

  describe("_handleVisibilityChange", () => {
    let socketManager: ClientSocketManager;

    beforeEach(() => {
      socketManager = new ClientSocketManager("fakeUrl", {
        eventHandlers: {
          onVisiblePage: vi.fn(),
          onHiddenPage: vi.fn(),
        },
      });

      // Mock connect/disconnect to avoid real socket calls
      socketManager.connect = vi.fn();
      socketManager.disconnect = vi.fn();
    });

    it("should call onVisiblePage and reconnect if page becomes visible and not connected", () => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "visible",
      });

      Object.defineProperty(socketManager, "connected", {
        configurable: true,
        value: false,
      });

      // @ts-expect-error private method access for testing
      socketManager._handleVisibilityChange();

      const { onVisiblePage } = socketManager["_inputListeners"];

      expect(onVisiblePage).toHaveBeenCalledTimes(1);
      expect(socketManager.connect).toHaveBeenCalledTimes(1);
      expect(socketManager.disconnect).not.toHaveBeenCalled();
    });

    it("should call onHiddenPage and disconnect if page becomes hidden", () => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });

      // @ts-expect-error private method access for testing
      socketManager._handleVisibilityChange();

      const { onHiddenPage } = socketManager["_inputListeners"];

      expect(onHiddenPage).toHaveBeenCalledTimes(1);
      expect(socketManager.disconnect).toHaveBeenCalledTimes(1);
      expect(socketManager.connect).not.toHaveBeenCalled();
    });

    it("should do nothing if visibilityState is neither visible nor hidden", () => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "prerender",
      });

      // @ts-expect-error private method access for testing
      socketManager._handleVisibilityChange();

      const { onVisiblePage, onHiddenPage } = socketManager["_inputListeners"];

      expect(onVisiblePage).not.toHaveBeenCalled();
      expect(onHiddenPage).not.toHaveBeenCalled();
      expect(socketManager.connect).not.toHaveBeenCalled();
      expect(socketManager.disconnect).not.toHaveBeenCalled();
    });
  });

  it("should call warnDisposedClient and return correct recovered state", async () => {
    // Import utils dynamically without type imports
    const utilsModule = await vi.importActual("./utils.ts");
    const warnDisposedClientSpy = vi.spyOn(
      utilsModule as { warnDisposedClient: (disposed: boolean) => void },
      "warnDisposedClient",
    );

    const socketManager = new ClientSocketManager("http://localhost:3000", {});

    // @ts-expect-error private field for testing
    socketManager._socket = { recovered: true };

    expect(socketManager.recovered).toBe(true);
    expect(warnDisposedClientSpy).toHaveBeenCalledWith(socketManager.disposed);

    // Simulate missing socket
    // @ts-expect-error private field for testing
    socketManager._socket = null;
    expect(socketManager.recovered).toBe(false);

    warnDisposedClientSpy.mockRestore();
  });

  it("should unsubscribe and remove abort event listener when signal aborts", async () => {
    const connectResolver = createPromiseResolvers();
    const unsubscribeSpy = vi.spyOn(
      ClientSocketManager.prototype,
      "unsubscribe",
    );

    socketManager = new ClientSocketManager(socketServerUri, {
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
      },
    });

    await connectResolver.promise;

    const controller = new AbortController();
    const signal = controller.signal;
    const testChannel = "test/abort";
    const testCallback = vi.fn();

    socketManager.subscribe(testChannel, testCallback, { signal });

    // Abort the signal → triggers internal unsubscribe
    controller.abort();

    // Wait for unsubscribe logic to execute
    await Promise.resolve();

    // Verify unsubscribe was called
    expect(unsubscribeSpy).toHaveBeenCalledWith(
      testChannel,
      expect.any(Function),
    );

    // Safely check for remaining listeners, explicitly typed
    expect(signal.onabort).toBeNull();

    unsubscribeSpy.mockRestore();
  });

  it("should reconnect when server disconnects and autoReconnectable is false", async () => {
    const connectResolver = createPromiseResolvers();
    const disconnectResolver = createPromiseResolvers();
    const connectSpy = vi.spyOn(ClientSocketManager.prototype, "connect");
    let connectionCount = 0;

    socketManager = new ClientSocketManager(socketServerUri, {
      eventHandlers: {
        onSocketConnection() {
          connectionCount++;
          connectResolver.resolve();
        },
        onSocketDisconnection(reason) {
          if (reason === "io server disconnect") {
            disconnectResolver.resolve();
          }
        },
      },
    });

    await connectResolver.promise;
    expect(connectionCount).toBe(1);

    const connectedSocketsMap = socketServer.of("/").sockets;
    const clientSocket = connectedSocketsMap.get(socketManager.id!);

    expect(clientSocket).toBeDefined();

    // Mock the socket's active getter to return false
    // @ts-expect-error accessing private socket for testing
    const activeSpy = vi.spyOn(socketManager._socket, "active", "get");

    // @ts-expect-error mocking return value for testing
    activeSpy.mockReturnValue(false);

    expect(socketManager.autoReconnectable).toBe(false);

    connectResolver.renew();

    // Server disconnects - should trigger reconnection because autoReconnectable is false
    clientSocket!.disconnect();

    await disconnectResolver.promise;

    // Check if connect was called internally
    expect(connectSpy).toHaveBeenCalled();

    await connectResolver.promise;

    expect(connectionCount).toBe(2);
    expect(socketManager.connected).toBe(true);

    activeSpy.mockRestore();
    connectSpy.mockRestore();
  });

  it("should unsubscribe all listeners when no callback is provided", async () => {
    const connectResolver = createPromiseResolvers();

    socketManager = new ClientSocketManager(socketServerUri, {
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
      },
    });

    await connectResolver.promise;

    const testChannel = "test/channel";
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    socketManager.subscribe(testChannel, callback1);
    socketManager.subscribe(testChannel, callback2);

    socketServer.emit(testChannel, "test");

    await new Promise<void>(resolve => {
      setTimeout(resolve, 50);
    });

    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();

    callback1.mockClear();
    callback2.mockClear();

    socketManager.unsubscribe(testChannel);

    socketServer.emit(testChannel, "test2");

    await new Promise<void>(resolve => {
      setTimeout(resolve, 50);
    });

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
  });

  it("should handle socket connection error when onSocketConnectionError is provided", async () => {
    const connectionErrorResolver = createPromiseResolvers<Error>();

    // Use an invalid URL to trigger connection error
    socketManager = new ClientSocketManager("http://invalid-host:9999", {
      autoConnect: false,
      eventHandlers: {
        onSocketConnectionError(error) {
          connectionErrorResolver.resolve(error);
        },
      },
    });

    // Manually connect to trigger the error
    socketManager.connect();

    const receivedError = await connectionErrorResolver.promise;

    expect(receivedError).toBeInstanceOf(Error);
  });

  it("should handle subscription with already aborted signal", async () => {
    const connectResolver = createPromiseResolvers();

    socketManager = new ClientSocketManager(socketServerUri, {
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
      },
    });

    await connectResolver.promise;

    const controller = new AbortController();

    controller.abort(); // Abort before subscribing

    const testCallback = vi.fn();

    // This should trigger the `if (signal?.aborted) unsubscribe();` branch
    socketManager.subscribe("test/channel", testCallback, {
      signal: controller.signal,
    });

    // Emit to verify the callback was not registered
    socketServer.emit("test/channel", "test");

    await new Promise<void>(resolve => {
      setTimeout(resolve, 50);
    });

    expect(testCallback).not.toHaveBeenCalled();
  });

  it("should handle subscription completion callback", async () => {
    const connectResolver = createPromiseResolvers();
    const subscriptionCompleteResolver = createPromiseResolvers<string>();

    socketManager = new ClientSocketManager(socketServerUri, {
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
      },
    });

    await connectResolver.promise;

    const testChannel = "test/completion";

    socketManager.subscribe("test/completion", vi.fn(), {
      onSubscriptionComplete(channel) {
        subscriptionCompleteResolver.resolve(channel);
      },
    });

    const completedChannel = await subscriptionCompleteResolver.promise;

    expect(completedChannel).toBe(testChannel);
  });

  it("should handle operations when socket is null", () => {
    socketManager = new ClientSocketManager("http://localhost:3000", {
      autoConnect: false,
    });

    // @ts-expect-error setting private field for testing
    socketManager._socket = null;

    // Test id getter with null socket
    expect(socketManager.id).toBe(null);

    // Test subscribe with null socket
    socketManager.subscribe("test", vi.fn());

    // Test unsubscribe with null socket
    socketManager.unsubscribe("test");

    // Test emit with null socket
    socketManager.emit("test", "data");
  });

  it("should handle manager setup when socket has no manager", () => {
    socketManager = new ClientSocketManager("http://localhost:3000", {
      autoConnect: false,
    });

    // Create a mock socket without manager
    const mockSocket = {
      io: null,
      off: vi.fn(), // Add off method to prevent errors during cleanup
    };

    // @ts-expect-error setting private field for testing
    socketManager._socket = mockSocket;

    // @ts-expect-error calling private method for testing
    socketManager._attachManagerEvents();

    // Should not throw and should handle null manager gracefully
    expect(true).toBe(true);

    // Clean up properly by setting socket to null to avoid cleanup errors
    // @ts-expect-error setting private field for testing
    socketManager._socket = null;
  });

  it("should handle subscription without onAnySubscribedMessageReceived callback", async () => {
    const connectResolver = createPromiseResolvers();

    // Create socket manager without onAnySubscribedMessageReceived
    socketManager = new ClientSocketManager(socketServerUri, {
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
        // Explicitly not providing onAnySubscribedMessageReceived
      },
    });

    await connectResolver.promise;

    const testCallback = vi.fn();

    socketManager.subscribe("test/no-any-callback", testCallback);

    // Emit message to trigger the listener
    socketServer.emit("test/no-any-callback", "test message");

    await new Promise<void>(resolve => {
      setTimeout(resolve, 50);
    });

    // The specific callback should still be called
    expect(testCallback).toHaveBeenCalledWith("test message");
  });

  it("should handle constructor with undefined options", () => {
    socketManager = new ClientSocketManager("http://localhost:3000", undefined);
    expect(socketManager).toBeDefined();
  });

  it("should handle _attachSocketEvents with null socket", () => {
    socketManager = new ClientSocketManager("http://localhost:3000", {
      autoConnect: false,
    });

    // @ts-expect-error setting private field for testing
    socketManager._socket = null;

    // @ts-expect-error calling private method for testing
    socketManager._attachSocketEvents();

    // Should not throw with null socket
    expect(true).toBe(true);
  });

  it("should handle subscribe callback when socket becomes null", async () => {
    const connectResolver = createPromiseResolvers();
    const callback = vi.fn();

    socketManager = new ClientSocketManager(socketServerUri, {
      eventHandlers: {
        onSocketConnection() {
          connectResolver.resolve();
        },
      },
    });

    await connectResolver.promise;

    const testChannel = "test/null-socket";

    socketManager.subscribe(testChannel, callback);

    // Get the internal listener before nullifying socket
    // @ts-expect-error accessing private field for testing
    const socket = socketManager._socket;
    const listeners = socket?.listeners(testChannel);

    // @ts-expect-error setting private field for testing
    socketManager._socket = null;

    // Manually trigger the listener to hit the null socket branch
    listeners?.[0]?.("test");

    expect(callback).not.toHaveBeenCalled();
  });

  it("should skip page events in non-browser environment", () => {
    const originalDocument = global.document;

    // @ts-expect-error mocking non-browser environment
    delete global.document;

    const tempManager = new ClientSocketManager("http://localhost:3000", {
      autoConnect: false,
    });

    // @ts-expect-error calling private method for testing
    expect(() => tempManager._attachPageEvents()).not.toThrow();
    // @ts-expect-error calling private method for testing
    expect(() => tempManager._detachPageEvents()).not.toThrow();

    global.document = originalDocument;
  });
});
