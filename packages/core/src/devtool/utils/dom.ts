import {
  DEVTOOL_CLOSE_ICON,
  DEVTOOL_ID,
  DEVTOOL_INFO_ID,
  DEVTOOL_SOCKET_ICON,
} from "../constants.ts";

export const getPageBody = () => {
  const body = document.getElementsByTagName("body");

  if (!body[0]) {
    throw new Error("No body tag was found.");
  }

  return body[0];
};

export const appendElementToBody = (element: HTMLElement) => {
  getPageBody().appendChild(element);
};

export const appendElementToDevtool = (element: HTMLElement) => {
  const devtool = document.getElementById(DEVTOOL_ID);

  if (!devtool) {
    throw new Error("No devtool element was found");
  }

  devtool.appendChild(element);
};

export const getDevtoolElement = () => document.getElementById(DEVTOOL_ID);
export const getDevtoolInfoElement = () =>
  document.getElementById(DEVTOOL_INFO_ID);
export const getDevtoolSocketIconElement = () =>
  document.getElementById(DEVTOOL_SOCKET_ICON);
export const getDevtoolCloseIconElement = () =>
  document.getElementById(DEVTOOL_CLOSE_ICON);
