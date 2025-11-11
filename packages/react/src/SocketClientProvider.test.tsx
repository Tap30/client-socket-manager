import {
  ClientSocketManager,
  ClientSocketManagerStub,
  type ClientSocketManagerOptions,
} from "@tapsioss/client-socket-manager";
import { act, cleanup, render, screen } from "@testing-library/react";
import {
  beforeEach,
  describe,
  expect,
  it,
  vitest,
  type MockedClass,
} from "vitest";
import { ConnectionStatus } from "./constants.ts";
import { SocketContext } from "./Context.ts";
import SocketClientProvider from "./SocketClientProvider.tsx";

// Mock the ClientSocketManager class
vitest.mock("@tapsioss/client-socket-manager", async () => {
  const actualImports = await vitest.importActual(
    "@tapsioss/client-socket-manager",
  );

  return {
    ...actualImports,
    ClientSocketManager: vitest.fn(
      (uri: string, options?: Partial<ClientSocketManagerOptions>) =>
        new ClientSocketManagerStub(uri, options),
    ),
  };
});

describe("SocketClientProvider", () => {
  beforeEach(() => {
    vitest.clearAllMocks();
    cleanup();
  });

  const socketServerUri = "http://localhost:3000";
  const MockClientSocketManager = ClientSocketManager as MockedClass<
    typeof ClientSocketManager
  >;

  it("should throw error when multiple socket instances is detected", () => {
    expect(() => {
      render(
        <SocketClientProvider uri={socketServerUri}>
          <SocketClientProvider uri={socketServerUri}>
            <div />
          </SocketClientProvider>
        </SocketClientProvider>,
      );
    }).toThrow();

    expect(() => {
      render(
        <>
          <SocketClientProvider uri={socketServerUri}>
            <div />
          </SocketClientProvider>
          <SocketClientProvider uri={socketServerUri}>
            <div />
          </SocketClientProvider>
        </>,
      );
    }).toThrow();

    expect(() => {
      render(
        <SocketClientProvider uri={socketServerUri}>
          <SocketClientProvider uri={`${socketServerUri}/ns1`}>
            <div />
          </SocketClientProvider>
        </SocketClientProvider>,
      );
    }).not.toThrow();

    expect(() => {
      render(
        <>
          <SocketClientProvider uri={`${socketServerUri}/ns2`}>
            <div />
          </SocketClientProvider>
          <SocketClientProvider uri={`${socketServerUri}/ns3`}>
            <div />
          </SocketClientProvider>
        </>,
      );
    }).not.toThrow();
  });

  it("should initialize ClientSocketManager and set connection status", () => {
    render(
      <SocketClientProvider uri={socketServerUri}>
        <SocketContext.Consumer>
          {value => (
            <div>
              <span data-testid="connection-status">
                {value!.connectionStatus}
              </span>
              <span data-testid="socket-instance">
                {value!.socket ? "true" : "false"}
              </span>
            </div>
          )}
        </SocketContext.Consumer>
      </SocketClientProvider>,
    );

    expect(MockClientSocketManager.mock.results[0]).toBeDefined();

    const client = MockClientSocketManager.mock.results[0]!
      .value as ClientSocketManager;

    expect(screen.getByTestId("connection-status")).toHaveTextContent(
      ConnectionStatus.DISCONNECTED,
    );
    expect(screen.getByTestId("socket-instance")).toHaveTextContent("true");

    act(() => {
      client.connect();
    });

    expect(screen.getByTestId("connection-status")).toHaveTextContent(
      ConnectionStatus.CONNECTED,
    );
    expect(screen.getByTestId("socket-instance")).toHaveTextContent("true");

    act(() => {
      client.disconnect();
    });

    expect(screen.getByTestId("connection-status")).toHaveTextContent(
      ConnectionStatus.DISCONNECTED,
    );
    expect(screen.getByTestId("socket-instance")).toHaveTextContent("true");

    act(() => {
      client.connect();
    });

    expect(screen.getByTestId("connection-status")).toHaveTextContent(
      ConnectionStatus.CONNECTED,
    );
    expect(screen.getByTestId("socket-instance")).toHaveTextContent("true");

    act(() => {
      client.dispose();
    });

    expect(screen.getByTestId("connection-status")).toHaveTextContent(
      ConnectionStatus.DISCONNECTED,
    );
    expect(screen.getByTestId("socket-instance")).toHaveTextContent("false");
  });

  it("should use ClientSocketManagerStub when shouldUseStob is true", () => {
    const uri = "http://localhost:4000";

    render(
      <SocketClientProvider
        uri={uri}
        shouldUseStob
      >
        <SocketContext.Consumer>
          {value => (
            <div data-testid="socket-type">
              {value?.socket instanceof ClientSocketManagerStub
                ? "stub"
                : "real"}
            </div>
          )}
        </SocketContext.Consumer>
      </SocketClientProvider>,
    );

    // Should have used the stubbed manager directly
    expect(screen.getByTestId("socket-type")).toHaveTextContent("stub");
  });

  it("should handle onReconnecting event and update connection status", () => {
    const onReconnectingMock = vitest.fn();
    const uri = "http://localhost:5000";

    render(
      <SocketClientProvider
        uri={uri}
        eventHandlers={{
          onReconnecting: onReconnectingMock,
        }}
      >
        <SocketContext.Consumer>
          {value => (
            <div data-testid="connection-status">{value?.connectionStatus}</div>
          )}
        </SocketContext.Consumer>
      </SocketClientProvider>,
    );

    const mockCalls = (
      ClientSocketManager as MockedClass<typeof ClientSocketManager>
    ).mock.calls;

    expect(mockCalls.length).toBeGreaterThan(0);

    const firstCall = mockCalls[0];
    const passedOptions = firstCall?.[1];

    expect(passedOptions).toBeDefined();
    expect(passedOptions!.eventHandlers).toBeDefined();

    // Simulate onReconnecting event
    act(() => {
      passedOptions!.eventHandlers!.onReconnecting!.call(
        {} as unknown as ClientSocketManager, // mock this context
        2, // attempt number
      );
    });

    expect(onReconnectingMock).toHaveBeenCalledWith(2);
    expect(screen.getByTestId("connection-status")).toHaveTextContent(
      ConnectionStatus.RECONNECTING,
    );
  });

  it("should handle onSocketConnection event and update connection status", () => {
    const onSocketConnectionMock = vitest.fn();
    const uri = "http://localhost:6000";

    render(
      <SocketClientProvider
        uri={uri}
        eventHandlers={{
          onSocketConnection: onSocketConnectionMock,
        }}
      >
        <SocketContext.Consumer>
          {value => (
            <div data-testid="connection-status">{value?.connectionStatus}</div>
          )}
        </SocketContext.Consumer>
      </SocketClientProvider>,
    );

    const mockCalls = (
      ClientSocketManager as MockedClass<typeof ClientSocketManager>
    ).mock.calls;

    expect(mockCalls.length).toBeGreaterThan(0);

    const firstCall = mockCalls[0];
    const passedOptions = firstCall?.[1];

    expect(passedOptions).toBeDefined();
    expect(passedOptions!.eventHandlers).toBeDefined();

    // Simulate the socket connection event
    act(() => {
      passedOptions!.eventHandlers!.onSocketConnection!.call(
        {} as unknown as ClientSocketManager, // fake "this" context
      );
    });

    // Ensure our custom event handler ran
    expect(onSocketConnectionMock).toHaveBeenCalled();

    // Ensure the provider updated its context to CONNECTED
    expect(screen.getByTestId("connection-status")).toHaveTextContent(
      ConnectionStatus.CONNECTED,
    );
  });

  it("should handle onSocketDisconnection event and update connection status", () => {
    const onSocketDisconnectionMock = vitest.fn();
    const uri = "http://localhost:7000";

    render(
      <SocketClientProvider
        uri={uri}
        eventHandlers={{
          onSocketDisconnection: onSocketDisconnectionMock,
        }}
      >
        <SocketContext.Consumer>
          {value => (
            <div data-testid="connection-status">{value?.connectionStatus}</div>
          )}
        </SocketContext.Consumer>
      </SocketClientProvider>,
    );

    const mockCalls = (
      ClientSocketManager as MockedClass<typeof ClientSocketManager>
    ).mock.calls;

    expect(mockCalls.length).toBeGreaterThan(0);

    const firstCall = mockCalls[0];
    const passedOptions = firstCall?.[1];

    expect(passedOptions).toBeDefined();
    expect(passedOptions!.eventHandlers).toBeDefined();

    const reason = "ping timeout";
    const details = { description: "" };

    // Simulate the disconnection event
    act(() => {
      passedOptions!.eventHandlers!.onSocketDisconnection!.call(
        {} as unknown as ClientSocketManager, // fake "this"
        reason,
        details,
      );
    });

    // Expect our custom handler to be called correctly
    expect(onSocketDisconnectionMock).toHaveBeenCalledWith(reason, details);

    // Expect the connection status to update to DISCONNECTED
    expect(screen.getByTestId("connection-status")).toHaveTextContent(
      ConnectionStatus.DISCONNECTED,
    );
  });
});
