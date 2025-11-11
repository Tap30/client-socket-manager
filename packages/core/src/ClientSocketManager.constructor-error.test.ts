import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClientSocketManager } from "./index.ts";

vi.mock("socket.io-client", () => ({
  io: () => {
    throw new Error("Connection failed");
  },
}));

describe("ClientSocketManager: constructor error handling", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should handle constructor error and log to console", () => {
    const socketManager = new ClientSocketManager("http://localhost:3000", {});

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to initialize socket connection",
      expect.objectContaining({
        uri: "http://localhost:3000",
        path: "/socket.io",
        err: expect.any(Error) as unknown,
      }),
    );

    expect(socketManager).toBeDefined();
  });
});
