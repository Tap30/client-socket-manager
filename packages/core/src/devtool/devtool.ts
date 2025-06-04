import {
  closeIcon,
  DEVTOOL_BUTTON_ID,
  DEVTOOL_CLOSE_ICON_ID,
  DEVTOOL_ID,
  DEVTOOL_INFO_ID,
  DEVTOOL_SOCKET_ICON_ID,
  LOG_CAPACITY,
  LogType,
  LogTypeColor,
  socketIcon,
  Status,
  StatusColor,
} from "./constants.ts";
import { FixedQueue } from "./FixedQueue.ts";
import { state } from "./states.ts";
import { type DevtoolState, type Log } from "./types.ts";
import {
  appendElementToBody,
  buttonDefaultStyle,
  generateAttributes,
  generateInlineStyle,
  getDevtoolCloseIconElement,
  getDevtoolElement,
  getDevtoolIconElement,
  getDevtoolInfoElement,
  getDevtoolSocketIconElement,
  makeElementDraggable,
} from "./utils.ts";

export { LogType };

const devtool: DevtoolState = {
  status: Status.UNKNOWN,
  channels: new Set(),
  logs: new FixedQueue(LOG_CAPACITY),
};

const renderDivider = () => {
  return `<hr color="#222222">`;
};

const renderChipGroup = (items: string[]) => {
  const chipStyle = generateInlineStyle({
    "background-color": "#fff4",
    "border-radius": "999px",
    padding: "0 0.5rem",
    "list-style-type": "none",
  });

  const chipGroupStyle = generateInlineStyle({
    margin: "0.5rem 0 0",
    display: "flex",
    gap: "0.5rem",
    padding: "0",
    "flex-wrap": "wrap",
  });

  return `<ul style="${chipGroupStyle}">${items.map(item => `<li style="${chipStyle}">${item}</li>`).join("")}</ul>`;
};

const renderChannels = () => {
  const { channels } = devtool;

  if (channels.size === 0) return "";
  return `
    ${renderDivider()}
    <code>Channels:</code>
    ${renderChipGroup(Array.from(devtool.channels))}
  `;
};

const renderStatus = () => {
  const { status } = devtool;

  const color = StatusColor[status];

  const dotStyle = generateInlineStyle({
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
  const titleStyle = generateInlineStyle({
    color: LogTypeColor[log.type],
    margin: "0",
  });

  const detailStyle = generateInlineStyle({
    "font-size": "0.625rem",
    "margin-top": "0",
    color: LogTypeColor[log.type],
  });

  const timeStyle = generateInlineStyle({
    "margin-bottom": "0",
    "font-size": "0.625rem",
    color: "#777",
  });

  return `
    <div>
      <p style="${timeStyle}">${log.date.toISOString()}</p>
      <p style="${titleStyle}">${log.type}</p>
      <p style="${detailStyle}">${log.detail}</p>
    </div>
  `;
};

const renderLogs = () => {
  if (devtool.logs.length === 0) return "";

  const logsContainerStyle = generateInlineStyle({
    "max-height": "20rem",
    overflow: "scroll",
  });

  return `
  ${renderDivider()}
  <div style="${logsContainerStyle}">${devtool.logs.values.map(renderLog).join("")}</div>
  `;
};

const renderDevtoolIconButton = () => {
  const attributes = generateAttributes({
    id: DEVTOOL_BUTTON_ID,
    style: generateInlineStyle({
      ...buttonDefaultStyle,
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
    }),
  });

  return `
    <button ${attributes}>
      ${socketIcon}
      ${closeIcon}
    </button>
  `;
};

const renderDevtoolInfo = () => {
  const attributes = generateAttributes({
    id: DEVTOOL_INFO_ID,
    style: generateInlineStyle({
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
    }),
  });

  return `<div ${attributes}></div>`;
};

const renderDevtool = () => {
  const attributes = generateAttributes({
    id: DEVTOOL_ID,
    "aria-hidden": "true",
    style: generateInlineStyle({
      position: "relative",
      "box-sizing": "border-box",
    }),
  });

  return `
    <div ${attributes}>
      ${renderDevtoolIconButton()}
      ${renderDevtoolInfo()}
    </div>
  `;
};

const updateInfoSection = () => {
  const infoSection = getDevtoolInfoElement()!;

  const devtoolInfoStyle = generateInlineStyle({
    background: "#000c",
    padding: "1rem",
    "margin-top": "0.5rem",
    "border-radius": "0.5rem",
  });

  const headerStyle = generateInlineStyle({
    display: "flex",
    "align-items": "center",
  });

  infoSection.innerHTML = `
    <header style="${headerStyle}">
      <b>Client Socket Manager</b>
    </header>
    <div style="${devtoolInfoStyle}">
      ${renderStatus()}
      ${renderChannels()}
      ${renderLogs()} 
    </div>
  `;

  return infoSection;
};

export const init = () => {
  state.active = true;

  const devtoolWrapper = document.createElement("div");

  devtoolWrapper.style.position = "fixed";
  devtoolWrapper.innerHTML = renderDevtool();

  appendElementToBody(devtoolWrapper);
  makeElementDraggable(getDevtoolElement()!);

  getDevtoolIconElement()!.addEventListener("click", toggle);
  [DEVTOOL_CLOSE_ICON_ID, DEVTOOL_SOCKET_ICON_ID].forEach(icon => {
    const buttonIcon = document.getElementById(icon);

    if (buttonIcon) {
      buttonIcon.style.position = "absolute";
      buttonIcon.style.top = "50%";
      buttonIcon.style.left = "50%";
      buttonIcon.style.transform = "translate(-50%, -50%)";
      buttonIcon.style.transition = "opacity 0.2s";

      if (icon === DEVTOOL_CLOSE_ICON_ID) {
        buttonIcon.style.opacity = "0";
      }
    }
  });

  updateUi();
};

const updateUi = () => {
  const devtoolElement = getDevtoolElement();

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
