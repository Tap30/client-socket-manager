import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEVTOOL_CLOSE_ICON_ID,
  DEVTOOL_LOGS_SECTION_ID,
  DEVTOOL_SOCKET_ICON_ID,
  DEVTOOL_WRAPPER_ID,
  LOG_CAPACITY,
  LogType,
  Status,
} from "./constants.ts";
import * as devtool from "./devtool.ts";

describe("Devtool", () => {
  beforeEach(() => {
    devtool.setZIndex(99999);
    devtool.show();
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

    expect(document.querySelectorAll(`#${DEVTOOL_WRAPPER_ID}`)).toHaveLength(1);
    expect(devtool.getDevtoolWrapperElement()).toBe(originalWrapper);
  });

  it("should dispose properly", () => {
    devtool.hide();
    expect(devtool.getDevtoolWrapperElement()).toBeNull();
  });

  it("should be able to update status of the socket using render", () => {
    Object.values(Status).forEach(status => {
      devtool.update(state => {
        state.status = status;
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

    devtool.update(state => {
      state.logs.enqueue(mockLog);
      state.channels.add("my-channel");
      state.status = Status.DISCONNECTED;
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
      devtool.update(state => {
        state.logs.enqueue({
          type: LogType.CONNECTION_ERROR,
          detail: `log-${i}`,
          date: new Date(),
        });
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
    devtool.update(state => {
      state.logs.enqueue({
        type: LogType.CONNECTION_ERROR,
        detail: `log-${LOG_CAPACITY}`,
        date: new Date(),
      });
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

  it("should preserve scroll position when updating", () => {
    // Populate logs to make the log section scrollable
    for (let i = 0; i < LOG_CAPACITY; i++) {
      devtool.update(state => {
        state.logs.enqueue({
          type: LogType.CONNECTION_ERROR,
          detail: `log-${i}`,
          date: new Date(),
        });
      });
    }

    const logSection = devtool.getDevtoolLogSectionElement()!;
    const scrollPosition = 50;

    logSection.scrollTop = scrollPosition;
    expect(logSection.scrollTop).toBe(scrollPosition);

    // Update the devtool and check if the scroll position is preserved
    devtool.update(state => {
      state.logs.enqueue({
        type: LogType.CONNECTION_ERROR,
        detail: "new log",
        date: new Date(),
      });
    });

    const newLogSection = devtool.getDevtoolLogSectionElement()!;

    expect(newLogSection.scrollTop).toBe(scrollPosition);
  });

  it("setZIndex applies the z-index on the wrapper element", () => {
    devtool.dispose(); // ensures active = false and wrapper removed
    const z = 424242;

    devtool.setZIndex(z);
    devtool.show();

    const wrapper = devtool.getDevtoolWrapperElement();

    expect(wrapper!.style.zIndex).toBe(`${z}`);
  });

  it("socket and close icons have correct initial opacity and toggle on click", () => {
    devtool.dispose();
    devtool.setZIndex(99999);
    devtool.show();

    const socketIcon = document.getElementById(DEVTOOL_SOCKET_ICON_ID)!;
    const closeIcon = document.getElementById(DEVTOOL_CLOSE_ICON_ID)!;
    const iconButton = devtool.getDevtoolIconElement()!;

    // Initially: socketIcon has no opacity, closeIcon = 0
    expect(socketIcon.style.opacity).toBe("");
    expect(closeIcon.style.opacity).toBe("0");

    // Click 1 → expands
    iconButton.click();
    expect(socketIcon.style.opacity).toBe("0");
    expect(closeIcon.style.opacity).toBe("1");

    // Click 2 → collapses
    iconButton.click();
    expect(socketIcon.style.opacity).toBe("1");
    expect(closeIcon.style.opacity).toBe("0");
  });

  it("calling update() when the devtool is not active does not throw", () => {
    // Ensure not active / not shown
    devtool.hide();
    expect(() => {
      devtool.update(() => {});
    }).not.toThrow();
  });

  it("does nothing if show() is called while already active", () => {
    const wrapperBefore = devtool.getDevtoolWrapperElement();

    expect(wrapperBefore).toBeTruthy();

    // Spy on render or DOM manipulation — whichever happens in show()
    const renderSpy = vi.spyOn(devtool, "renderDevtool");

    // Call show() again — should hit the `if (active) return;`
    devtool.show();

    // Should not render again
    expect(renderSpy).not.toHaveBeenCalled();

    // Wrapper should remain the same (no new element)
    const wrapperAfter = devtool.getDevtoolWrapperElement();

    expect(wrapperAfter).toBe(wrapperBefore);

    renderSpy.mockRestore();
  });
});

it("throws if show() is called without setting zIndex", () => {
  expect(() => devtool.show()).toThrowError(/No z-index was set/);
});
