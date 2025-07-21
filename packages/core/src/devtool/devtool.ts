import {
  closeIcon,
  DEVTOOL_BUTTON_ID,
  DEVTOOL_CHANNELS_ID,
  DEVTOOL_CLOSE_ICON_ID,
  DEVTOOL_ID,
  DEVTOOL_INFO_ID,
  DEVTOOL_LOGS_SECTION_ID,
  DEVTOOL_SOCKET_ICON_ID,
  DEVTOOL_STATUS_ID,
  DEVTOOL_WRAPPER_ID,
  LOG_CAPACITY,
  LogType,
  LogTypeColor,
  socketIcon,
  Status,
  StatusColorMap,
} from "./constants.ts";
import { FixedQueue } from "./FixedQueue.ts";
import { type DevtoolState, type Log } from "./types.ts";
import {
  generateAttributes,
  generateInlineStyle,
  makeElementDraggable,
} from "./utils.ts";

const buttonDefaultStyle = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  "-webkit-tap-highlight-color": "transparent",
};

const baseThemeStyle = {
  color: "#fff",
  background: "#000c",
  "backdrop-filter": "blur(0.25rem)",
  "box-shadow": "0 0 1.25rem 0.5rem #0005",
  "font-family": "monospace",
  "font-size": "0.75rem",
  "line-height": "2",
};

const nonAccessibleAttributes = {
  "aria-hidden": "true",
  tabindex: "-1",
};

const devtool: DevtoolState = {
  status: Status.UNKNOWN,
  channels: new Set(),
  logs: new FixedQueue(LOG_CAPACITY),
};

let active = false;
let expanded = false;

export const renderDivider = () => {
  return `<hr color="#222222" />`;
};

export const renderChipGroup = (items: string[]) => {
  const chipStyle = generateInlineStyle({
    "background-color": "#fff4",
    "border-radius": "999px",
    padding: "0 0.5rem",
    "list-style-type": "none",
    overflow: "hidden",
    "white-space": "nowrap",
    "text-overflow": "ellipsis",
    "overscroll-behavior-y": "contain",
  });

  const chipGroupStyle = generateInlineStyle({
    margin: "0.5rem 0 0",
    display: "flex",
    gap: "0.5rem",
    padding: "0",
    "flex-wrap": "wrap",
    "overflow-x": "hidden",
    "overflow-y": "auto",
    "max-height": "6rem",
  });

  return `<ul id="${DEVTOOL_CHANNELS_ID}" style="${chipGroupStyle}">${items.map(item => `<li style="${chipStyle}">${item}</li>`).join("")}</ul>`;
};

export const getDevtoolElement = () => document.getElementById(DEVTOOL_ID);
export const getDevtoolChannelsElement = () =>
  document.getElementById(DEVTOOL_CHANNELS_ID);
export const getDevtoolStatusElement = () =>
  document.getElementById(DEVTOOL_STATUS_ID);
export const getDevtoolLogSectionElement = () =>
  document.getElementById(DEVTOOL_LOGS_SECTION_ID);
export const getDevtoolWrapperElement = () =>
  document.getElementById(DEVTOOL_WRAPPER_ID);
export const getDevtoolInfoElement = () =>
  document.getElementById(DEVTOOL_INFO_ID);
export const getDevtoolIconElement = () =>
  document.getElementById(DEVTOOL_BUTTON_ID);
export const getDevtoolSocketIconElement = () =>
  document.getElementById(DEVTOOL_SOCKET_ICON_ID);
export const getDevtoolCloseIconElement = () =>
  document.getElementById(DEVTOOL_CLOSE_ICON_ID);

export const renderChannels = () => {
  const { channels } = devtool;

  if (channels.size === 0) return "";
  return `
    ${renderDivider()}
    <code>Channels:</code>
    ${renderChipGroup(Array.from(devtool.channels))}
  `;
};

export const renderStatus = () => {
  const { status } = devtool;

  const color = StatusColorMap[status];

  const dotStyle = generateInlineStyle({
    display: "inline-flex",
    width: "0.5rem",
    height: "0.5rem",
    "border-radius": "50%",
    "background-color": color,
    "box-shadow": `0 0 1.25rem 0.125rem ${color}`,
  });

  return `<code>Status: <span id="${DEVTOOL_STATUS_ID}">${status}</span> <span style="${dotStyle}"></span></code>`;
};

export const renderLog = (log: Log) => {
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
  <div class="${DEVTOOL_LOGS_SECTION_ID}-item">
    <p style="${timeStyle}">${log.date.toISOString()}</p>
    <p style="${titleStyle}">${log.type}</p>
    <p style="${detailStyle}">${log.detail}</p>
  </div>
  `;
};

export const renderLogs = () => {
  if (devtool.logs.length === 0) return "";

  const attributes = generateAttributes({
    id: DEVTOOL_LOGS_SECTION_ID,
    style: generateInlineStyle({
      "max-height": "20rem",
      overflow: "scroll",
      "overscroll-behavior-y": "contain",
    }),
  });

  return `
  ${renderDivider()}
  <div ${attributes}>${devtool.logs.values.map(renderLog).join("")}</div>
  `;
};

export const renderDevtoolIconButton = () => {
  const attributes = generateAttributes({
    id: DEVTOOL_BUTTON_ID,
    "data-testid": DEVTOOL_BUTTON_ID,
    ...nonAccessibleAttributes,
    style: generateInlineStyle({
      ...buttonDefaultStyle,
      ...baseThemeStyle,
      width: "3rem",
      height: "3rem",
      display: "flex",
      "justify-content": "center",
      "align-items": "center",
      position: "relative",
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

export const renderDevtoolInfo = () => {
  const attributes = generateAttributes({
    id: DEVTOOL_INFO_ID,
    "data-open": "true",
    "data-testid": DEVTOOL_INFO_ID,
    ...nonAccessibleAttributes,
    style: generateInlineStyle({
      ...baseThemeStyle,
      padding: "1rem",
      position: "absolute",
      background: "#000c",
      "border-radius": "0.25rem 1rem 1rem 1rem",
      top: "0",
      left: "3.5rem",
      opacity: "0",
      transform: "scale(0)",
      "transform-origin": "0 0",
      transition: "opacity 0.2s, transform 0.2s",
      width: "14rem",
    }),
  });

  return `<div ${attributes}></div>`;
};

export const renderDevtool = () => {
  const attributes = generateAttributes({
    id: DEVTOOL_ID,
    "data-testid": DEVTOOL_ID,
    ...nonAccessibleAttributes,
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

export const updateInfoSection = () => {
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

const init = () => {
  if (active) return;

  active = true;

  const devtoolWrapper = document.createElement("div");

  devtoolWrapper.style.position = "fixed";
  devtoolWrapper.style.top = "8px";
  devtoolWrapper.style.left = "8px";
  // initial z-index. can be override in render function.
  devtoolWrapper.style.zIndex = "99999";

  devtoolWrapper.id = DEVTOOL_WRAPPER_ID;
  devtoolWrapper.innerHTML = renderDevtool();

  document.body.appendChild(devtoolWrapper);

  const iconButton = getDevtoolIconElement();

  if (iconButton) {
    iconButton.addEventListener("click", toggle);
    makeElementDraggable(iconButton, devtoolWrapper);
  }

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
};

export const dispose = () => {
  getDevtoolWrapperElement()?.remove();

  active = false;
  expanded = false;
};

const toggle = () => {
  const socketIcon = getDevtoolSocketIconElement()!;
  const closeIcon = getDevtoolCloseIconElement()!;
  const info = getDevtoolInfoElement()!;

  expanded = !expanded;
  socketIcon.style.opacity = !expanded ? "1" : "0";
  closeIcon.style.opacity = expanded ? "1" : "0";
  info.style.opacity = expanded ? "1" : "0";
  info.style.transform = `scale(${expanded ? "1" : "0"})`;
  getDevtoolInfoElement()?.setAttribute(
    "data-open",
    expanded ? "true" : "false",
  );
};

type RenderOptions = {
  action?: (s: typeof devtool) => void;
  force?: boolean;
  zIndex?: number;
};

export const render = (options?: RenderOptions) => {
  const { action, force = false, zIndex } = options ?? {};

  if (force) {
    init();
  } else {
    if (!active) return;

    const devtoolElement = getDevtoolElement();

    if (!devtoolElement) init();
  }

  if (zIndex !== undefined) {
    getDevtoolWrapperElement()!.style.zIndex = zIndex.toString();
  }

  action?.(devtool);
  updateInfoSection();
};

export { LogType, Status };
