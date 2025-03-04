import * as React from "react";
import { SocketContext } from "./Context.ts";
import type { SocketClientHookReturnType } from "./types.ts";

const useSocketClient = (): SocketClientHookReturnType => {
  const ctx = React.useContext(SocketContext);

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
