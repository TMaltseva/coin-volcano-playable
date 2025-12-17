import { gsap } from "gsap";
import * as PIXI from "pixi.js";
import { CONFIG } from "../../config.js";
import { DOMUtils } from "../../utils/dom.js";
import { CalculationUtils } from "../../utils/calculation.js";
import { playSound } from "../../utils/audio.js";

const sound7Url = "/sounds/sound_7.mp3";

export class CoinEffects {
  constructor(resources, sparklesApp, sparkPool) {
    this.resources = resources;
    this.sparklesApp = sparklesApp;
    this.sparkPool = sparkPool;
  }

  async processCoinsAfterSpin(allCoins) {
    await this.waitForSymbolAnimations();

    allCoins.forEach((coinContainer, index) => {
      if (
        coinContainer &&
        coinContainer.parentNode &&
        document.body.contains(coinContainer) &&
        coinContainer.querySelector(".coin-text")
      ) {
        this.animateCoinWithValue(coinContainer, index);
      }
    });
  }

  waitForSymbolAnimations() {
    const lastSymbolDelay =
      (CONFIG.SLOT_MACHINE.ROWS - 1) *
      CONFIG.SLOT_MACHINE.SYMBOL_DELAY_MULTIPLIER;
    const additionalDelay = CONFIG.SLOT_MACHINE.SYMBOL_SCALE_DURATION;
    const waitForAllSymbols =
      (lastSymbolDelay + additionalDelay) * 1000 +
      CONFIG.SLOT_MACHINE.ADDITIONAL_WAIT_DELAY;

    return new Promise((resolve) => {
      this.resources.setTimeout(resolve, waitForAllSymbols);
    });
  }

  animateCoinWithValue(coinContainer, index) {
    if (
      !coinContainer ||
      !coinContainer.parentNode ||
      !document.body.contains(coinContainer)
    ) {
      return;
    }

    coinContainer.classList.add("coin-with-value");
    const fireContainer = this.createCoinFire(coinContainer);

    const isElementValid = () => {
      return (
        coinContainer &&
        coinContainer.parentNode &&
        document.body.contains(coinContainer)
      );
    };

    const timeline = gsap.timeline({
      delay: index * CONFIG.SLOT_MACHINE.COIN_ANIMATION.DELAY_MULTIPLIER,
      paused: true,
      onStart: () => {
        if (!isElementValid()) {
          timeline.kill();
          return;
        }
        this.createCoinSparks(coinContainer);
      },
    });

    const startAnimation = () => {
      if (isElementValid()) {
        playSound(sound7Url, true);
        timeline.play();
      }
    };

    const audio = playSound(sound7Url, false);
    if (audio) {
      if (audio.readyState >= 2) {
        this.resources.setTimeout(
          startAnimation,
          index * CONFIG.SLOT_MACHINE.COIN_ANIMATION.DELAY_MULTIPLIER * 1000
        );
      } else {
        audio.addEventListener(
          "canplaythrough",
          () => {
            this.resources.setTimeout(
              startAnimation,
              index * CONFIG.SLOT_MACHINE.COIN_ANIMATION.DELAY_MULTIPLIER * 1000
            );
          },
          { once: true }
        );
      }
    } else {
      this.resources.setTimeout(
        startAnimation,
        index * CONFIG.SLOT_MACHINE.COIN_ANIMATION.DELAY_MULTIPLIER * 1000
      );
    }

    this.addCoinFireAnimation(timeline, fireContainer);
    this.addCoinScaleAnimation(timeline, coinContainer, fireContainer);
  }

  createCoinFire(coinContainer) {
    const flames = Array.from({ length: 3 }, () =>
      DOMUtils.createElement("div", {
        className: "flame coin-flame",
      })
    );
    const smokes = Array.from({ length: 8 }, () =>
      DOMUtils.createElement("div", {
        className: "smoke",
      })
    );
    const fireContainer = DOMUtils.createElement("div", {
      className: "volcano-fire-container",
      style: `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 180%;
      height: 180%;
      pointer-events: none;
      z-index: -1;
      opacity: 0;
      overflow: visible;
      filter: blur(8px);
      `,
      children: [...flames, ...smokes],
    });
    coinContainer.appendChild(fireContainer);
    return fireContainer;
  }

  createCoinSparks(coinContainer) {
    const center = CalculationUtils.getElementCenter(coinContainer);

    if (!this.canCreateSparks()) return;

    const canvasPos = this.getCanvasPosition(center);
    const container = this.createSparksContainer();
    const sparks = this.createSparksFromPool(
      canvasPos,
      CONFIG.COIN_SPARKS.COUNT
    );

    this.animateSparks(sparks, canvasPos, container);
    this.scheduleContainerCleanup(container, CONFIG.COIN_SPARKS.CLEANUP_DELAY);
  }

  canCreateSparks() {
    return (
      this.sparklesApp &&
      this.sparklesApp.stage &&
      this.sparklesApp.view &&
      this.sparkPool
    );
  }

  getCanvasPosition(center) {
    const canvasRect = this.sparklesApp.view.getBoundingClientRect();

    return {
      x: center.x - canvasRect.left,
      y: center.y - canvasRect.top,
    };
  }

  createSparksContainer() {
    const container = new PIXI.Container();
    this.sparklesApp.stage.addChild(container);
    return container;
  }

  createSparksFromPool(position, count) {
    const sparks = [];

    for (let i = 0; i < count; i++) {
      const spark = this.getSparkFromPool();
      if (!spark) continue;

      this.initializeSpark(spark, position, i, count);
      sparks.push(spark);
    }

    return sparks;
  }

  getSparkFromPool() {
    if (!this.sparkPool) return null;

    const sprite = this.sparkPool.pool.find((s) => !s.visible);
    if (sprite) {
      this.sparkPool.active.add(sprite);
      sprite.visible = true;
      return sprite;
    }
    return null;
  }

  releaseSparkToPool(sprite) {
    if (!this.sparkPool || !sprite) return;

    sprite.visible = false;
    sprite.alpha = 1;
    sprite.scale.set(1);
    this.sparkPool.active.delete(sprite);
  }

  initializeSpark(spark, position, index, totalCount) {
    const angle =
      (Math.PI * 2 * index) / totalCount +
      (Math.random() - 0.5) * CONFIG.COIN_SPARKS.ANGLE_VARIATION;
    const size = CalculationUtils.randomRange(
      CONFIG.COIN_SPARKS.MIN_SIZE,
      CONFIG.COIN_SPARKS.MAX_SIZE
    );

    spark.scale.set(size);
    spark.x = position.x;
    spark.y = position.y;
    spark.zIndex = -1;

    spark._targetAngle = angle;
    spark._targetDistance = CalculationUtils.randomRange(
      CONFIG.COIN_SPARKS.MIN_DISTANCE,
      CONFIG.COIN_SPARKS.MAX_DISTANCE
    );
  }

  animateSparks(sparks, position, container) {
    sparks.forEach((spark) => {
      if (!spark || !spark.transform) {
        return;
      }

      container.addChild(spark);

      const targetX =
        position.x + Math.cos(spark._targetAngle) * spark._targetDistance;
      const targetY =
        position.y + Math.sin(spark._targetAngle) * spark._targetDistance;
      const duration = CalculationUtils.randomRange(
        CONFIG.COIN_SPARKS.MIN_DURATION,
        CONFIG.COIN_SPARKS.MAX_DURATION
      );

      const isSparkValid = () => {
        return (
          spark &&
          spark.transform &&
          spark.transform.position &&
          spark.transform.scale &&
          !spark.destroyed &&
          spark.parent
        );
      };

      if (!isSparkValid()) {
        this.releaseSparkToPool(spark);
        return;
      }

      const startX = spark.x;
      const startY = spark.y;
      const startAlpha = spark.alpha;

      const animTarget = { progress: 0 };

      const animation = gsap.to(animTarget, {
        progress: 1,
        duration,
        ease: "power2.out",
        onUpdate: function () {
          if (!isSparkValid()) {
            this.kill();
            return;
          }

          const progress = animTarget.progress;
          const easeProgress = gsap.parseEase("power2.out")(progress);

          if (spark.transform && spark.transform.position) {
            spark.x = startX + (targetX - startX) * easeProgress;
            spark.y = startY + (targetY - startY) * easeProgress;
          }

          spark.alpha = startAlpha * (1 - easeProgress);

          if (spark.transform && spark.transform.scale) {
            const scaleValue = 1 - easeProgress;
            spark.scale.set(scaleValue);
          }
        },
        onComplete: () => {
          if (isSparkValid() && spark.parent) {
            spark.parent.removeChild(spark);
          }
          this.releaseSparkToPool(spark);
        },
      });

      this.resources.registerAnimation(animation);
    });
  }

  scheduleContainerCleanup(container, delay) {
    this.resources.setTimeout(() => {
      if (container.parent) {
        container.parent.removeChild(container);
        container.destroy({ children: true });
      }
    }, delay);
  }

  addCoinFireAnimation(timeline, fireContainer) {
    timeline.to(
      fireContainer,
      {
        opacity: 1,
        duration: CONFIG.SLOT_MACHINE.COIN_ANIMATION.FIRE_OPACITY_DURATION,
        ease: "power2.out",
      },
      0
    );
  }

  addCoinScaleAnimation(timeline, coinContainer, fireContainer) {
    if (
      !coinContainer ||
      !coinContainer.parentNode ||
      !document.body.contains(coinContainer)
    ) {
      return;
    }

    gsap.killTweensOf(coinContainer, "scale");

    const currentScale = gsap.getProperty(coinContainer, "scale");
    if (
      currentScale === null ||
      currentScale === undefined ||
      isNaN(currentScale)
    ) {
      gsap.set(coinContainer, { scale: 1 });
    }

    const isElementValid = () => {
      return (
        coinContainer &&
        coinContainer.parentNode &&
        document.body.contains(coinContainer)
      );
    };

    timeline.to(coinContainer, {
      scale: CONFIG.SLOT_MACHINE.COIN_ANIMATION.SCALE_UP_VALUE,
      duration: CONFIG.SLOT_MACHINE.COIN_ANIMATION.SCALE_UP_DURATION,
      ease: CONFIG.SLOT_MACHINE.COIN_ANIMATION.EASE_BACK_OUT,
      onStart: () => {
        if (!isElementValid()) {
          timeline.kill();
        }
      },
      onUpdate: function () {
        if (!isElementValid()) {
          this.kill();
        }
      },
    });

    timeline.to(coinContainer, {
      scale: 1,
      duration: CONFIG.SLOT_MACHINE.COIN_ANIMATION.SCALE_DOWN_DURATION,
      ease: CONFIG.SLOT_MACHINE.COIN_ANIMATION.EASE_BACK_IN,
      onStart: () => {
        if (!isElementValid()) {
          timeline.kill();
        }
      },
      onUpdate: function () {
        if (!isElementValid()) {
          this.kill();
        }
      },
      onComplete: () => {
        if (isElementValid()) {
          coinContainer.classList.remove("coin-with-value");
        }
      },
    });

    timeline.to(
      fireContainer,
      {
        opacity: 0,
        duration: CONFIG.SLOT_MACHINE.COIN_ANIMATION.FIRE_FADE_DURATION,
        ease: "power2.out",
        onComplete: () => {
          if (fireContainer.parentNode) {
            fireContainer.parentNode.removeChild(fireContainer);
          }
        },
      },
      `-=${CONFIG.SLOT_MACHINE.COIN_ANIMATION.FIRE_FADE_DURATION}`
    );
  }
}
