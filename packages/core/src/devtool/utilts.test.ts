import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatDate,
  generateAttributes,
  generateInlineStyle,
  getClientX,
  getClientY,
  makeElementDraggable,
  resetDragState,
} from "./utils.ts";

beforeEach(() => {
  resetDragState();
});

describe("generateInlineStyle", () => {
  it("should convert a CSS object to inline style string", () => {
    const css = { color: "red", margin: "10px" };

    expect(generateInlineStyle(css)).toBe("color: red; margin: 10px");
    expect(generateInlineStyle({})).toBe("");
  });
});

describe("generateAttributes", () => {
  it("should convert attributes object to string with boolean handling", () => {
    const attrs = { disabled: true, id: "btn", hidden: false };

    expect(generateAttributes(attrs)).toBe('disabled id="btn"');
    expect(generateAttributes({})).toBe("");
  });
});

describe("formatDate", () => {
  it("should format a Date object to HH:MM:SS", () => {
    const date = new Date(2023, 0, 1, 5, 7, 9);

    expect(formatDate(date)).toBe("05:07:09");

    const date2 = new Date(2023, 0, 1, 15, 45, 59);

    expect(formatDate(date2)).toBe("15:45:59");
  });
});

describe("makeElementDraggable", () => {
  let handle: HTMLElement;
  let target: HTMLElement;

  beforeEach(() => {
    handle = document.createElement("div");
    target = document.createElement("div");
    document.body.appendChild(handle);
    document.body.appendChild(target);
  });

  it("should set touchAction to none on handle", () => {
    makeElementDraggable(handle, target);
    expect(handle.style.touchAction).toBe("none");
  });

  it("should update transform when dragged with mouse", () => {
    makeElementDraggable(handle, target);
    handle.dispatchEvent(
      new MouseEvent("mousedown", { clientX: 0, clientY: 0 }),
    );
    document.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 10, clientY: 15 }),
    );
    expect(target.style.transform).toBe("translate(10px, 15px)");
    document.dispatchEvent(new MouseEvent("mouseup"));
  });

  it("should update transform when dragged with touch", () => {
    makeElementDraggable(handle, target);
    handle.dispatchEvent(
      new TouchEvent("touchstart", {
        touches: [{ clientX: 0, clientY: 0 } as unknown as Touch],
      }),
    );
    document.dispatchEvent(
      new TouchEvent("touchmove", {
        touches: [{ clientX: 20, clientY: 25 } as unknown as Touch],
      }),
    );
    expect(target.style.transform).toBe("translate(20px, 25px)");
    document.dispatchEvent(new TouchEvent("touchend"));
  });

  it("should suppress click after drag", () => {
    makeElementDraggable(handle, target);
    handle.dispatchEvent(
      new MouseEvent("mousedown", { clientX: 0, clientY: 0 }),
    );
    document.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 10, clientY: 10 }),
    );

    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    let prevented = false;

    click.preventDefault = () => {
      prevented = true;
    };

    document.dispatchEvent(click);

    expect(prevented).toBe(true);
    document.dispatchEvent(new MouseEvent("mouseup"));
  });

  it("should not move if drag distance is below threshold", () => {
    makeElementDraggable(handle, target);
    handle.dispatchEvent(
      new MouseEvent("mousedown", { clientX: 0, clientY: 0 }),
    );
    document.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 2, clientY: 2 }),
    );
    expect(target.style.transform).toBe("");
  });

  it("should do nothing when dragging before drag start (isDragStarted = false)", () => {
    makeElementDraggable(handle, target);

    // Create a fake mousemove event
    const event = new MouseEvent("mousemove", {
      clientX: 100,
      clientY: 100,
      bubbles: true,
    });

    // Spy on transform changes
    const transformSpy = vi.spyOn(target.style, "transform", "set");

    // Dispatch the event directly (simulate drag move)
    document.dispatchEvent(event);

    // Assert that transform was not set
    expect(transformSpy).not.toHaveBeenCalled();
  });
});
describe("getClientX and getClientY", () => {
  beforeAll(() => {
    // Define a mock TouchEvent class so instanceof works in jsdom
    class MockTouchEvent extends Event {
      touches: { clientX?: number; clientY?: number }[];

      constructor(
        type: string,
        touches: { clientX?: number; clientY?: number }[],
      ) {
        super(type);
        this.touches = touches;
      }
    }

    // Assign to globalThis safely (no ESLint warnings)
    Object.defineProperty(globalThis, "TouchEvent", {
      value: MockTouchEvent,
      writable: true,
    });
  });

  describe("getClientY", () => {
    it("should return clientY for MouseEvent", () => {
      const event = new MouseEvent("mousemove", { clientY: 123 });

      expect(getClientY(event)).toBe(123);
    });

    it("should return clientY for first touch in TouchEvent", () => {
      const touch = { clientY: 456 };
      const event = new TouchEvent("touchmove", [
        touch,
      ] as unknown as TouchEventInit);

      expect(getClientY(event)).toBe(456);
    });

    it("should return 0 if TouchEvent has empty touches array", () => {
      const event = new TouchEvent(
        "touchmove",
        [] as unknown as TouchEventInit,
      );

      expect(getClientY(event)).toBe(0);
    });

    it("should return 0 if event is neither MouseEvent nor TouchEvent", () => {
      const event = {} as unknown as MouseEvent;

      expect(getClientY(event)).toBe(0);
    });
  });

  describe("getClientX", () => {
    it("should return clientX for MouseEvent", () => {
      const event = new MouseEvent("mousemove", { clientX: 150 });

      expect(getClientX(event)).toBe(150);
    });

    it("should return clientX for first touch in TouchEvent", () => {
      const touch = { clientX: 321 };
      const event = new TouchEvent("touchmove", [
        touch,
      ] as unknown as TouchEventInit);

      expect(getClientX(event)).toBe(321);
    });

    it("should return 0 if TouchEvent has empty touches array", () => {
      const event = new TouchEvent(
        "touchmove",
        [] as unknown as TouchEventInit,
      );

      expect(getClientX(event)).toBe(0);
    });

    it("should return 0 if event is neither MouseEvent nor TouchEvent", () => {
      const event = {} as unknown as TouchEvent;

      expect(getClientX(event)).toBe(0);
    });
  });
});
