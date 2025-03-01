import {
  MockClientSocketManager as __MockClientSocketManager__,
  act,
  render,
  screen,
} from "@repo/test-helpers";
import {
  ClientSocketManager,
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
import { ConnectionStatus } from "./constants.ts";
import { SocketContext } from "./Context.ts";
import SocketClientProvider from "./SocketClientProvider.tsx";

// Mock the ClientSocketManager class
vitest.mock("@tapsioss/client-socket-manager", () => {
  return {
    ClientSocketManager: vitest.fn(
      (uri: string, options?: Partial<ClientSocketManagerOptions>) =>
        new __MockClientSocketManager__(uri, options),
    ),
  };
});

describe("SocketClientProvider", () => {
  beforeEach(() => {
    vitest.clearAllMocks();
  });

  const socketServerUri = "http://localhost:3000";
  const MockClientSocketManager = ClientSocketManager as MockedClass<
    typeof ClientSocketManager
  >;

  it("should throw error when nested SocketClientProvider is detected", () => {
    expect(() => {
      render(
        <SocketClientProvider uri={socketServerUri}>
          <SocketClientProvider uri={socketServerUri}>
            <div />
          </SocketClientProvider>
        </SocketClientProvider>,
      );
    }).toThrow();
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
});
