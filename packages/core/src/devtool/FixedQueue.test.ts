// FixedQueue.test.ts
import { describe, expect, it } from "vitest";
import { FixedQueue } from "./FixedQueue.ts";

describe("FixedQueue", () => {
  it("throws an error if maxLength is not a positive integer", () => {
    const invalidValues = [0, -1, -100, 1.5, NaN, Infinity, null, undefined];

    invalidValues.forEach(value => {
      // @ts-expect-error check error scenario
      expect(() => new FixedQueue<number>(value)).toThrow(
        "maxLength must be a positive integer",
      );
    });

    // Valid case should not throw
    expect(() => new FixedQueue<number>(1)).not.toThrow();
  });

  it("initializes an empty queue with correct maxLength", () => {
    const queue = new FixedQueue<number>(3);

    expect(queue.length).toBe(0);
    expect(queue.values).toEqual([]);
  });

  it("enqueues items and respects maxLength", () => {
    const queue = new FixedQueue<number>(3);

    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);

    expect(queue.values).toEqual([1, 2, 3]);
    expect(queue.length).toBe(3);

    // Enqueueing beyond maxLength removes oldest
    queue.enqueue(4);
    expect(queue.values).toEqual([2, 3, 4]);
    expect(queue.length).toBe(3);

    queue.enqueue(5);
    expect(queue.values).toEqual([3, 4, 5]);
    expect(queue.length).toBe(3);
  });

  it("works with different types (generic)", () => {
    const queue = new FixedQueue<string>(2);

    queue.enqueue("a");
    queue.enqueue("b");
    queue.enqueue("c"); // overflows

    expect(queue.values).toEqual(["b", "c"]);
  });

  it("clear() empties the queue", () => {
    const queue = new FixedQueue<number>(3);

    queue.enqueue(1);
    queue.enqueue(2);

    expect(queue.length).toBe(2);
    queue.clear();
    expect(queue.length).toBe(0);
    expect(queue.values).toEqual([]);
  });

  it("maintains insertion order after overflow", () => {
    const queue = new FixedQueue<number>(3);

    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);
    queue.enqueue(4); // 1 removed
    queue.enqueue(5); // 2 removed

    expect(queue.values).toEqual([3, 4, 5]);
  });
});
