import { useContext } from "react";
import { SocketContext } from "./Context.ts";
import type { SocketClientHookReturnType } from "./types.ts";

/**
 * A React hook that provides access to the current socket client instance and its connection status.
 *
 * This hook must be used within a `<SocketClientProvider>`, otherwise it will throw an error.
 *
 * @throws Will throw an error if used outside of a `<SocketClientProvider>`.
 *
 * @returns {SocketClientHookReturnType} An object containing the socket client instance and its connection status.
 *
 * @example
 * ```tsx
 * const { socket, connectionStatus } = useSocketClient();
 * if (socket?.connected) {
 *   socket.emit("message", { text: "Hello" });
 * }
 * ```
 */
const useSocketClient = (): SocketClientHookReturnType => {
  const ctx = useContext(SocketContext);

  if (!ctx) {
    throw new Error(
      [
        "ClientSocketManager: `useSocketClient` must be used within a `<SocketClientProvider>`.",
        "Please wrap your component with a `<SocketClientProvider>`.",
      ].join(" "),
    );
  }

  return ctx;
};

export default useSocketClient;
