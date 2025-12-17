import { gsap } from "gsap";
import { CONFIG } from "../../config.js";
import { AnimationUtils } from "../../utils/animation.js";
import { EventUtils } from "../../utils/event.js";
import { playSound } from "../../utils/audio.js";

const sound3Url = "/sounds/sound_3.mp3";

export class UISetupManager {
  constructor(resources, screen, customCursor) {
    this.resources = resources;
    this.screen = screen;
    this.customCursor = customCursor;
    this.eventListeners = [];
    this.spinButton = null;
    this.isSpinning = false;
    this.freeSpins = 5;
  }

  setSpinCallback(spinCallback) {
    this.spinCallback = spinCallback;
  }

  setIsSpinning(isSpinning) {
    this.isSpinning = isSpinning;
  }

  setFreeSpins(freeSpins) {
    this.freeSpins = freeSpins;
  }

  setupSpinButton() {
    const spinBtn = this.screen?.querySelector(".refresh-button");
    if (!spinBtn) return;

    this.spinButton = spinBtn;

    const handleSpin = async () => {
      if (this.isSpinning) return;
      if (this.freeSpins <= 0) return;

      playSound(sound3Url);

      const anim = AnimationUtils.createRotationAnimation(spinBtn);
      this.resources.registerAnimation(anim);

      if (this.spinCallback) {
        await this.spinCallback();
      }
    };

    const spinListeners = EventUtils.addClickAndTouchListeners(
      spinBtn,
      handleSpin
    );
    this.eventListeners.push(...spinListeners);

    const pulseAnim = AnimationUtils.createPulseAnimation(spinBtn);
    this.resources.registerAnimation(pulseAnim);

    const handleKeyDown = (e) => {
      if (e.key === "Enter" && !("ontouchstart" in window)) {
        e.preventDefault();
        handleSpin();
      }
    };

    const keydownListener = EventUtils.addEventListener(
      window,
      "keydown",
      handleKeyDown
    );
    this.eventListeners.push(keydownListener);
  }

  setupWithdrawButton() {
    const withdrawBtn = this.screen?.querySelector(".withdraw-button");
    if (!withdrawBtn) return;

    const handleWithdraw = () => {
      if (this.withdrawCallback) {
        this.withdrawCallback();
      }
    };

    const withdrawListeners = EventUtils.addClickAndTouchListeners(
      withdrawBtn,
      handleWithdraw
    );
    this.eventListeners.push(...withdrawListeners);
  }

  setWithdrawCallback(withdrawCallback) {
    this.withdrawCallback = withdrawCallback;
  }

  async setupCustomCursor() {
    if (!this.canSetupCursor()) return;

    this.showCursor();
    this.attachCursorHandlers();
  }

  canSetupCursor() {
    if (!this.customCursor) return false;

    if (this.isTouchDevice()) {
      this.customCursor.style.display = "none";
      return false;
    }

    if (!window._globalCursorInitialized) {
      return false;
    }

    return true;
  }

  isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  showCursor() {
    if (this.customCursor) {
      this.customCursor.style.display = "block";
      document.body.classList.add("custom-cursor-active");
    }
  }

  attachCursorHandlers() {
    const interactiveElements = this.getInteractiveElements();

    const handleMouseEnter = () => {
      if (this.customCursor && !this.isSpinning) {
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

  getInteractiveElements() {
    if (!this.screen) return [];
    return this.screen.querySelectorAll(
      CONFIG.CURSOR.INTERACTIVE_ELEMENTS.join(", ")
    );
  }

  updateSpinButton(disabled) {
    if (this.spinButton) {
      this.spinButton.disabled = disabled;
      if (disabled) {
        this.spinButton.classList.add("disabled");
      } else {
        this.spinButton.classList.remove("disabled");
      }
    }
  }

  updateFreeSpinsDisplay(freeSpins) {
    const freeSpinsElement = this.screen?.querySelector(".free-spins-count");
    if (freeSpinsElement) {
      freeSpinsElement.textContent = freeSpins;
    }
  }

  destroy() {
    this.eventListeners.forEach((listener) => {
      if (listener && listener.remove) {
        listener.remove();
      }
    });
    this.eventListeners = [];
  }
}
