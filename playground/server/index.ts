// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-console */
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();
// eslint-disable-next-line @typescript-eslint/no-misused-promises
const server = createServer(app);
const io = new Server(server, {
  allowEIO3: true,
  maxHttpBufferSize: 1e8,
  httpCompression: false,
  path: "/socket.io",
});

io.on("connection", socket => {
  console.log("a socket connected", socket);
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
