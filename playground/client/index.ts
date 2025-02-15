// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-console */

import { ClientSocketManager } from "../../src/index.ts";

const socketManager = new ClientSocketManager("http://localhost:3000", {
  eventHandlers: {
    onReconnectingError(err) {
      console.log("reconnecting error", err);
    },
    onReconnectionFailure() {
      console.log("reconnection failure");
    },
    onServerPing() {
      console.log("server ping");
    },
    onConnectionError(err) {
      console.log("connection error", err);
    },
    onAnySubscribedMessageReceived(channel, received) {
      console.log("message received on:", channel, received);
    },
    onHiddenPage() {
      console.log("socket is in background");
    },
    onVisiblePage() {
      console.log("socket is in foreground");
    },
    onReconnecting(attempt) {
      console.log("reconnecting...", attempt);
    },
    onSocketDisconnection(reason, details) {
      console.log("socket disconnected", reason, details);
    },
    onSocketConnection() {
      console.log("successfully connected");
    },
    onSocketConnectionError(err) {
      console.log("socket connection error", err);
    },
    onSuccessfulReconnection(attempt) {
      console.log("socket successfully reconnected", attempt);
    },
  },
});

const createButton = (text: string) => {
  const button = document.createElement("button");
  const buttonText = document.createTextNode(text);

  button.appendChild(buttonText);

  return button;
};

const createDisconnectBtn = () => {
  const button = createButton("disconnect");

  button.addEventListener("click", () => {
    socketManager.disconnect();
  });

  document.body.append(button);

  return button;
};

const createReconnectBtn = () => {
  const button = createButton("reconnect");

  button.addEventListener("click", () => {
    socketManager.connect();
  });

  document.body.append(button);

  return button;
};

const createDisposeBtn = () => {
  const button = createButton("dispose");

  button.addEventListener("click", () => {
    socketManager.dispose();
  });

  document.body.append(button);

  return button;
};

const createSendMessageBtn = () => {
  const button = createButton("send message");

  button.addEventListener("click", () => {
    socketManager.emit("message", "Hello from the client!");
  });

  document.body.append(button);

  return button;
};

createDisconnectBtn();
createReconnectBtn();
createDisposeBtn();
createSendMessageBtn();
