export class ScrollPreservor {
  private _savedScrollPosition: number = 0;
  private _target: HTMLElement | null = null;

  constructor(options?: { target?: HTMLElement | null }) {
    const { target } = options ?? {};

    if (target) {
      this._target = target;
    }
  }

  /**
   * Sets the HTML element to monitor.
   * @param target The HTML element to monitor.
   */
  public setTarget(target: HTMLElement | null): void {
    if (!target) {
      return;
    }

    this._target = target;
  }

  public get savedScrollPosition(): number {
    return this._savedScrollPosition;
  }

  /**
   * Saves the current scroll position of the element.
   * This method stores the `scrollTop` value of the currently set element.
   */
  public save(): void {
    if (!this._target) {
      return;
    }

    this._savedScrollPosition = this._target.scrollTop;
  }

  /**
   * Restores the saved scroll position to the element.
   * This method sets the `scrollTop` value of the element to the previously saved position.
   */
  public restore(): void {
    if (!this._target) {
      return;
    }

    this._target.scrollTop = this._savedScrollPosition;
  }
}
