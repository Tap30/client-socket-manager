// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-console */

import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  allowEIO3: true,
  maxHttpBufferSize: 1e8,
  httpCompression: false,
  path: "/socket.io",
});

io.on("connection", socket => {
  console.log("a socket connected", socket.id);

  socket.on("message", console.log);

  setTimeout(() => {
    socket.emit("testchannel");
  }, 5000);
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
