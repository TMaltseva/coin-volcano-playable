export const EventUtils = {
  addEventListener(element, type, handler, options = {}) {
    element.addEventListener(type, handler, options);

    return {
      remove: () => {
        element.removeEventListener(type, handler, options);
      },
      element,
      type,
      handler,
    };
  },

  addClickAndTouchListeners(element, handler) {
    const clickListener = this.addEventListener(element, "click", handler);
    const touchListener = this.addEventListener(
      element,
      "touchstart",
      (e) => {
        e.preventDefault();
        handler(e);
      },
      { passive: false }
    );

    return [clickListener, touchListener];
  },
};
