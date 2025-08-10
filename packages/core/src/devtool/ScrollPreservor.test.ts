import { beforeEach, describe, expect, it } from "vitest";
import { ScrollPreservor } from "./ScrollPreservor.ts";

describe("ScrollPreservor", () => {
  let element: HTMLElement;
  let scrollPreservor: ScrollPreservor;

  beforeEach(() => {
    // Set up a mock HTML element for testing
    element = document.createElement("div");
    Object.defineProperty(element, "scrollTop", { writable: true, value: 0 });
    scrollPreservor = new ScrollPreservor({ element });
  });

  it("should be able to set and save the scroll position", () => {
    const scrollPosition = 100;

    element.scrollTop = scrollPosition;

    scrollPreservor.save();

    expect(scrollPreservor.savedScrollPosition).toBe(scrollPosition);
  });

  it("should restore the saved scroll position", () => {
    const scrollPosition = 50;

    element.scrollTop = scrollPosition;
    scrollPreservor.save();

    // Change the scroll position to ensure it gets restored
    element.scrollTop = 0;
    scrollPreservor.restore();

    expect(element.scrollTop).toBe(scrollPosition);
  });

  it("should handle cases where no element is set", () => {
    const newScrollPreservor = new ScrollPreservor({});

    // It should not throw an error and simply do nothing
    expect(() => newScrollPreservor.save()).not.toThrow();
    expect(() => newScrollPreservor.restore()).not.toThrow();
  });

  it("should be able to dynamically set a new element", () => {
    const newElement = document.createElement("section");

    Object.defineProperty(newElement, "scrollTop", {
      writable: true,
      value: 75,
    });
    const scrollPosition = 75;

    // Set the new element and test saving and restoring
    scrollPreservor.setElement(newElement);
    scrollPreservor.save();

    expect(scrollPreservor.savedScrollPosition).toBe(scrollPosition);

    newElement.scrollTop = 0;
    scrollPreservor.restore();
    expect(newElement.scrollTop).toBe(scrollPosition);
  });

  it("should handle restoring before saving", () => {
    // Ensure that restoring when no position has been saved does not throw an error
    // and ideally sets scrollTop to 0 or the initial value.
    element.scrollTop = 50;
    scrollPreservor.restore();

    expect(element.scrollTop).toBe(0);
  });

  it("should handle saving with a null element", () => {
    const newScrollPreservor = new ScrollPreservor({ element: null });

    expect(() => newScrollPreservor.save()).not.toThrow();
  });

  it("should handle restoring with a null element", () => {
    const newScrollPreservor = new ScrollPreservor({ element: null });

    expect(() => newScrollPreservor.restore()).not.toThrow();
  });

  it("should correctly handle setting a null element", () => {
    scrollPreservor.setElement(null);
    expect(() => scrollPreservor.save()).not.toThrow();
    expect(() => scrollPreservor.restore()).not.toThrow();
  });

  it("should overwrite a previously saved position when a new one is saved", () => {
    // Save an initial position
    element.scrollTop = 10;
    scrollPreservor.save();

    // Change scroll position and save again
    element.scrollTop = 99;
    scrollPreservor.save();

    // Restore and check if it's the latest saved position
    element.scrollTop = 0;
    scrollPreservor.restore();
    expect(element.scrollTop).toBe(99);
  });

  it("should handle saving and restoring with scrollTop of 0", () => {
    // Ensure saving a 0 value works correctly
    element.scrollTop = 0;
    scrollPreservor.save();

    // Change scroll position and restore
    element.scrollTop = 50;
    scrollPreservor.restore();

    expect(element.scrollTop).toBe(0);
  });
});
