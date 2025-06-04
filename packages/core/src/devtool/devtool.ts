import {
  closeIcon,
  Colors,
  DEVTOOL_CLOSE_ICON,
  DEVTOOL_ICON_ID,
  DEVTOOL_ID,
  DEVTOOL_INFO_ID,
  DEVTOOL_SOCKET_ICON,
  LOG_CAPACITY,
  LogTypeColors,
  LogTypes,
  socketIcon,
} from "./constants.ts";
import { FixedQueue } from "./FixedQueue.ts";
import { state } from "./states.ts";
import { type DevtoolState, type Log } from "./types.ts";
import {
  appendElementToBody,
  appendElementToDevtool,
  getDevtoolCloseIconElement,
  getDevtoolElement,
  getDevtoolInfoElement,
  getDevtoolSocketIconElement,
} from "./utils/dom.ts";
import {
  buttonDefaultStyles,
  getInlineStyle,
  makeElementDraggable,
} from "./utils/style.ts";

export { LogTypes };

const devtool: DevtoolState = {
  status: "unknown",
  channels: new Set(),
  logs: new FixedQueue(LOG_CAPACITY),
};

const renderDivider = () => {
  return `<hr color="#222222">`;
};

const renderChipGroup = (items: string[]) => {
  const chipStyles = getInlineStyle({
    "background-color": "#fff4",
    "border-radius": "999px",
    padding: "0 0.5rem",
    "list-style-type": "none",
  });

  const chipGroupStyle = getInlineStyle({
    margin: "0.5rem 0 0",
    display: "flex",
    gap: "0.5rem",
    padding: "0",
    "flex-wrap": "wrap",
  });

  return `<ul style="${chipGroupStyle}">${items.map(item => `<li style="${chipStyles}">${item}</li>`).join("")}</ul>`;
};

const renderChannels = () => {
  const { channels } = devtool;

  if (channels.size === 0) return "";
  return `
  ${renderDivider()}<code>Channels:</code>${renderChipGroup(Array.from(devtool.channels))}`;
};

const renderStatus = () => {
  const { status } = devtool;
  let color: string = Colors.GREY;

  if (status === "connected") {
    color = Colors.GREEN;
  } else if (status === "disconnected") {
    color = Colors.RED;
  } else if (status === "reconnecting") {
    color = Colors.YELLOW;
  }

  const dotStyle = getInlineStyle({
    display: "inline-flex",
    width: "0.5rem",
    height: "0.5rem",
    "border-radius": "50%",
    "background-color": color,
    "box-shadow": `0 0 20px 2px ${color}`,
  });

  return `<code>Status: ${status} <span style="${dotStyle}"></span></code>`;
};

const renderLog = (log: Log) => {
  const titleStyle = getInlineStyle({
    color: LogTypeColors[log.type],
    margin: "0",
  });

  const detailStyle = getInlineStyle({
    "font-size": "0.625rem",
    "margin-top": "0",
    color: LogTypeColors[log.type],
  });

  const timeStyle = getInlineStyle({
    "margin-bottom": "0",
    "font-size": "0.625rem",
    color: "#777",
  });

  return `
  <div>
    <p style="${timeStyle}">${log.date.toISOString()}</p>
    <p style="${titleStyle}">${log.type}</p>
    <p style="${detailStyle}">${log.detail}</p>
  </details>`;
};

const renderLogs = () => {
  if (devtool.logs.length === 0) return "";

  const logsContainerStyle = getInlineStyle({
    "max-height": "20rem",
    overflow: "scroll",
  });

  return `
  ${renderDivider()}
  <div style="${logsContainerStyle}">${devtool.logs.values.map(renderLog).join("")}</div>
  `;
};

const initIconButtonSection = () => {
  const iconButtonElement = document.createElement("button");

  const expandElementsButtonStyle = getInlineStyle({
    ...buttonDefaultStyles,
    width: "3rem",
    height: "3rem",
    color: "#fff",
    display: "flex",
    "justify-content": "center",
    "align-items": "center",
    background: "#000c",
    "backdrop-filter": "blur(4px)",
    "box-shadow": "0 0 20px 8px #0005",
    position: "relative",
    "font-family": "monospace",
    "font-size": "0.75rem",
    "line-height": "2",
    "border-radius": "1.5rem",
  });

  iconButtonElement.id = DEVTOOL_ICON_ID;
  iconButtonElement.style = expandElementsButtonStyle;

  iconButtonElement.innerHTML = [socketIcon, closeIcon].join("");

  iconButtonElement.addEventListener("click", toggle);

  appendElementToDevtool(iconButtonElement);

  [DEVTOOL_CLOSE_ICON, DEVTOOL_SOCKET_ICON].forEach(iconId => {
    const buttonIcon = document.getElementById(iconId);

    if (buttonIcon)
      buttonIcon.style = getInlineStyle({
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        transition: "opacity 0.2s",
        ...(iconId === DEVTOOL_CLOSE_ICON && { opacity: "0" }),
      });
  });
};

const initInfoSection = () => {
  const infoSection = document.createElement("div");

  infoSection.id = DEVTOOL_INFO_ID;

  infoSection.style = getInlineStyle({
    padding: "1rem",
    position: "absolute",
    background: "#000c",
    "backdrop-filter": "blur(4px)",
    "box-shadow": "0 0 20px 8px #0005",
    color: "#fff",
    "font-family": "monospace",
    "font-size": "0.75rem",
    "line-height": "2",
    "border-radius": "0.25rem 1rem 1rem 1rem",
    top: "0",
    left: "3.5rem",
    opacity: "0",
    transform: "scale(0)",
    "transform-origin": "0 0",
    transition: "opacity 0.2s, transform 0.2s",
    width: "12rem",
  });

  appendElementToDevtool(infoSection);
};

const updateInfoSection = () => {
  const infoSection = getDevtoolInfoElement()!;

  const devtoolInfoStyles = getInlineStyle({
    background: "#000c",
    padding: "1rem",
    "margin-top": "0.5rem",
    "border-radius": "0.5rem",
  });

  const headerStyle = getInlineStyle({
    display: "flex",

    "align-items": "center",
  });

  infoSection.innerHTML = `
    <header style="${headerStyle}">

    <b>Client Socket Manager</b>
    </header>
    <div style="${devtoolInfoStyles}">
    ${renderStatus()}
    ${renderChannels()}
    ${renderLogs()} 
    </div>
    `;

  return infoSection;
};

export const init = () => {
  state.active = true;

  const devtoolElement = document.createElement("div");

  devtoolElement.id = DEVTOOL_ID;
  devtoolElement.ariaHidden = "true";

  const devtoolStyle = getInlineStyle({
    position: "relative",

    "box-sizing": "border-box",
  });

  devtoolElement.style = devtoolStyle;

  const devtoolWrapper = document.createElement("div");

  devtoolWrapper.style.position = "fixed";
  devtoolWrapper.appendChild(devtoolElement);

  appendElementToBody(devtoolWrapper);
  makeElementDraggable(devtoolElement);

  initIconButtonSection();
  initInfoSection();

  updateUi();
};

const updateUi = () => {
  const devtoolElement = getDevtoolElement() as HTMLElement;

  if (!devtoolElement) {
    init();
  }

  updateInfoSection();
};

const toggle = () => {
  const socketIcon = getDevtoolSocketIconElement()!;
  const closeIcon = getDevtoolCloseIconElement()!;
  const info = getDevtoolInfoElement()!;

  state.expanded = !state.expanded;
  socketIcon.style.opacity = !state.expanded ? "1" : "0";
  closeIcon.style.opacity = state.expanded ? "1" : "0";
  info.style.opacity = state.expanded ? "1" : "0";
  info.style.transform = `scale(${state.expanded ? "1" : "0"})`;
};

export const render = (cb: (s: typeof devtool) => void) => {
  if (!state.active) return;

  cb(devtool);
  updateUi();
};
