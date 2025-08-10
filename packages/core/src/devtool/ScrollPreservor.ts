export class ScrollPreservor {
  private _savedScrollPosition: number = 0;
  private _element: HTMLElement | null = null;

  constructor(options?: { element?: HTMLElement | null }) {
    const { element } = options ?? {};

    if (element) {
      this._element = element;
    }
  }

  /**
   * Sets the HTML element to monitor.
   * @param target The HTML element to monitor.
   */
  public setElement(target: HTMLElement | null): void {
    if (!target) {
      return;
    }

    this._element = target;
  }

  public get savedScrollPosition(): number {
    return this._savedScrollPosition;
  }

  /**
   * Saves the current scroll position of the element.
   * This method stores the `scrollTop` value of the currently set element.
   */
  public save(): void {
    if (!this._element) {
      return;
    }

    this._savedScrollPosition = this._element.scrollTop;
  }

  /**
   * Restores the saved scroll position to the element.
   * This method sets the `scrollTop` value of the element to the previously saved position.
   */
  public restore(): void {
    if (!this._element) {
      return;
    }

    this._element.scrollTop = this._savedScrollPosition;
  }
}
