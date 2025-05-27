import { act, render, screen } from "@repo/test-helpers";
import {
  ClientSocketManager,
  ClientSocketManagerStub,
  type ClientSocketManagerOptions,
} from "@tapsioss/client-socket-manager";
import {
  beforeEach,
  describe,
  expect,
  it,
  vitest,
  type MockedClass,
} from "vitest";
import { SocketContext } from "./Context.ts";
import SocketClientProvider from "./SocketClientProvider.tsx";
import { ConnectionStatus } from "./constants.ts";
import useSocketClient from "./useSocketClient.ts";

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

describe("useSocketClient", () => {
  beforeEach(() => {
    vitest.clearAllMocks();
  });

  const socketServerUri = "http://localhost:3000";
  const MockClientSocketManager = ClientSocketManager as MockedClass<
    typeof ClientSocketManager
  >;

  const TestComponent = () => {
    const context = useSocketClient();

    return (
      <div>
        <span data-testid="connection-status">{context.connectionStatus}</span>
        <span data-testid="socket-instance">
          {context.socket ? "true" : "false"}
        </span>
      </div>
    );
  };

  it("should throw error when used outside of SocketClientProvider", () => {
    expect(() => render(<TestComponent />)).toThrow();
  });

  it("should use context values when used within SocketClientProvider", () => {
    const { rerender, unmount } = render(
      <SocketContext.Provider
        value={{
          connectionStatus: ConnectionStatus.DISCONNECTED,
          socket: null,
        }}
      >
        <TestComponent />
      </SocketContext.Provider>,
    );

    expect(screen.getByTestId("connection-status")).toHaveTextContent(
      ConnectionStatus.DISCONNECTED,
    );
    expect(screen.getByTestId("socket-instance")).toHaveTextContent("false");

    rerender(
      <SocketContext.Provider
        value={{
          connectionStatus: ConnectionStatus.CONNECTED,
          socket: null,
        }}
      >
        <TestComponent />
      </SocketContext.Provider>,
    );

    expect(screen.getByTestId("connection-status")).toHaveTextContent(
      ConnectionStatus.CONNECTED,
    );
    expect(screen.getByTestId("socket-instance")).toHaveTextContent("false");

    unmount();
    render(
      <SocketClientProvider uri={socketServerUri}>
        <TestComponent />
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
      client.dispose();
    });

    expect(screen.getByTestId("connection-status")).toHaveTextContent(
      ConnectionStatus.DISCONNECTED,
    );
    expect(screen.getByTestId("socket-instance")).toHaveTextContent("true");
  });
});
