import { sdk } from "@smoud/playable-sdk";
import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { DOMUtils } from "./utils/dom.js";
import { CalculationUtils } from "./utils/calculation.js";
import { EventUtils } from "./utils/event.js";
import { playSound } from "./utils/audio.js";
import { ResourceManager } from "./classes/ResourceManager.js";
import { SlotMachine } from "./classes/SlotMachine.js";
import { CONFIG } from "./config.js";
import { SparklesManager } from "./features/sparkles/SparklesManager.js";
import { FogEffect } from "./features/sparkles/FogEffect.js";
import { ChestManager } from "./features/chest/ChestManager.js";
import { ChestAnimations } from "./features/chest/ChestAnimations.js";
import { ChestCoins } from "./features/chest/ChestCoins.js";
import { CursorManager } from "./features/cursor/CursorManager.js";

const spritesheetUrl = "/spritesheets/spritesheet_2.png";
const backgroundUrl = "/backgrounds/bg_01.png";
const sound5Url = "/sounds/sound_5.mp3";

export class Game {
  constructor(width, height) {
    this.width = width || window.innerWidth;
    this.height = height || window.innerHeight;
    this.isPaused = false;
    this.currentVolume = 1.0;

    this.loadingScreen = document.getElementById("loading-screen");
    this.chestScreen = document.getElementById("chest-screen");
    this.progressBar = document.getElementById("progress-bar");
    this.chestWrappers = document.querySelectorAll(".chest-wrapper");
    this.customCursor = document.getElementById("custom-cursor");

    this.isLoaded = false;
    this.loadingApp = null;
    this.chestApp = null;
    this.chestAnimationApps = {};
    this.resources = new ResourceManager();

    if (!window._globalCursorMouse) {
      window._globalCursorMouse = { x: 0, y: 0 };
    }

    this.eventListeners = {
      resize: null,
      mousemove: null,
      mouseleave: null,
      preventSelection: null,
      chestWrappers: [],
    };

    this.sparklesManager = new SparklesManager(this.resources);
    this.chestManager = new ChestManager(
      this.resources,
      Array.from(this.chestWrappers),
      this.eventListeners,
      (index) => this.selectChest(index)
    );
    this.chestAnimations = new ChestAnimations(
      this.resources,
      this.chestAnimationApps
    );
    this.chestCoins = new ChestCoins(this.resources);
    this.cursorManager = new CursorManager(this.resources, this.customCursor);

    this.init();
  }

  async init() {
    this.preventSelection();
    await this.setupPixiApplications();
    this.loadAssets();
  }

  preventSelection() {
    const preventSelect = (e) => {
      e.preventDefault();
      return false;
    };

    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    const preventDrag = (e) => {
      e.preventDefault();
      return false;
    };

    const preventMultiTouch = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const selectstartListener = EventUtils.addEventListener(
      document,
      "selectstart",
      preventSelect,
      { passive: false }
    );
    const contextmenuListener = EventUtils.addEventListener(
      document,
      "contextmenu",
      preventContextMenu,
      { passive: false }
    );
    const dragstartListener = EventUtils.addEventListener(
      document,
      "dragstart",
      preventDrag,
      { passive: false }
    );
    const touchstartListener = EventUtils.addEventListener(
      document,
      "touchstart",
      preventMultiTouch,
      { passive: false }
    );

    this.eventListeners.preventSelection = [
      selectstartListener,
      contextmenuListener,
      dragstartListener,
      touchstartListener,
    ];
  }

  async setupPixiApplications() {
    const loadingCanvas = document.getElementById("sparkles-canvas");
    if (loadingCanvas) {
      this.loadingApp = new PIXI.Application({
        view: loadingCanvas,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });
      this.resources.registerPixiApp(this.loadingApp);
    }

    const chestCanvas = document.getElementById("sparkles-canvas-chest");
    if (chestCanvas) {
      this.chestApp = new PIXI.Application({
        view: chestCanvas,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });
      this.resources.registerPixiApp(this.chestApp);
    }

    const handleResize = () => {
      if (this.loadingApp && this.loadingApp.renderer) {
        this.loadingApp.renderer.resize(window.innerWidth, window.innerHeight);
      }
      if (this.chestApp && this.chestApp.renderer) {
        this.chestApp.renderer.resize(window.innerWidth, window.innerHeight);
      }
    };

    const resizeListener = EventUtils.addEventListener(
      window,
      "resize",
      handleResize
    );
    this.eventListeners.resize = resizeListener;
  }

  loadAssets() {
    PIXI.Assets.addBundle("gameAssets", {
      chestOpenSheet: spritesheetUrl,
      background: backgroundUrl,
    });

    PIXI.Assets.loadBundle("gameAssets", (progress) => {
      const percent = progress * 100;
      this.updateProgress(percent);
    })
      .then((bundle) => {
        this.loadedAssets = bundle;
        this.onAssetsLoaded();
      })
      .catch((error) => {
        this.onAssetsLoaded();
      });
  }

  updateProgress(percent) {
    if (this.progressBar) {
      this.progressBar.style.width = `${percent}%`;
    }
  }

  async onAssetsLoaded() {
    this.updateProgress(100);

    const { preloadAudio } = await import("./utils/audio.js");
    const sound1Url = "/sounds/sound_1.mp3";
    const sound2Url = "/sounds/sound_2.mp3";
    const sound3Url = "/sounds/sound_3.mp3";
    const sound4Url = "/sounds/sound_4.mp3";

    preloadAudio(sound1Url);
    preloadAudio(sound2Url);
    preloadAudio(sound3Url);
    preloadAudio(sound4Url);
    preloadAudio(sound5Url);

    this.resources.setTimeout(() => {
      this.startSparklesAnimation();
      this.resources.setTimeout(() => {
        this.showChestScreen();

        if (typeof sdk !== "undefined" && sdk.start) {
          sdk.start();
        }
      }, CONFIG.TIMING.SPARKLES_DELAY);
    }, CONFIG.TIMING.LOADING_DELAY);
  }

  handleResize(width, height) {
    this.width = width;
    this.height = height;

    if (this.loadingApp?.renderer) {
      this.loadingApp.renderer.resize(width, height);
    }
    if (this.chestApp?.renderer) {
      this.chestApp.renderer.resize(width, height);
    }
    if (this.slotMachine?.sparklesApp?.renderer) {
      this.slotMachine.sparklesApp.renderer.resize(width, height);
    }
  }

  pause() {
    this.isPaused = true;

    gsap.globalTimeline.pause();

    if (this.loadingApp?.ticker) {
      this.loadingApp.ticker.stop();
    }
    if (this.chestApp?.ticker) {
      this.chestApp.ticker.stop();
    }
    if (this.slotMachine?.sparklesApp?.ticker) {
      this.slotMachine.sparklesApp.ticker.stop();
    }
  }

  resume() {
    this.isPaused = false;

    gsap.globalTimeline.resume();

    if (this.loadingApp?.ticker) {
      this.loadingApp.ticker.start();
    }
    if (this.chestApp?.ticker) {
      this.chestApp.ticker.start();
    }
    if (this.slotMachine?.sparklesApp?.ticker) {
      this.slotMachine.sparklesApp.ticker.start();
    }
  }

  setVolume(level) {
    this.currentVolume = level;
  }

  onFinish() {
    this.destroy();
  }

  startSparklesAnimation() {
    if (!this.loadingApp || !this.chestApp) return;

    const colors = CONFIG.SPARKLES.COLORS;

    const loadingSparkles = this.sparklesManager.createSparklesContainer(
      this.loadingApp,
      CONFIG.PARTICLES.SPARKLE_COUNT,
      colors
    );

    const chestSparkles = this.sparklesManager.createSparklesContainer(
      this.chestApp,
      CONFIG.PARTICLES.SPARKLE_COUNT,
      colors
    );

    FogEffect.createFogEffect(this.loadingApp);
    FogEffect.createFogEffect(this.chestApp);

    const sparklesData = { loadingSparkles, chestSparkles };
    const animationState = this.sparklesManager.createSparklesAnimationState();

    const screenCheckers = {
      isLoadingScreenActive: () => this.isLoadingScreenActive(),
      isChestScreenActive: () => this.isChestScreenActive(),
      isSlotMachineScreenActive: () => this.isSlotMachineScreenActive(),
      loadingApp: this.loadingApp,
      chestApp: this.chestApp,
    };

    const slotMachineSparklesUpdater = () => this.updateSlotMachineSparkles();

    this.sparklesManager.startSparklesAnimationLoop(
      sparklesData,
      animationState,
      screenCheckers,
      slotMachineSparklesUpdater
    );
  }

  isLoadingScreenActive() {
    return (
      this.loadingScreen?.classList.contains("active") &&
      this.loadingApp &&
      this.loadingApp.renderer &&
      !this.loadingApp.renderer.destroyed
    );
  }

  isChestScreenActive() {
    return (
      this.chestScreen?.classList.contains("active") &&
      this.chestApp &&
      this.chestApp.renderer &&
      !this.chestApp.renderer.destroyed
    );
  }

  isSlotMachineScreenActive() {
    return (
      this.slotMachine &&
      !this.slotMachine.isDestroyed &&
      this.slotMachine.sparklesApp &&
      this.slotMachine.sparklesData &&
      this.slotMachine.sparklesApp.renderer &&
      !this.slotMachine.sparklesApp.renderer.destroyed &&
      this.slotMachine.screen &&
      document.body.contains(this.slotMachine.screen)
    );
  }

  updateSlotMachineSparkles() {
    if (
      this.slotMachine &&
      !this.slotMachine.isDestroyed &&
      this.slotMachine.sparklesApp &&
      this.slotMachine.sparklesApp.renderer &&
      !this.slotMachine.sparklesApp.renderer.destroyed
    ) {
      this.sparklesManager.updateSparkles(
        this.slotMachine.sparklesData,
        this.slotMachine.sparklesApp
      );
      this.slotMachine.sparklesApp.renderer.render(
        this.slotMachine.sparklesApp.stage
      );
    }
  }

  showChestScreen() {
    this.resources.requestAnimationFrame(() => {
      if (this.loadingScreen) {
        this.loadingScreen.classList.remove("active");
      }
      if (this.chestScreen) {
        this.chestScreen.classList.add("active");
      }
      this.isLoaded = true;

      this.chestManager.setupInteractions();
      this.cursorManager.initialize();
      this.setupClickTracking();
      this.chestManager.startPulseAnimation();
    });

    const winCount = CalculationUtils.randomRange(1, 2);
    const indices = [0, 1, 2];
    for (let i = 0; i < winCount; i++) {
      const randomIndex = CalculationUtils.randomRange(0, indices.length - 1);
      const winIndex = indices.splice(randomIndex, 1)[0];
      this.chestManager.winningChests.push(winIndex);
      const winAmount = CalculationUtils.randomRange(
        CONFIG.WIN.MIN_LARGE,
        CONFIG.WIN.MAX_LARGE
      );
      this.chestManager.winAmounts[winIndex] = winAmount;
    }
  }

  setupClickTracking() {
    CONFIG.TRACKING.CLICKABLE_ELEMENTS.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        const handler = () => {};
        const listener = EventUtils.addEventListener(el, "click", handler);
        const existingEntry = this.eventListeners.chestWrappers.find(
          (entry) => entry.wrapper === el || entry.element === el
        );
        if (!existingEntry) {
          this.eventListeners.chestWrappers.push({
            wrapper: el,
            handlers: [listener],
          });
        } else {
          existingEntry.handlers.push(listener);
        }
      });
    });
  }

  selectChest(index) {
    this.chestManager.selectChest(index, (chestIndex, wrapper) => {
      this.showWinAmount(wrapper, chestIndex);

      this.animateChestOpening(chestIndex, () => {
        wrapper.classList.add("opened");

        this.resources.setTimeout(() => {
          this.chestWrappers.forEach((w, i) => {
            if (i !== chestIndex) {
              this.chestManager.openDimmedChest(w);
              if (this.chestManager.winningChests.includes(i)) {
                w.classList.add("win");
                this.showWinAmount(w, i);
              } else {
                if (!this.chestManager.winAmounts[i]) {
                  const smallAmount = CalculationUtils.randomRange(
                    CONFIG.WIN.MIN_SMALL,
                    CONFIG.WIN.MAX_SMALL
                  );
                  this.chestManager.winAmounts[i] = smallAmount;
                }
                w.classList.add("win");
                this.showWinAmount(w, i);
              }
            }
          });

          this.resources.setTimeout(() => {
            this.animateChestsFlyAway();
          }, CONFIG.TIMING.CHEST_OPEN_DELAY + 500);
        }, CONFIG.TIMING.CHEST_OPEN_DELAY);
      });
    });
  }

  async animateChestOpening(index, onComplete) {
    const wrapper = this.chestWrappers[index];
    await this.chestAnimations.animateOpening(
      index,
      wrapper,
      this.loadedAssets,
      onComplete,
      () => {
        this.createChestCoinExplosion(
          wrapper,
          this.chestAnimationApps[index],
          wrapper.querySelector(".chest-animation-canvas")
        );
      }
    );
  }

  async createChestCoinExplosion(wrapper, app, canvas) {
    await this.chestCoins.createExplosion(wrapper, app, canvas);
  }

  animateChestsFlyAway() {
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
      this.transitionToSlotMachine();
    }, maxDelay * 1000 + 500);
  }

  async transitionToSlotMachine() {
    await this.fadeOutChestsContainer();
    await this.cleanupChestSparkles();
    await this.setupSlotMachineUI();
    await this.prepareSlotMachineScreen();
    await this.animateSlotMachinePanels();
    await this.startSlotMachineSpin();
  }

  async fadeOutChestsContainer() {
    await gsap.to(".chests-container", {
      opacity: 0,
      duration: CONFIG.TIMING.TRANSITION_FADE_DURATION,
    });
  }

  async cleanupChestSparkles() {
    await this.waitForTransitionCleanup();
    if (this.chestScreen) {
      this.chestScreen.classList.remove("active");
    }
  }

  async waitForTransitionCleanup() {
    await new Promise((resolve) => {
      this.resources.setTimeout(
        resolve,
        CONFIG.TIMING.TRANSITION_CLEANUP_DELAY
      );
    });
  }

  async prepareSlotMachineScreen() {
    const chestSparklesCanvas = this.chestScreen?.querySelector(
      "#sparkles-canvas-chest"
    );
    const slotScreen = document.querySelector(".slot-machine-screen");

    if (!slotScreen) {
      return;
    }

    this.cleanupChestSparklesCanvas(chestSparklesCanvas);
    this.setupSlotSparklesCanvas(slotScreen);
  }

  cleanupChestSparklesCanvas(chestSparklesCanvas) {
    if (!chestSparklesCanvas) return;

    if (chestSparklesCanvas._pixiApp) {
      const oldApp = chestSparklesCanvas._pixiApp;
      if (oldApp.ticker && oldApp.ticker.started) {
        oldApp.ticker.stop();
      }
      if (oldApp.stage) {
        oldApp.stage.removeChildren();
        oldApp.stage.destroy({ children: true });
      }
      if (oldApp.renderer && !oldApp.renderer.destroyed) {
        oldApp.renderer.destroy(true);
      }
      try {
        oldApp.destroy(true, { children: true });
      } catch (e) {}
      chestSparklesCanvas._pixiApp = null;
    }

    chestSparklesCanvas.remove();
  }

  setupSlotSparklesCanvas(slotScreen) {
    if (!slotScreen) return;

    const slotSparklesCanvas = slotScreen.querySelector(
      "#sparkles-canvas-slot"
    );
    if (!slotSparklesCanvas) {
      const newCanvas = DOMUtils.createElement("canvas", {
        id: "sparkles-canvas-slot",
        className: "sparkles-canvas",
      });
      slotScreen.insertBefore(newCanvas, slotScreen.firstChild);
    }
  }

  async setupSlotMachineUI() {
    if (!this.slotMachine) {
      this.slotMachine = new SlotMachine();
    }

    if (
      !this.slotMachine.screen ||
      !document.body.contains(this.slotMachine.screen)
    ) {
      await this.slotMachine.init();
    }

    const slotScreen = document.querySelector(".slot-machine-screen");

    this.createSlotMachineBackground(slotScreen);
    this.initializeSlotMachinePanels(slotScreen);
    await this.waitForSlotGridImage(slotScreen);
  }

  createSlotMachineBackground(slotScreen) {
    if (!slotScreen) return;

    let bgContainer = slotScreen.querySelector(".background-container");
    if (!bgContainer) {
      const bgImage = DOMUtils.createImage({
        src: "backgrounds/bg_01.png",
        alt: "Background",
        className: "background-image",
      });

      const blurOverlay = DOMUtils.createElement("div", {
        className: "blur-overlay",
      });

      bgContainer = DOMUtils.createElement("div", {
        className: "background-container",
        style: { opacity: "1" },
        children: [bgImage, blurOverlay],
      });

      slotScreen.insertBefore(bgContainer, slotScreen.firstChild);
    }
  }

  initializeSlotMachinePanels(slotScreen) {
    if (!slotScreen) return;

    const leftPanel = slotScreen.querySelector(".left-panel");
    const centerPanel = slotScreen.querySelector(".slot-machine-center");
    const rightPanel = slotScreen.querySelector(".right-panel");

    if (leftPanel) {
      leftPanel.style.transform = "translateX(-100vw)";
      leftPanel.style.opacity = "0";
      gsap.set(leftPanel, { x: "-100vw", opacity: 0, immediateRender: true });
    }
    if (centerPanel) {
      centerPanel.style.transform = "translateY(100vh)";
      centerPanel.style.opacity = "0";
      gsap.set(centerPanel, {
        y: "100vh",
        opacity: 0,
        immediateRender: true,
      });
    }
    if (rightPanel) {
      rightPanel.style.transform = "translateX(100vw)";
      rightPanel.style.opacity = "0";
      gsap.set(rightPanel, { x: "100vw", opacity: 0, immediateRender: true });
    }
  }

  async waitForSlotGridImage(slotScreen) {
    if (!slotScreen) return;

    const fieldImage = slotScreen.querySelector(".slot-frame");
    const slotGrid = slotScreen.querySelector(".slot-grid");

    if (slotGrid) {
      gsap.set(slotGrid, { opacity: 0, visibility: "hidden" });
    }

    if (fieldImage) {
      await this.waitForImageLoad(fieldImage);
    }

    if (slotGrid) {
      gsap.set(slotGrid, { opacity: 1, visibility: "visible" });
    }
  }

  waitForImageLoad(img) {
    return new Promise((resolve) => {
      if (img.complete && img.naturalHeight !== 0) {
        resolve();
      } else {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      }
    });
  }

  async animateSlotMachinePanels() {
    const slotScreen = document.querySelector(".slot-machine-screen");
    if (!slotScreen) return;

    const leftPanel = slotScreen.querySelector(".left-panel");
    const centerPanel = slotScreen.querySelector(".slot-machine-center");
    const rightPanel = slotScreen.querySelector(".right-panel");

    if (leftPanel) gsap.set(leftPanel, { x: "-100vw", opacity: 0 });
    if (centerPanel) gsap.set(centerPanel, { y: "100vh", opacity: 0 });
    if (rightPanel) gsap.set(rightPanel, { x: "100vw", opacity: 0 });

    playSound(sound5Url);

    const timeline = this.createPanelAnimationTimeline(
      leftPanel,
      centerPanel,
      rightPanel
    );

    await timeline;
    this.resources.registerAnimation(timeline);
  }

  createPanelAnimationTimeline(leftPanel, centerPanel, rightPanel) {
    const config = CONFIG.TRANSITION.PANEL_ANIMATION;
    const timeline = gsap.timeline();

    timeline.to(
      leftPanel,
      {
        x: 0,
        opacity: 1,
        duration: CONFIG.UI_ANIMATION.ENTRY_FROM_LEFT_DURATION,
        ease: "power2.out",
      },
      config.LEFT_DELAY
    );

    timeline.to(
      centerPanel,
      {
        y: 0,
        opacity: 1,
        duration: CONFIG.UI_ANIMATION.ENTRY_FROM_BOTTOM_DURATION,
        ease: "power2.out",
      },
      config.CENTER_DELAY
    );

    timeline.to(
      rightPanel,
      {
        x: 0,
        opacity: 1,
        duration: CONFIG.UI_ANIMATION.ENTRY_FROM_RIGHT_DURATION,
        ease: "power2.out",
      },
      config.RIGHT_DELAY
    );

    return timeline;
  }

  async startSlotMachineSpin() {
    await new Promise((resolve) => {
      this.resources.setTimeout(resolve, CONFIG.CTA.INSTALL_DELAY);
    });
    await this.slotMachine.spin();
  }

  showWinAmount(wrapper, chestIndex) {
    const winAmountElement = wrapper.querySelector(".win-amount");
    if (winAmountElement && this.chestManager.winAmounts[chestIndex]) {
      const amount = this.chestManager.winAmounts[chestIndex];

      winAmountElement.textContent = "";

      if (typeof amount === "string") {
        const parts = amount.split(" FREE SPINS");
        if (parts.length === 2) {
          winAmountElement.textContent = parts[0];
          const br = DOMUtils.createElement("br");
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

  removeEventListeners() {
    if (this.eventListeners.resize) {
      if (this.eventListeners.resize.remove) {
        this.eventListeners.resize.remove();
      } else {
        window.removeEventListener("resize", this.eventListeners.resize);
      }
      this.eventListeners.resize = null;
    }

    if (this.eventListeners.mousemove) {
      if (this.eventListeners.mousemove.remove) {
        this.eventListeners.mousemove.remove();
      } else {
        document.removeEventListener(
          "mousemove",
          this.eventListeners.mousemove
        );
      }
      this.eventListeners.mousemove = null;
    }
    if (this.eventListeners.mouseleave) {
      if (this.eventListeners.mouseleave.remove) {
        this.eventListeners.mouseleave.remove();
      } else {
        document.removeEventListener(
          "mouseleave",
          this.eventListeners.mouseleave
        );
      }
      this.eventListeners.mouseleave = null;
    }

    if (this.eventListeners.preventSelection) {
      if (Array.isArray(this.eventListeners.preventSelection)) {
        this.eventListeners.preventSelection.forEach((listener) => {
          if (listener && listener.remove) {
            listener.remove();
          }
        });
      }
      this.eventListeners.preventSelection = null;
    }

    this.eventListeners.chestWrappers.forEach((entry) => {
      if (!entry) return;
      const wrapper = entry.wrapper || entry.element;
      if (entry.handlers && Array.isArray(entry.handlers)) {
        entry.handlers.forEach((handler) => {
          if (handler && handler.remove) {
            handler.remove();
          } else if (handler && handler.type && handler.handler && wrapper) {
            wrapper.removeEventListener(handler.type, handler.handler);
          }
        });
      }
    });
    this.eventListeners.chestWrappers = [];
  }

  destroy() {
    if (this.resources) {
      if (this.loadingApp) {
        this.resources.registerPixiApp(this.loadingApp);
      }
      if (this.chestApp) {
        this.resources.registerPixiApp(this.chestApp);
      }
      Object.values(this.chestAnimationApps).forEach((app) => {
        if (app) {
          this.resources.registerPixiApp(app);
        }
      });

      this.resources.destroy();
    }

    if (this.loadingApp) {
      try {
        if (this.loadingApp.ticker) {
          this.loadingApp.ticker.stop();
        }
        this.loadingApp.destroy(true, { children: true });
      } catch (e) {
        // ignore
      }
      this.loadingApp = null;
    }
    if (this.chestApp) {
      try {
        if (this.chestApp.ticker) {
          this.chestApp.ticker.stop();
        }
        this.chestApp.destroy(true, { children: true });
      } catch (e) {
        // ignore
      }
      this.chestApp = null;
    }
    Object.values(this.chestAnimationApps).forEach((app) => {
      try {
        if (app?.ticker) {
          app.ticker.stop();
        }
        app?.destroy(true, { children: true });
      } catch (e) {
        // ignore
      }
    });
    this.chestAnimationApps = {};

    this.removeEventListeners();

    if (this.slotMachine) {
      this.slotMachine.destroy();
      this.slotMachine = null;
    }

    if (import.meta.env.DEV) {
      const stats = this.resources?.getStats();
    }
  }
}
