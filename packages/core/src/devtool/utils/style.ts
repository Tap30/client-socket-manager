import { state } from "../states.ts";

export const getInlineStyle = (cssObject: Record<string, string>): string => {
  return Object.entries(cssObject)
    .map(([cssKey, cssValue]) => `${cssKey}: ${cssValue}`)
    .join("; ");
};

export const buttonDefaultStyles = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  "-webkit-tap-highlight-color": "transparent",
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
 * @param element - The HTMLElement to make draggable
 */
export const makeElementDraggable = (element: HTMLElement) => {
  // ========================
  // Helper functions
  // ========================

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

  // Get required bounding box of element, optionally accounting for transform scaling
  const getBoundingClientRect = (
    element: HTMLElement,
    includeScale = false,
  ): {
    width: number;
    height: number;
    top: number;
    left: number;
  } => {
    const clientRect = element.getBoundingClientRect();

    let scaleX = 1;
    let scaleY = 1;

    if (includeScale) {
      scaleX =
        element.offsetWidth > 0
          ? Math.round(clientRect.width) / element.offsetWidth || 1
          : 1;
      scaleY =
        element.offsetHeight > 0
          ? Math.round(clientRect.height) / element.offsetHeight || 1
          : 1;
    }

    return {
      width: clientRect.width / scaleX,
      height: clientRect.height / scaleY,
      top: clientRect.top / scaleY,
      left: clientRect.left / scaleX,
    };
  };

  // Suppress click after drag to avoid unintentional tap
  const suppressClickOnce = (e: MouseEvent) => {
    if (didMove) {
      e.stopPropagation();
      e.preventDefault();
    }

    document.removeEventListener("click", suppressClickOnce, true);
  };

  // ========================
  // Event handlers
  // ========================

  const handleDragStart = (event: MouseEvent | TouchEvent) => {
    const clientX = getClientX(event);
    const clientY = getClientY(event);

    startX = clientX;
    startY = clientY;
    didMove = false;

    // Attach temporary click suppressor for post-drag click prevention
    document.addEventListener("click", suppressClickOnce, true);

    state.isDragStarted = true;
  };

  const handleDragging = (event: MouseEvent | TouchEvent) => {
    if (!state.isDragStarted) return;

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

      // Move the element centered on pointer
      const { width, height } = getBoundingClientRect(element);

      x = clientX - width / 2;
      y = clientY - height / 2;
      element.style.transform = `translate(${x}px, ${y}px)`;
    }
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent) => {
    if (!state.isDragStarted) return;

    state.isDragStarted = false;

    // Prevent mouse-based click only; touch clicks will work fine
    if (e.type === "mouseup") {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // ========================
  // Initialize
  // ========================

  // Disable browser-native touch gestures (scroll, nav swipe)
  element.style.touchAction = "none";

  // Set initial position based on bounding box
  const { top: initialTop, left: initialLeft } = getBoundingClientRect(element);
  let x = initialLeft;
  let y = initialTop;

  // Drag tracking state
  let startX = 0;
  let startY = 0;
  let didMove = false;

  element.addEventListener("touchstart", handleDragStart);
  element.addEventListener("mousedown", handleDragStart);

  document.addEventListener("mousemove", handleDragging);
  document.addEventListener("touchmove", handleDragging);

  document.addEventListener("mouseup", handleDragEnd);
  document.addEventListener("touchend", handleDragEnd);
};
