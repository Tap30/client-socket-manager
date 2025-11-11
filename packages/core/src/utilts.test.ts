import { describe, expect, it } from "vitest";
import { assertCallbackType } from "./utils.ts";

describe("assertCallbackType", () => {
  it("returns true for functions", () => {
    const cb = () => {};

    expect(assertCallbackType(cb, "test callback")).toBe(true);
  });

  it("throws TypeError for non-functions", () => {
    const invalidValues: unknown[] = [null, undefined, 123, "string", {}, []];

    invalidValues.forEach(val => {
      expect(() => assertCallbackType(val, "must be a function")).toThrow(
        TypeError,
      );
      expect(() => assertCallbackType(val, "must be a function")).toThrow(
        /ClientSocketManager: must be a function/,
      );
    });
  });
});
