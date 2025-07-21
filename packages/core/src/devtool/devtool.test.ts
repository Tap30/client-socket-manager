import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DEVTOOL_LOGS_SECTION_ID,
  DEVTOOL_WRAPPER_ID,
  LOG_CAPACITY,
  LogType,
  Status,
} from "./constants.ts";
import * as devtool from "./devtool.ts";

describe("Devtool", () => {
  beforeEach(() => {
    devtool.setZIndex(99999);
    devtool.render({
      force: true,
      action: s => {
        s.channels.clear();
        s.status = devtool.Status.UNKNOWN;
        s.logs.clear();
      },
    });
  });

  afterEach(() => {
    devtool.dispose();
  });

  it("should init and append devtool wrapper to DOM", () => {
    const wrapper = devtool.getDevtoolWrapperElement();

    expect(wrapper).toBeTruthy();
    expect(devtool.getDevtoolElement()).toBeTruthy();
    expect(wrapper!.id).toBe(DEVTOOL_WRAPPER_ID);
  });

  it("should not double-init", () => {
    const originalWrapper = devtool.getDevtoolWrapperElement();

    devtool.render(); // re-init should do nothing
    expect(document.querySelectorAll(`#${DEVTOOL_WRAPPER_ID}`)).toHaveLength(1);
    expect(devtool.getDevtoolWrapperElement()).toBe(originalWrapper);
  });

  it("should dispose properly", () => {
    devtool.dispose();
    expect(devtool.getDevtoolWrapperElement()).toBeNull();
  });

  it("should be able to update status of the socket using render", () => {
    Object.values(Status).forEach(status => {
      devtool.render({
        action: state => {
          state.status = status;
        },
      });

      expect(devtool.getDevtoolInfoElement()!.innerHTML).toContain(status);
    });
  });

  it("should update DOM when render is called", () => {
    const mockLog = {
      type: LogType.CONNECTION_ERROR,
      detail: "Test error",
      date: new Date(),
    };

    devtool.render({
      action: state => {
        state.logs.enqueue(mockLog);
        state.channels.add("my-channel");
        state.status = Status.DISCONNECTED;
      },
    });

    const info = devtool.getDevtoolInfoElement();

    expect(info?.innerHTML).toContain("Test error");
    expect(info?.innerHTML).toContain("my-channel");
    expect(info?.innerHTML).toContain(Status.DISCONNECTED);
  });

  it("should toggle visibility on icon click", () => {
    const icon = devtool.getDevtoolIconElement()!;

    const info = devtool.getDevtoolInfoElement()!;

    expect(info.getAttribute("data-open")).toBe("true");

    icon.click();
    expect(info.getAttribute("data-open")).toBe("true");
  });

  it("should queue logs with a maximum capacity", () => {
    // No section should be appear at first
    expect(devtool.getDevtoolLogSectionElement()).toBeNull();

    // Fill the logs
    for (let i = 0; i < LOG_CAPACITY; i++) {
      devtool.render({
        action: state => {
          state.logs.enqueue({
            type: LogType.CONNECTION_ERROR,
            detail: `log-${i}`,
            date: new Date(),
          });
        },
      });
    }

    expect(devtool.getDevtoolLogSectionElement()).not.toBeNull();
    expect(
      document.querySelectorAll(`.${DEVTOOL_LOGS_SECTION_ID}-item`),
    ).toHaveLength(LOG_CAPACITY);

    // When the log section is full, new will enqeue in log section and the first log will be removed
    // before adding new item to the log queue, the first log is in the log section.
    expect(devtool.getDevtoolLogSectionElement()!.innerHTML).toContain(`log-0`);

    // after adding new log, the first element will not be available and the new log will append to the queue.
    devtool.render({
      action: state => {
        state.logs.enqueue({
          type: LogType.CONNECTION_ERROR,
          detail: `log-${LOG_CAPACITY}`,
          date: new Date(),
        });
      },
    });

    expect(devtool.getDevtoolLogSectionElement()!.innerHTML).not.toContain(
      `log-0`,
    );
    expect(devtool.getDevtoolLogSectionElement()!.innerHTML).toContain(
      `log-${LOG_CAPACITY}`,
    );

    expect(
      document.querySelectorAll(`.${DEVTOOL_LOGS_SECTION_ID}-item`),
    ).toHaveLength(LOG_CAPACITY);
  });
});
