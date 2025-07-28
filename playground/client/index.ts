// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-console */

import { ClientSocketManager } from "@tapsioss/client-socket-manager";

const socketManager = new ClientSocketManager("http://localhost:3000", {
  devtool: {
    enabled: false,
    zIndex: 2000,
  },
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

const createSubBtn = () => {
  const button = createButton("sub");

  const subcb = () => {
    console.log("from testchannel");
  };

  button.addEventListener("click", () => {
    socketManager.subscribe("testchannel", subcb);
  });

  document.body.append(button);

  return button;
};

const createUnsubBtn = () => {
  const button = createButton("unsub");

  button.addEventListener("click", () => {
    socketManager.unsubscribe("testchannel");
  });

  document.body.append(button);

  return button;
};

const createShowDevtoolBtn = () => {
  const button = createButton("show devtool");

  button.addEventListener("click", () => {
    socketManager.showDevtool();
  });

  document.body.append(button);

  return button;
};

const createHideDevtoolBtn = () => {
  const button = createButton("hide devtool");

  button.addEventListener("click", () => {
    socketManager.hideDevtool();
  });

  document.body.append(button);

  return button;
};

createDisconnectBtn();
createReconnectBtn();
createDisposeBtn();
createSendMessageBtn();
createSubBtn();
createUnsubBtn();
createShowDevtoolBtn();
createHideDevtoolBtn();
