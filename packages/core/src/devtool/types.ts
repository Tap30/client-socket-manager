import { type LogType, type Status } from "./constants.ts";
import { type FixedQueue } from "./FixedQueue.ts";

export type Log = {
  type: (typeof LogType)[keyof typeof LogType];
  detail: string;
  date: Date;
};

export type DevtoolState = {
  status: (typeof Status)[keyof typeof Status];
  channels: Set<string>;
  logs: FixedQueue<Log>;
};
