import { EventUtils } from "../../utils/event.js";
import { CONFIG } from "../../config.js";

export class CursorManager {
  constructor(resources, customCursor) {
    this.resources = resources;
    this.customCursor = customCursor;
    this.mouseX = window._globalCursorMouse?.x || 0;
    this.mouseY = window._globalCursorMouse?.y || 0;
    this.eventListeners = [];
    this.isInitialized = false;
  }

  initialize() {
    if (!this.customCursor) return;

    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      this.customCursor.style.display = "none";
      return;
    }

    if (window._globalCursorInitialized) {
      this.isInitialized = true;
      return;
    }

    window._globalCursorInitialized = true;
    this.isInitialized = true;
    this.customCursor.style.display = "block";
    document.body.classList.add("custom-cursor-active");

    this.setupMouseTracking();
  }

  setupMouseTracking() {
    let rafId = null;
    let needsUpdate = false;
    let lastUpdateTime = 0;
    const throttleInterval = 16;

    const updateCursor = () => {
      const now = performance.now();
      if (needsUpdate && now - lastUpdateTime >= throttleInterval) {
        if (this.customCursor) {
          this.customCursor.style.transform = `translate3d(${this.mouseX}px, ${this.mouseY}px, 0) translate(-50%, -50%)`;
        }
        needsUpdate = false;
        lastUpdateTime = now;
      }
      rafId = this.resources.requestAnimationFrame(updateCursor);
    };

    const handleMouseMove = (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      needsUpdate = true;
      if (rafId === null) {
        updateCursor();
      }
    };

    const handleMouseLeave = () => {
      if (this.customCursor) {
        this.customCursor.classList.remove("active");
      }
    };

    const mousemoveListener = EventUtils.addEventListener(
      document,
      "mousemove",
      handleMouseMove,
      { passive: true }
    );
    const mouseleaveListener = EventUtils.addEventListener(
      document,
      "mouseleave",
      handleMouseLeave
    );

    this.eventListeners.push(mousemoveListener, mouseleaveListener);
  }

  attachChestHandlers(chestWrappers, selectedChestGetter) {
    const handleWrapperMouseEnter = (wrapper) => () => {
      if (
        !wrapper.classList.contains("disabled") &&
        selectedChestGetter() === null &&
        this.customCursor
      ) {
        this.customCursor.classList.add("active");
      }
    };

    const handleWrapperMouseLeave = () => {
      if (selectedChestGetter() === null && this.customCursor) {
        this.customCursor.classList.remove("active");
      }
    };

    chestWrappers.forEach((wrapper) => {
      const enterHandler = handleWrapperMouseEnter(wrapper);
      const leaveHandler = handleWrapperMouseLeave;

      const enterListener = EventUtils.addEventListener(
        wrapper,
        "mouseenter",
        enterHandler
      );
      const leaveListener = EventUtils.addEventListener(
        wrapper,
        "mouseleave",
        leaveHandler
      );

      this.eventListeners.push(enterListener, leaveListener);
    });
  }

  attachSlotMachineHandlers(interactiveElements, isSpinningGetter) {
    const handleMouseEnter = () => {
      if (this.customCursor && !isSpinningGetter()) {
        this.customCursor.classList.add("active");
      }
    };

    const handleMouseLeave = () => {
      if (this.customCursor) {
        this.customCursor.classList.remove("active");
      }
    };

    interactiveElements.forEach((element) => {
      const enterListener = EventUtils.addEventListener(
        element,
        "mouseenter",
        handleMouseEnter
      );
      const leaveListener = EventUtils.addEventListener(
        element,
        "mouseleave",
        handleMouseLeave
      );

      this.eventListeners.push(enterListener, leaveListener);
    });
  }

  setActive(active) {
    if (!this.customCursor) return;
    if (active) {
      this.customCursor.classList.add("active");
    } else {
      this.customCursor.classList.remove("active");
    }
  }

  removeEventListeners() {
    this.eventListeners.forEach((listener) => {
      if (listener && listener.remove) {
        listener.remove();
      }
    });
    this.eventListeners = [];
  }

  destroy() {
    this.removeEventListeners();
  }
}
