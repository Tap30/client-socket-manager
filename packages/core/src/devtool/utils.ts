// Drag tracking state
let x = 0;
let y = 0;
let initialX = x;
let initialY = y;
let startX = 0;
let startY = 0;
let didMove = false;
let isDragStarted = false;

export const generateInlineStyle = (
  cssObject: Record<string, string>,
): string => {
  return Object.entries(cssObject)
    .map(([cssKey, cssValue]) => `${cssKey}: ${cssValue}`)
    .join("; ");
};

export const generateAttributes = (
  attrObject: Record<string, string | boolean>,
): string => {
  return Object.entries(attrObject)
    .map(([cssKey, cssValue]) =>
      typeof cssValue == "boolean"
        ? cssValue
          ? cssKey
          : ""
        : `${cssKey}="${cssValue}"`,
    )
    .join(" ");
};

/**
 * Makes an HTML element draggable via mouse and touch gestures.
 *
 * This utility:
 * - Supports dragging using both mouse (desktop) and touch (mobile) events.
 * - Prevents synthetic click events from triggering after a drag.
 * - Prevents default browser gestures such as back/forward swipe on mobile.
 * - Applies `transform: translate(x, y)` to move the element instead of `top` and `left` for better performance
 *
 * Usage:
 * ```ts
 * const button = document.createElement('button');
 * button.textContent = 'Drag me';
 * document.body.appendChild(button);
 * makeElementDraggable(button);
 * ```
 *
 * Notes:
 * - The element must be absolutely or fixed-positioned, and should not be constrained by layout flow
 * - Internally sets `element.style.touchAction = 'none'` to disable browser-native touch gestures
 *
 * @param dragHandle - The drag handle.
 * @param dragTarget - The HTMLElement that will move when dragging with the handler.
 */
export const makeElementDraggable = (
  dragHandle: HTMLElement,
  dragTarget: HTMLElement,
) => {
  // Extract clientX from MouseEvent or TouchEvent
  const getClientX = (event: MouseEvent | TouchEvent) => {
    if (event instanceof MouseEvent) return event.clientX;
    if (event instanceof TouchEvent) return event.touches[0]?.clientX ?? 0;
    return 0;
  };

  // Extract clientY from MouseEvent or TouchEvent
  const getClientY = (event: MouseEvent | TouchEvent) => {
    if (event instanceof MouseEvent) return event.clientY;
    if (event instanceof TouchEvent) return event.touches[0]?.clientY ?? 0;
    return 0;
  };

  // Suppress click after drag to avoid unintentional tap
  const suppressClickOnce = (e: MouseEvent) => {
    if (didMove) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const handleDragStart = (event: MouseEvent | TouchEvent) => {
    const clientX = getClientX(event);
    const clientY = getClientY(event);

    startX = clientX;
    startY = clientY;
    initialX = x;
    initialY = y;
    didMove = false;
    isDragStarted = true;
    // Attach temporary click suppressor for post-drag click prevention
    document.addEventListener("click", suppressClickOnce, true);
  };

  const handleDragging = (event: MouseEvent | TouchEvent) => {
    if (!isDragStarted) return;

    const clientX = getClientX(event);
    const clientY = getClientY(event);

    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    // Mark as moved only after threshold (avoid noise from small movements)
    if (!didMove && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
      didMove = true;
    }

    if (didMove) {
      // Prevent native scrolling or gestures during real drag
      event.preventDefault();
      event.stopPropagation();

      x = initialX + deltaX;
      y = initialY + deltaY;

      dragTarget.style.transform = `translate(${x}px, ${y}px)`;
    }
  };

  const handleDragEnd = () => {
    if (!isDragStarted) return;

    isDragStarted = false;

    document.removeEventListener("click", suppressClickOnce, true);
  };

  // Disable browser-native touch gestures (scroll, nav swipe)
  dragHandle.style.touchAction = "none";

  dragHandle.addEventListener("touchstart", handleDragStart, false);
  dragHandle.addEventListener("mousedown", handleDragStart, false);

  document.addEventListener("mousemove", handleDragging, false);
  document.addEventListener("touchmove", handleDragging, false);

  document.addEventListener("mouseup", handleDragEnd, false);
  document.addEventListener("touchend", handleDragEnd, false);
};

export const formatDate = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};
