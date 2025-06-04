import { type LogTypes } from "./constants.ts";
import { type FixedQueue } from "./FixedQueue.ts";

export type Log = {
  type: (typeof LogTypes)[keyof typeof LogTypes];
  detail: string;
  date: Date;
};

export type DevtoolState = {
  status: "reconnecting" | "connected" | "disconnected" | "unknown";
  channels: Set<string>;
  logs: FixedQueue<Log>;
};
