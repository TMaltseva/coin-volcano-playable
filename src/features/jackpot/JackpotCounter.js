import { CONFIG } from "../../config.js";

export class JackpotCounter {
  constructor(resources, screen) {
    this.resources = resources;
    this.screen = screen;
    this.jackpotCounters = {
      mini: { current: 22000, increment: 12, initial: 22000, max: 999999 },
      major: { current: 69000, increment: 25, initial: 69000, max: 999999 },
      minor: { current: 36000, increment: 18, initial: 36000, max: 999999 },
    };
  }

  startAnimation() {
    const elements = this.getJackpotElements();
    if (!this.canStartAnimation(elements)) return;

    this.createAnimationLoop(elements);
  }

  getJackpotElements() {
    return {
      mini: this.screen.querySelector(".jackpot-mini .jackpot-amount"),
      major: this.screen.querySelector(".jackpot-major .jackpot-amount"),
      minor: this.screen.querySelector(".jackpot-minor .jackpot-amount"),
    };
  }

  canStartAnimation(elements) {
    return elements.mini && elements.major && elements.minor && this.screen;
  }

  createAnimationLoop(elements) {
    let lastUpdateTime = performance.now();

    const updateCounter = (currentTime) => {
      const startTime = import.meta.env.DEV ? performance.now() : 0;

      if (
        currentTime - lastUpdateTime >=
        CONFIG.JACKPOT_COUNTER.UPDATE_INTERVAL
      ) {
        this.updateAllCounters(elements);
        lastUpdateTime = currentTime;
      }

      if (import.meta.env.DEV) {
        this.checkPerformance(startTime);
      }

      this.resources.requestAnimationFrame(updateCounter);
    };

    updateCounter(performance.now());
  }

  updateAllCounters(elements) {
    this.updateSingleCounter("mini", elements.mini);
    this.updateSingleCounter("major", elements.major);
    this.updateSingleCounter("minor", elements.minor);
  }

  updateSingleCounter(type, element) {
    const counter = this.jackpotCounters[type];

    counter.current += counter.increment;

    if (counter.current >= counter.max) {
      counter.current = counter.initial;
    }

    element.textContent = this.formatAmount(counter.current);
  }

  formatAmount(amount) {
    return `${Math.floor(amount).toLocaleString(
      CONFIG.JACKPOT_COUNTER.LOCALE
    )} ${CONFIG.JACKPOT_COUNTER.CURRENCY_SYMBOL}`;
  }

  checkPerformance(startTime) {
    if (!import.meta.env.DEV) return;

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    if (executionTime > CONFIG.JACKPOT_COUNTER.PERFORMANCE_THRESHOLD) {
      console.warn(`Jackpot RAF slow: ${executionTime.toFixed(2)}ms`);
    }
  }
}
