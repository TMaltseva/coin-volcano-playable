import { gsap } from "gsap";
import { CONFIG } from "../../config.js";
import { DOMUtils } from "../../utils/dom.js";
import { AnimationUtils } from "../../utils/animation.js";
import { playSound } from "../../utils/audio.js";
import { VolcanoAnimations } from "./VolcanoAnimations.js";
import { CoinExplosion } from "./CoinExplosion.js";

const sound10Url = "/sounds/sound_10.mp3";

export class BigWinScreen {
  constructor(resources, screen, customCursor, sparklesApp, sparklesData) {
    this.resources = resources;
    this.screen = screen;
    this.customCursor = customCursor;
    this.sparklesApp = sparklesApp;
    this.sparklesData = sparklesData;
    this.volcanoAnimations = new VolcanoAnimations(resources);
    this.coinExplosion = new CoinExplosion(resources);
    this.bigWinVolcanoFunctions = [];
    this.bigWinExplosionApps = null;
    this.bigWinVolcanoTimers = [];
  }

  async show(balance, onComplete) {
    const bigWinData = this.prepareBigWinData(balance);
    this.updateCursorForBigWin();
    this.fadeOutPanels(bigWinData.panels);

    const explosionContainer = this.createExplosionContainer();
    const contentContainer = this.createContentContainer(bigWinData);

    const bigWinScreen = this.createBigWinScreen(
      explosionContainer,
      contentContainer
    );

    document.body.appendChild(bigWinScreen);
    explosionContainer.style.display = "none";

    await this.animateBigWinScreen(bigWinScreen, contentContainer, bigWinData);

    if (onComplete) {
      onComplete(bigWinData.targetBalance);
    }
  }

  prepareBigWinData(balance) {
    const balanceElement = this.screen.querySelector(".balance-amount");
    let currentBalance = balance;
    if (balanceElement) {
      const balanceText = balanceElement.textContent
        .replace(/\s/g, "")
        .replace("€", "")
        .replace(",", "");
      const parsed = parseInt(balanceText);
      if (!isNaN(parsed)) {
        currentBalance = parsed;
      }
    }
    const targetBalance = currentBalance + CONFIG.WIN.BIG_WIN_BONUS;
    const leftPanel = this.screen.querySelector(".left-panel");
    const centerPanel = this.screen.querySelector(".slot-machine-center");
    const rightPanel = this.screen.querySelector(".right-panel");

    return {
      balanceElement,
      currentBalance,
      targetBalance,
      panels: { leftPanel, centerPanel, rightPanel },
    };
  }

  updateCursorForBigWin() {
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (this.customCursor) {
      this.customCursor.style.display = isTouchDevice ? "none" : "block";
    }
  }

  fadeOutPanels(panels) {
    gsap.to([panels.leftPanel, panels.centerPanel, panels.rightPanel], {
      opacity: 0,
      duration: CONFIG.BIG_WIN_SCREEN.PANEL_FADE_DURATION,
      ease: "power2.in",
    });
  }

  createExplosionContainer() {
    const explosionCanvas = DOMUtils.createElement("canvas", {
      style: `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
      pointer-events: none;
      `,
    });
    explosionCanvas.width = CONFIG.BIG_WIN_SCREEN.EXPLOSION.CANVAS_SIZE;
    explosionCanvas.height = CONFIG.BIG_WIN_SCREEN.EXPLOSION.CANVAS_SIZE;
    explosionCanvas._pixiApp = null;

    return DOMUtils.createElement("div", {
      className: "big-win-explosion",
      style: `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${CONFIG.BIG_WIN_SCREEN.EXPLOSION.CONTAINER_SIZE};
      height: ${CONFIG.BIG_WIN_SCREEN.EXPLOSION.CONTAINER_HEIGHT};
      pointer-events: none;
      z-index: ${CONFIG.BIG_WIN_SCREEN.Z_INDEX.EXPLOSION};
      `,
      children: [explosionCanvas],
    });
  }

  createContentContainer(bigWinData) {
    const volcanoesContainer = this.createVolcanoesSection();
    const bigWinBanner = this.createBigWinBanner(bigWinData.currentBalance);

    return DOMUtils.createElement("div", {
      className: "big-win-content",
      style: `
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: ${CONFIG.BIG_WIN_SCREEN.CONTENT_GAP};
      z-index: ${CONFIG.BIG_WIN_SCREEN.Z_INDEX.CONTENT};
      pointer-events: none;
      `,
      children: [volcanoesContainer, bigWinBanner],
    });
  }

  createVolcanoesSection() {
    const glowElement = this.createGlowElement();
    const fireContainer = this.createFireContainer();
    const volcanoImg = this.createVolcanoImage();

    const volcanoWrapper = DOMUtils.createElement("div", {
      className: "three-volcanoes-wrapper",
      style: `
      position: relative;
      width: ${CONFIG.BIG_WIN_SCREEN.VOLCANO.WRAPPER_WIDTH};
      height: ${CONFIG.BIG_WIN_SCREEN.VOLCANO.WRAPPER_HEIGHT};
      display: flex;
      justify-content: center;
      align-items: center;
      transform: translateY(${CONFIG.BIG_WIN_SCREEN.VOLCANO.WRAPPER_TRANSFORM_Y});
      z-index: ${CONFIG.BIG_WIN_SCREEN.Z_INDEX.VOLCANOES_SECTION};
      `,
      children: [glowElement, fireContainer, volcanoImg],
    });

    this.volcanoAnimations.startAnimation(
      volcanoWrapper,
      volcanoImg,
      glowElement,
      fireContainer,
      (stopFunction) => {
        this.registerVolcanoAnimationStop(stopFunction);
      }
    );

    return DOMUtils.createElement("div", {
      className: "big-win-volcanoes",
      style: `
      position: absolute;
      top: 0px;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      pointer-events: none;
      `,
      children: [volcanoWrapper],
    });
  }

  createGlowElement() {
    const gradientStops = CONFIG.BIG_WIN_SCREEN.GLOW.GRADIENT_COLORS.map(
      (color, index) =>
        `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a}) ${CONFIG.BIG_WIN_SCREEN.GLOW.GRADIENT_STOPS[index]}`
    ).join(", ");

    return DOMUtils.createElement("div", {
      className: "volcano-glow",
      style: `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${CONFIG.BIG_WIN_SCREEN.VOLCANO.GLOW_SIZE};
      height: ${CONFIG.BIG_WIN_SCREEN.VOLCANO.GLOW_SIZE};
      border-radius: 50%;
      background: radial-gradient(
        ellipse at 50% 50%,
        ${gradientStops}
      );
      filter: blur(${CONFIG.BIG_WIN_SCREEN.VOLCANO.GLOW_BLUR});
      pointer-events: none;
      z-index: ${CONFIG.BIG_WIN_SCREEN.Z_INDEX.GLOW};
      opacity: 0;
      `,
    });
  }

  createFireContainer() {
    const flames = Array.from(
      { length: CONFIG.VOLCANO_ERUPTION.FLAME_COUNT },
      () => DOMUtils.createElement("div", { className: "flame" })
    );
    const smokes = Array.from(
      { length: CONFIG.VOLCANO_ERUPTION.SMOKE_COUNT },
      () => DOMUtils.createElement("div", { className: "smoke" })
    );

    return DOMUtils.createElement("div", {
      className: "volcano-fire-container",
      style: `
      position: absolute;
      top: ${CONFIG.BIG_WIN_SCREEN.VOLCANO.FIRE_TOP};
      left: 50%;
      transform: translateX(-50%) translateY(${CONFIG.BIG_WIN_SCREEN.VOLCANO.FIRE_TRANSLATE_Y});
      width: 100%;
      height: ${CONFIG.BIG_WIN_SCREEN.VOLCANO.FIRE_HEIGHT};
      pointer-events: none;
      z-index: ${CONFIG.BIG_WIN_SCREEN.Z_INDEX.FIRE};
      opacity: 0;
      overflow: visible;
      filter: blur(${CONFIG.BIG_WIN_SCREEN.VOLCANO.FIRE_BLUR});
      `,
      children: [...flames, ...smokes],
    });
  }

  createVolcanoImage() {
    const volcanoImg = DOMUtils.createImage({
      src: "ui/volcanoes/three-volcanoes.png",
      alt: "Three Volcanoes",
    });
    volcanoImg.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
      position: relative;
      z-index: ${CONFIG.BIG_WIN_SCREEN.Z_INDEX.VOLCANO_IMAGE};
      transform-origin: center center;
    `;
    return volcanoImg;
  }

  createBigWinBanner(currentBalance) {
    const bigWinImage = DOMUtils.createImage({
      src: "ui/billet/bigwin.png",
    });
    bigWinImage.style.cssText = `
      width: 100%;
      height: auto;
      object-fit: contain;
      display: block;
    `;

    const bigWinAmount = DOMUtils.createElement("div", {
      className: "big-win-amount",
      textContent: `${currentBalance.toLocaleString("ru-RU")} €`,
      style: `
      position: absolute;
      top: ${CONFIG.BIG_WIN_SCREEN.AMOUNT.TOP};
      left: 50%;
      transform: translateX(-50%) !important;
      font-family: 'The Logo Font', 'Arial Black', sans-serif;
      font-size: ${CONFIG.BIG_WIN_SCREEN.AMOUNT.FONT_SIZE};
      font-weight: 900;
      color: #ffffff;
      text-shadow: ${CONFIG.BIG_WIN_SCREEN.AMOUNT.TEXT_SHADOW};
      white-space: nowrap;
      pointer-events: none;
      text-align: center;
      z-index: ${CONFIG.BIG_WIN_SCREEN.Z_INDEX.BANNER};
      margin: 0;
      display: block;
      width: 100%;
      `,
    });

    const bigWinImageContainer = DOMUtils.createElement("div", {
      style: `
      position: relative;
      width: 100%;
      display: block;
      `,
      children: [bigWinImage, bigWinAmount],
    });

    return DOMUtils.createElement("div", {
      className: "big-win-banner",
      style: `
      position: absolute;
      top: ${CONFIG.BIG_WIN_SCREEN.BANNER.TOP};
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: ${CONFIG.BIG_WIN_SCREEN.BANNER.GAP};
      width: ${CONFIG.BIG_WIN_SCREEN.BANNER.WIDTH};
      margin-top: ${CONFIG.BIG_WIN_SCREEN.BANNER.MARGIN_TOP};
      `,
      children: [bigWinImageContainer],
    });
  }

  createBigWinScreen(explosionContainer, contentContainer) {
    return DOMUtils.createElement("div", {
      className: "big-win-screen",
      style: `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: ${CONFIG.BIG_WIN_SCREEN.Z_INDEX.SCREEN};
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.3);
      opacity: 0;
      `,
      children: [explosionContainer, contentContainer],
    });
  }

  async animateBigWinScreen(bigWinScreen, contentContainer, bigWinData) {
    gsap.set(bigWinScreen, {
      opacity: 0,
      scale: 0.95,
      transformOrigin: "center center",
    });

    gsap.set(contentContainer, {
      opacity: 0,
      scale: 0.95,
      transformOrigin: "center center",
    });

    gsap.to(bigWinScreen, {
      opacity: 1,
      scale: 1,
      duration: CONFIG.BIG_WIN_SCREEN.SCREEN_ANIMATION.DURATION,
      ease: CONFIG.BIG_WIN_SCREEN.SCREEN_ANIMATION.EASE,
    });

    await new Promise((resolve) => {
      this.resources.setTimeout(
        resolve,
        CONFIG.BIG_WIN_SCREEN.SCREEN_ANIMATION.CONTENT_DELAY
      );
    });

    gsap.to(contentContainer, {
      opacity: 1,
      scale: 1,
      duration: CONFIG.BIG_WIN_SCREEN.SCREEN_ANIMATION.CONTENT_DURATION,
      ease: CONFIG.BIG_WIN_SCREEN.SCREEN_ANIMATION.CONTENT_EASE,
    });

    const audio10 = playSound(sound10Url, false);
    if (audio10) {
      if (audio10.readyState >= 2) {
        audio10.currentTime = 0;
        const promise = audio10.play();
        if (promise !== undefined) {
          promise.catch(() => {
            // autoplay blocked - will be handled by SDK
          });
        }
      } else {
        audio10.addEventListener(
          "canplaythrough",
          () => {
            audio10.currentTime = 0;
            const promise = audio10.play();
            if (promise !== undefined) {
              promise.catch(() => {
                // autoplay blocked
              });
            }
          },
          { once: true }
        );
        if (audio10.readyState === 0) {
          audio10.load();
        }
      }
    }

    const bigWinAmount = contentContainer.querySelector(".big-win-amount");

    await this.animateBigWinBalance(bigWinAmount, bigWinData, contentContainer);
    await this.fadeOutBigWinScreen(bigWinScreen, bigWinData, contentContainer);
  }

  animateBigWinBalance(bigWinAmount, bigWinData, contentContainer) {
    return new Promise((resolve) => {
      gsap.to(bigWinAmount, {
        textContent: bigWinData.targetBalance,
        duration: CONFIG.BIG_WIN_SCREEN.BALANCE_ANIMATION.DURATION,
        snap: { textContent: 1 },
        ease: CONFIG.BIG_WIN_SCREEN.BALANCE_ANIMATION.EASE,
        onUpdate: function () {
          const value = Math.floor(this.targets()[0].textContent);
          bigWinAmount.textContent = value.toLocaleString("ru-RU") + " €";
        },
        onComplete: async () => {
          if (bigWinData.balanceElement) {
            bigWinData.balanceElement.textContent = `${bigWinData.targetBalance.toLocaleString(
              "ru-RU"
            )} €`;
          }

          await new Promise((resolve) => {
            this.resources.setTimeout(
              resolve,
              CONFIG.BIG_WIN_SCREEN.BALANCE_ANIMATION.WAIT_AFTER
            );
          });

          const bigWinBanner =
            contentContainer.querySelector(".big-win-banner");
          if (bigWinBanner) {
            gsap.set(bigWinBanner, { transformOrigin: "center center" });
            await new Promise((resolve) => {
              gsap.to(bigWinBanner, {
                scale: 1.2,
                duration: 0.3,
                ease: "back.out(1.7)",
                onComplete: resolve,
              });
            });
          }

          resolve();
        },
      });
    });
  }

  async fadeOutBigWinScreen(bigWinScreen, bigWinData, contentContainer) {
    return new Promise((resolve) => {
      const bigWinBanner = contentContainer?.querySelector(".big-win-banner");
      const volcanoesContainer =
        contentContainer?.querySelector(".big-win-volcanoes");

      const fadeOutTimeline = gsap.timeline({
        onComplete: () => {
          this.cleanup(bigWinScreen);
          this.restorePanelsAfterBigWin(bigWinData.panels);
          resolve();
        },
      });

      if (bigWinBanner && volcanoesContainer) {
        gsap.set([bigWinBanner, volcanoesContainer], {
          transformOrigin: "center center",
        });

        const bannerRect = bigWinBanner.getBoundingClientRect();
        const volcanoesRect = volcanoesContainer.getBoundingClientRect();
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;

        const bannerOffsetX =
          screenCenterX - (bannerRect.left + bannerRect.width / 2);
        const bannerOffsetY =
          screenCenterY - (bannerRect.top + bannerRect.height / 2);
        const volcanoesOffsetX =
          screenCenterX - (volcanoesRect.left + volcanoesRect.width / 2);
        const volcanoesOffsetY =
          screenCenterY - (volcanoesRect.top + volcanoesRect.height / 2);

        fadeOutTimeline.to(
          bigWinBanner,
          {
            scale: 0,
            x: bannerOffsetX,
            y: bannerOffsetY,
            duration: CONFIG.BIG_WIN_SCREEN.SCREEN_ANIMATION.FADE_OUT_DURATION,
            ease: CONFIG.BIG_WIN_SCREEN.SCREEN_ANIMATION.FADE_OUT_EASE,
          },
          0
        );

        fadeOutTimeline.to(
          volcanoesContainer,
          {
            scale: 0,
            x: volcanoesOffsetX,
            y: volcanoesOffsetY,
            duration: CONFIG.BIG_WIN_SCREEN.SCREEN_ANIMATION.FADE_OUT_DURATION,
            ease: CONFIG.BIG_WIN_SCREEN.SCREEN_ANIMATION.FADE_OUT_EASE,
          },
          0
        );
      }

      fadeOutTimeline.to(
        bigWinScreen,
        {
          opacity: 0,
          duration: CONFIG.BIG_WIN_SCREEN.SCREEN_ANIMATION.FADE_OUT_DURATION,
          ease: CONFIG.BIG_WIN_SCREEN.SCREEN_ANIMATION.FADE_OUT_EASE,
        },
        0
      );
    });
  }

  cleanup(bigWinScreen) {
    this.volcanoAnimations.stop();
    this.volcanoAnimations.cleanupExplosionApps();
    this.coinExplosion.cleanup();
    bigWinScreen.remove();
  }

  registerVolcanoAnimationStop(stopFunction) {
    if (!this.bigWinVolcanoFunctions) {
      this.bigWinVolcanoFunctions = [];
    }
    this.bigWinVolcanoFunctions.push({ stop: stopFunction });
  }

  restorePanelsAfterBigWin(panels) {
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (this.customCursor && isTouchDevice) {
      this.customCursor.style.display = "none";
    }

    gsap.to([panels.leftPanel, panels.centerPanel, panels.rightPanel], {
      opacity: 1,
      duration: CONFIG.BIG_WIN_SCREEN.PANEL_FADE_DURATION,
      ease: "power2.out",
    });

    if (this.sparklesApp && this.sparklesData) {
      if (this.sparklesApp.ticker && !this.sparklesApp.ticker.started) {
        this.sparklesApp.ticker.start();
      }
    }
  }
}
