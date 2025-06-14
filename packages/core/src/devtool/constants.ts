export const LOG_CAPACITY = 20;
export const DEVTOOL_ID = "tapsi-socket-client-devtool";
export const DEVTOOL_WRAPPER_ID = "tapsi-socket-client-devtool-wrapper";
export const DEVTOOL_BUTTON_ID = `${DEVTOOL_ID}-button`;
export const DEVTOOL_INFO_ID = `${DEVTOOL_ID}-info`;
export const DEVTOOL_STATUS_ID = `${DEVTOOL_INFO_ID}-status`;
export const DEVTOOL_CHANNELS_ID = `${DEVTOOL_INFO_ID}-channels`;
export const DEVTOOL_LOGS_SECTION_ID = `${DEVTOOL_INFO_ID}-logs`;
export const DEVTOOL_SOCKET_ICON_ID = `${DEVTOOL_BUTTON_ID}-socket`;
export const DEVTOOL_CLOSE_ICON_ID = `${DEVTOOL_BUTTON_ID}-close`;

export const StatusColor = {
  GREEN: "#3fb950",
  RED: "#f85149",
  YELLOW: "#d29922",
  GREY: "#656c7699",
} as const;

export const Status = {
  RECONNECTING: "RECONNECTING",
  CONNECTED: "CONNECTED",
  DISCONNECTED: "DISCONNECTED",
  UNKNOWN: "UNKNOWN",
} as const;

export const StatusColorMap: Record<
  (typeof Status)[keyof typeof Status],
  (typeof StatusColor)[keyof typeof StatusColor]
> = {
  RECONNECTING: StatusColor.YELLOW,
  CONNECTED: StatusColor.GREEN,
  DISCONNECTED: StatusColor.RED,
  UNKNOWN: StatusColor.GREY,
} as const;

export const LogType = {
  SUCCESSFUL_RECONNECTION: "SUCCESSFUL_RECONNECTION",
  RECONNECTION_FAILURE: "RECONNECTION_FAILURE",
  RECONNECTING: "RECONNECTING",
  CONNECTION_ERROR: "CONNECTION_ERROR",
  RECONNECTING_ERROR: "RECONNECTING_ERROR",
  SUBSCRIBED: "SUBSCRIBED",
  UNSUBSCRIBED: "UNSUBSCRIBED",
  CONNECTED: "CONNECTED",
  DISCONNECTED: "DISCONNECTED",
} as const;

export const LogTypeColor: Record<
  (typeof LogType)[keyof typeof LogType],
  (typeof StatusColorMap)[keyof typeof StatusColorMap]
> = {
  SUCCESSFUL_RECONNECTION: StatusColor.GREEN,
  SUBSCRIBED: StatusColor.GREEN,
  RECONNECTION_FAILURE: StatusColor.RED,
  RECONNECTING: StatusColor.YELLOW,
  CONNECTION_ERROR: StatusColor.RED,
  RECONNECTING_ERROR: StatusColor.RED,
  UNSUBSCRIBED: StatusColor.RED,
  CONNECTED: StatusColor.GREEN,
  DISCONNECTED: StatusColor.RED,
} as const;

export const socketIcon = `
<svg id="${DEVTOOL_SOCKET_ICON_ID}" width="1rem" height="1rem" viewBox="0 -31.5 256 256" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<path d="M192.440223,144.644612 L224.220111,144.644612 L224.220111,68.3393384 L188.415329,32.5345562 L165.943007,55.0068785 L192.440223,81.5040943 L192.440223,144.644612 L192.440223,144.644612 Z M224.303963,160.576482 L178.017688,160.576482 L113.451687,160.576482 L86.954471,134.079266 L98.1906322,122.843105 L120.075991,144.728464 L165.104487,144.728464 L120.746806,100.286931 L132.06682,88.9669178 L176.4245,133.324599 L176.4245,88.2961022 L154.622994,66.4945955 L165.775303,55.3422863 L110.684573,0 L56.3485097,0 L56.3485097,0 L0,0 L31.6960367,31.6960367 L31.6960367,31.7798886 L31.8637406,31.7798886 L97.4359646,31.7798886 L120.662954,55.0068785 L86.7029152,88.9669178 L63.4759253,65.7399279 L63.4759253,47.7117589 L31.6960367,47.7117589 L31.6960367,78.9046839 L86.7029152,133.911562 L64.3144448,156.300033 L100.119227,192.104815 L154.45529,192.104815 L256,192.104815 L256,192.104815 L224.303963,160.576482 L224.303963,160.576482 Z" fill="currentcolor">
</path>
</svg>
`;

export const closeIcon = `
<svg id="${DEVTOOL_CLOSE_ICON_ID}" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z" fill="currentcolor"/>
</svg>
`;
