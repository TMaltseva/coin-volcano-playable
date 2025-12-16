export const CalculationUtils = {
  getRelativePosition(element, container) {
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    return {
      x: elementRect.left - containerRect.left,
      y: elementRect.top - containerRect.top,
    };
  },

  getElementCenter(element) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  },

  formatAmount(amount, prefix = "") {
    const formatted = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return prefix ? `${prefix}${formatted}` : formatted;
  },

  randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  calculateBlur() {
    const vw = window.innerWidth / 100;
    const minBlur = 0.2 * 16;
    const preferredBlur = 0.5 * vw;
    const maxBlur = 0.4 * 16;
    return Math.max(minBlur, Math.min(preferredBlur, maxBlur));
  },
};
