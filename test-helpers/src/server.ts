import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const httpServer = createServer(app);
const socketServer = new Server(httpServer, {
  cors: { origin: "*" },
  allowEIO3: true,
  maxHttpBufferSize: 1e8,
  httpCompression: false,
  path: "/socket.io",
});

export { httpServer, socketServer };
