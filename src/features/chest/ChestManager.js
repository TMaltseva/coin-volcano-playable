import { gsap } from "gsap";
import { CONFIG } from "../../config.js";
import { CalculationUtils } from "../../utils/calculation.js";
import { EventUtils } from "../../utils/event.js";
import { playSound } from "../../utils/audio.js";

const sound2Url = "/sounds/sound_2.mp3";
const sound3Url = "/sounds/sound_3.mp3";
const sound4Url = "/sounds/sound_4.mp3";

export class ChestManager {
  constructor(resources, chestWrappers, eventListeners, onChestSelectCallback) {
    this.resources = resources;
    this.chestWrappers = chestWrappers;
    this.eventListeners = eventListeners;
    this.onChestSelectCallback = onChestSelectCallback;
    this.selectedChest = null;
    this.winningChests = [];
    this.winAmounts = {};
    this.chestPulseAnimations = [];
    this.chestPulseAnimationsByIndex = {};
    this.chestHoverAnimations = {};
  }

  setupInteractions() {
    this.chestWrappers.forEach((wrapper, index) => {
      wrapper.setAttribute("data-chest-index", index);
      wrapper._chestIndex = index;

      const handleChestClick = (e) => {
        e.stopPropagation();
        if (this.selectedChest !== null) return;

        const chestIndex = wrapper._chestIndex;
        if (chestIndex !== undefined) {
          if (this.onChestSelectCallback) {
            this.onChestSelectCallback(chestIndex);
          } else {
            this.selectChest(chestIndex);
          }
        }
      };

      const chestClickListeners = EventUtils.addClickAndTouchListeners(
        wrapper,
        handleChestClick
      );

      let wrapperEntry = this.eventListeners.chestWrappers.find(
        (entry) => entry.wrapper === wrapper
      );
      if (!wrapperEntry) {
        wrapperEntry = { wrapper, handlers: [] };
        this.eventListeners.chestWrappers.push(wrapperEntry);
      }

      wrapperEntry.handlers.push(...chestClickListeners);

      const handleMouseEnter = () => {
        if (
          this.selectedChest !== null ||
          wrapper.classList.contains("disabled") ||
          wrapper.classList.contains("opened") ||
          wrapper.classList.contains("selected")
        ) {
          return;
        }

        if (this.chestPulseAnimationsByIndex[index]) {
          this.chestPulseAnimationsByIndex[index].pause();
        }

        const activePulseTweens = gsap
          .getTweensOf(wrapper)
          .filter(
            (tween) =>
              tween.vars.scale !== undefined && tween.vars.repeat !== undefined
          );
        activePulseTweens.forEach((tween) => {
          if (!tween.paused()) {
            tween.pause();
          }
        });

        if (this.chestHoverAnimations[index]) {
          this.chestHoverAnimations[index].kill();
        }

        this.chestHoverAnimations[index] = gsap.to(wrapper, {
          scale: CONFIG.ANIMATION.HOVER_SCALE,
          duration: CONFIG.ANIMATION.HOVER_DURATION,
          ease: "sine.out",
        });
      };

      const handleMouseLeave = () => {
        if (
          this.selectedChest !== null ||
          wrapper.classList.contains("disabled") ||
          wrapper.classList.contains("opened") ||
          wrapper.classList.contains("selected")
        ) {
          return;
        }

        if (this.chestHoverAnimations[index]) {
          this.chestHoverAnimations[index].kill();
        }

        this.chestHoverAnimations[index] = gsap.to(wrapper, {
          scale: 1,
          duration: CONFIG.ANIMATION.HOVER_DURATION,
          ease: "sine.out",
          onComplete: () => {
            if (this.chestPulseAnimationsByIndex[index]) {
              this.chestPulseAnimationsByIndex[index].resume();
            }

            const pausedPulseTweens = gsap
              .getTweensOf(wrapper)
              .filter(
                (tween) =>
                  tween.paused() &&
                  tween.vars.scale !== undefined &&
                  tween.vars.repeat !== undefined
              );
            pausedPulseTweens.forEach((tween) => {
              tween.resume();
            });
          },
        });
      };

      const enterListener = EventUtils.addEventListener(
        wrapper,
        "mouseenter",
        handleMouseEnter
      );
      const leaveListener = EventUtils.addEventListener(
        wrapper,
        "mouseleave",
        handleMouseLeave
      );

      if (!wrapperEntry) {
        wrapperEntry = { wrapper, handlers: [] };
        this.eventListeners.chestWrappers.push(wrapperEntry);
      }

      wrapperEntry.handlers.push(enterListener, leaveListener);
    });
  }

  startPulseAnimation() {
    this.stopPulseAnimation();

    const pulseChest = (index) => {
      if (this.selectedChest !== null) {
        return;
      }

      const wrapper = this.chestWrappers[index];
      if (
        !wrapper ||
        wrapper.classList.contains("selected") ||
        wrapper.classList.contains("disabled")
      ) {
        const nextIndex = (index + 1) % this.chestWrappers.length;
        pulseChest(nextIndex);
        return;
      }

      const animation = gsap.to(wrapper, {
        scale: CONFIG.ANIMATION.PULSE_SCALE,
        duration: CONFIG.ANIMATION.PULSE_DURATION / 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          const nextIndex = (index + 1) % this.chestWrappers.length;
          pulseChest(nextIndex);
        },
      });

      this.chestPulseAnimations.push(animation);
      this.chestPulseAnimationsByIndex[index] = animation;
    };

    pulseChest(0);
  }

  stopPulseAnimation() {
    this.chestPulseAnimations.forEach((animation) => {
      if (animation) {
        animation.kill();
      }
    });
    this.chestPulseAnimations = [];
    this.chestPulseAnimationsByIndex = {};

    this.chestWrappers.forEach((wrapper) => {
      gsap.set(wrapper, { scale: 1 });
    });
  }

  selectChest(index, onChestSelected) {
    this.stopPulseAnimation();

    playSound(sound3Url);
    setTimeout(() => {
      playSound(sound2Url);
    }, 50);
    setTimeout(() => {
      playSound(sound4Url);
    }, 100);

    this.selectedChest = index;
    const wrapper = this.chestWrappers[index];

    wrapper.classList.add("selected");

    this.winAmounts[index] = CONFIG.WIN.DEFAULT_AMOUNT;

    this.chestWrappers.forEach((w, i) => {
      if (i !== index) {
        w.classList.add("disabled", "dimmed");
      }
    });

    if (onChestSelected) {
      onChestSelected(index, wrapper);
    }
  }

  openDimmedChest(wrapper) {
    const closedImage = wrapper.querySelector(".chest-closed");
    const openedImage = wrapper.querySelector(".chest-opened");

    if (!closedImage || !openedImage) return;

    closedImage.style.opacity = "0";
    closedImage.style.display = "none";

    openedImage.style.display = "block";
    openedImage.style.opacity = "0";

    openedImage.style.filter = "saturate(0.3) brightness(0.7)";

    gsap.to(openedImage, {
      opacity: 1,
      duration: CONFIG.ANIMATION.HOVER_DURATION,
      ease: "sine.out",
    });

    gsap.to(wrapper, {
      scale: CONFIG.ANIMATION.DIM_SCALE * 1.29,
      duration: 0.5,
      ease: "sine.out",
    });
  }

  initializeWinningChests() {
    const winCount = CalculationUtils.randomRange(1, 2);
    const indices = [0, 1, 2];
    for (let i = 0; i < winCount; i++) {
      const randomIndex = CalculationUtils.randomRange(0, indices.length - 1);
      const winIndex = indices.splice(randomIndex, 1)[0];
      this.winningChests.push(winIndex);
      const winAmount = CalculationUtils.randomRange(
        CONFIG.WIN.MIN_LARGE,
        CONFIG.WIN.MAX_LARGE
      );
      this.winAmounts[winIndex] = winAmount;
    }
  }

  showWinAmount(wrapper, chestIndex) {
    const winAmountElement = wrapper.querySelector(".win-amount");
    if (winAmountElement && this.winAmounts[chestIndex]) {
      const amount = this.winAmounts[chestIndex];

      winAmountElement.textContent = "";

      if (typeof amount === "string") {
        const parts = amount.split(" FREE SPINS");
        if (parts.length === 2) {
          winAmountElement.textContent = parts[0];
          const br = document.createElement("br");
          winAmountElement.append(br, document.createTextNode("FREE SPINS"));
        } else {
          winAmountElement.textContent = amount;
        }
      } else {
        winAmountElement.textContent = CalculationUtils.formatAmount(
          amount,
          "$"
        );
      }
    }
  }

  animateChestsFlyAway(onComplete) {
    const maxDelay =
      (this.chestWrappers.length - 1) * CONFIG.ANIMATION.FLY_AWAY_DELAY +
      CONFIG.ANIMATION.FLY_AWAY_BOUNCE_DURATION +
      CONFIG.ANIMATION.FLY_AWAY_DURATION;

    this.chestWrappers.forEach((wrapper, index) => {
      const delay = index * CONFIG.ANIMATION.FLY_AWAY_DELAY;

      const tl = gsap.timeline({ delay: delay });

      tl.to(wrapper, {
        y: `+=${CONFIG.ANIMATION.FLY_AWAY_BOUNCE}`,
        duration: CONFIG.ANIMATION.FLY_AWAY_BOUNCE_DURATION,
        ease: "sine.out",
      });

      tl.to(wrapper, {
        y: `-=${CONFIG.ANIMATION.FLY_AWAY_DISTANCE}`,
        duration: CONFIG.ANIMATION.FLY_AWAY_DURATION,
        ease: "power2.in",
        opacity: 0,
      });
    });

    this.resources.setTimeout(() => {
      if (onComplete) onComplete();
    }, maxDelay * 1000 + 500);
  }

  getSelectedChest() {
    return this.selectedChest;
  }

  getWinningChests() {
    return this.winningChests;
  }

  getWinAmounts() {
    return this.winAmounts;
  }

  cleanup() {
    this.stopPulseAnimation();
    Object.values(this.chestHoverAnimations).forEach((anim) => anim?.kill());
    this.chestHoverAnimations = {};
  }
}
