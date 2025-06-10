/**
 * A fixed-length queue that automatically removes the oldest item
 * when the maximum length is exceeded.
 *
 * This data structure behaves like a FIFO queue but ensures it never
 * grows beyond the specified capacity.
 */
export class FixedQueue<T> {
  private _queue: T[] = [];
  private _maxLength: number;

  /**
   * Creates a FixedQueue instance with a maximum length.
   *
   * @param maxLength - The maximum number of items the queue can hold.
   * @throws Will throw an error if maxLength is not a positive integer.
   *
   * @example
   * ```ts
   * const queue = new FixedQueue<number>(3);
   * queue.enqueue(1);
   * queue.enqueue(2);
   * queue.enqueue(3);
   * console.log(queue.values); // [1, 2, 3]
   * queue.enqueue(4);
   * console.log(queue.values); // [2, 3, 4]
   * console.log(queue.length); // 3
   * ```
   */
  constructor(maxLength: number) {
    if (!Number.isInteger(maxLength) || maxLength <= 0) {
      throw new Error("maxLength must be a positive integer");
    }

    this._maxLength = maxLength;
  }

  /**
   * Adds an item to the queue. If the queue exceeds its max length,
   * the oldest item is removed.
   *
   * @param item - The item to enqueue.
   */
  enqueue(item: T): void {
    if (this._queue.length >= this._maxLength) {
      this._queue.shift(); // Remove oldest
    }

    this._queue.push(item);
  }

  /**
   * Gets a copy of the queue's current values in insertion order.
   */
  get values(): T[] {
    return [...this._queue];
  }

  /**
   * Gets the current number of items in the queue.
   */
  get length(): number {
    return this._queue.length;
  }
}
