export const SocketReservedEvents = {
  CONNECTION: "connect",
  CONNECTION_ERROR: "connect_error",
  DISCONNECTION: "disconnect",
} as const;

export const ManagerReservedEvents = {
  SERVER_PING: "ping",
  CONNECTION_ERROR: "error",
  RECONNECTING: "reconnect_attempt",
  RECONNECTING_ERROR: "reconnect_error",
  RECONNECTION_FAILURE: "reconnect_failed",
  SUCCESSFUL_RECONNECTION: "reconnect",
} as const;
