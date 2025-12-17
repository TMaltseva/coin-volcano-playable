import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { ResourceManager } from "./ResourceManager.js";
import { CONFIG } from "../config.js";
import { DOMUtils } from "../utils/dom.js";
import { PIXIUtils } from "../utils/pixi.js";
import { AnimationUtils } from "../utils/animation.js";
import { CalculationUtils } from "../utils/calculation.js";
import { EventUtils } from "../utils/event.js";
import { AnimationPresets } from "../utils/animation.js";
import { playSound, playSoundSequentially } from "../utils/audio.js";

const coinSpritesheetUrl = "/spritesheets/spritesheet_5.png";
const sound1Url = "/sounds/sound_1.mp3";
const sound3Url = "/sounds/sound_3.mp3";
const sound7Url = "/sounds/sound_7.mp3";
const sound8Url = "/sounds/sound_8.mp3";
const sound9Url = "/sounds/sound_9.mp3";
const sound10Url = "/sounds/sound_10.mp3";
import { SlotUI } from "../features/slot/SlotUI.js";
import { SpinManager } from "../features/slot/SpinManager.js";
import { WinDetector } from "../features/slot/WinDetector.js";
import { SymbolManager } from "../features/slot/SymbolManager.js";
import { GridManager } from "../features/slot/GridManager.js";
import { BigWinScreen } from "../features/bigwin/BigWinScreen.js";
import { ZigzagOutline } from "../features/bigwin/ZigzagOutline.js";
import { JokerAnimations } from "../features/bigwin/JokerAnimations.js";
import { BigWinVolcanoManager } from "../features/bigwin/BigWinVolcanoManager.js";
import { JackpotCounter } from "../features/jackpot/JackpotCounter.js";
import { CursorManager } from "../features/cursor/CursorManager.js";
import { SparklesManager } from "../features/sparkles/SparklesManager.js";
import { SparklesSetup } from "../features/sparkles/SparklesSetup.js";
import { CoinEffects } from "../features/coins/CoinEffects.js";
import { VolcanoManager } from "../features/volcano/VolcanoManager.js";
import { UISetupManager } from "../features/ui/UISetupManager.js";
import { sdk } from "@smoud/playable-sdk";

export class SlotMachine {
  constructor() {
    this.isSpinning = false;
    this.isDestroyed = false;
    this.isFinished = false;
    this.eventListeners = [];
    this.coinParticles = [];
    this.freeSpins = 5;
    this.balance = 100;
    this.sparklesApp = null;
    this.sparklesData = null;
    this.sparkPool = null;
    this.customCursor = document.getElementById("custom-cursor");
    this.mouseX = window._globalCursorMouse?.x || 0;
    this.mouseY = window._globalCursorMouse?.y || 0;
    this.currentGrid = null;
    this.resources = new ResourceManager();

    this.slotUI = new SlotUI();
    this.gridManager = new GridManager();
    this.symbolManager = new SymbolManager();
    this.winDetector = new WinDetector();
    this.spinManager = new SpinManager(
      this.resources,
      this.symbolManager,
      this.winDetector,
      null
    );
    this.zigzagOutline = new ZigzagOutline(this.resources);
    this.jokerAnimations = new JokerAnimations(this.resources, null);
    this.bigWinVolcanoManager = new BigWinVolcanoManager(this.resources);
    this.bigWinScreen = null;
    this.jackpotCounter = null;
    this.cursorManager = new CursorManager(this.resources, this.customCursor);
    this.sparklesManager = new SparklesManager(this.resources);
    this.sparklesSetup = new SparklesSetup(this.resources);
    this.coinEffects = null;
    this.volcanoManager = new VolcanoManager(this.resources, null);
    this.uiSetupManager = new UISetupManager(
      this.resources,
      null,
      this.customCursor
    );
  }

  async init() {
    this.screen = this.slotUI.createSlotMachineUI();
    this.spinManager.screen = this.screen;
    this.jokerAnimations.screen = this.screen;
    this.volcanoManager.screen = this.screen;
    this.uiSetupManager.screen = this.screen;

    const { preloadAudio } = await import("../utils/audio.js");
    preloadAudio(sound7Url);
    // Preload BIG WIN sounds for iOS compatibility
    preloadAudio(sound8Url);
    preloadAudio(sound9Url);
    preloadAudio(sound10Url);
    this.uiSetupManager.setSpinCallback(() => this.spin());
    this.uiSetupManager.setWithdrawCallback(() =>
      this.triggerCTA("withdraw_clicked")
    );

    await this.sparklesSetup.setup();
    this.sparklesApp = this.sparklesSetup.getSparklesApp();
    this.sparklesData = this.sparklesSetup.getSparklesData();
    this.sparkPool = this.sparklesSetup.getSparkPool();
    this.coinEffects = new CoinEffects(
      this.resources,
      this.sparklesApp,
      this.sparkPool
    );

    this.fillInitialGrid();
    this.cursorManager.initialize();
    this.uiSetupManager.setupSpinButton();
    this.uiSetupManager.setupWithdrawButton();
    this.setupClickTracking();
    this.jackpotCounter = new JackpotCounter(this.resources, this.screen);
    this.jackpotCounter.startAnimation();
    await this.volcanoManager.setupVolcanoes();
    await this.volcanoManager.startEruptionAnimations();
    await this.uiSetupManager.setupCustomCursor();
  }

  fillInitialGrid() {
    if (!this.screen) {
      return;
    }

    const gridResult =
      this.currentGrid || this.gridManager.generateGridResult();
    this.currentGrid = gridResult;

    const columns = this.screen.querySelectorAll(".slot-column");

    let needsUpdate = false;
    if (columns.length > 0) {
      const firstColumn = columns[0];
      const firstCell = firstColumn.querySelector(".slot-cell");
      if (!firstCell || firstCell.innerHTML === "") {
        needsUpdate = true;
      }
    } else {
      needsUpdate = true;
    }

    if (needsUpdate) {
      columns.forEach((column, colIndex) => {
        const cells = column.querySelectorAll(".slot-cell");
        cells.forEach((cell, rowIndex) => {
          cell.replaceChildren();
          const symbol = this.symbolManager.createSymbol(
            gridResult[colIndex][rowIndex]
          );
          cell.appendChild(symbol);
        });
      });
    }
  }

  setupClickTracking() {
    CONFIG.TRACKING.CLICKABLE_ELEMENTS.forEach((selector) => {
      const elements = this.screen
        ? this.screen.querySelectorAll(selector)
        : document.querySelectorAll(selector);
      elements.forEach((el) => {
        const handler = () => {};
        const listener = EventUtils.addEventListener(el, "click", handler);
        this.eventListeners.push(listener);
      });
    });
  }

  triggerCTA(source) {
    this.isDestroyed = true;

    if (!this.isFinished && typeof sdk !== "undefined" && sdk.finish) {
      this.isFinished = true;
      sdk.finish();
    }

    if (typeof sdk !== "undefined" && sdk.install) {
      sdk.install();
    }

    const hasAdPlatform = !!(
      window.mraid ||
      window.Luna ||
      window.dapi ||
      window.gameplayApi
    );

    if (!hasAdPlatform) {
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const storeUrl = isIOS
        ? window.APP_STORE_URL || "https://apps.apple.com/app/coin-volcanoes"
        : window.GOOGLE_PLAY_URL ||
          "https://play.google.com/store/apps/details?id=com.coinvolcanoes";

      window.location.href = storeUrl;
    } else {
      this.showInstallOverlay();
    }

    this.destroy();
  }

  showInstallOverlay() {
    const spinner = DOMUtils.createElement("div", {
      className: "spinner",
    });

    const installText = DOMUtils.createElement("div", {
      className: "install-text",
      textContent: "Installing...",
    });

    const installContent = DOMUtils.createElement("div", {
      className: "install-content",
      children: [spinner, installText],
    });

    const overlay = DOMUtils.createElement("div", {
      className: "install-overlay",
      children: [installContent],
    });

    document.body.appendChild(overlay);

    gsap.from(overlay, {
      opacity: 0,
      duration: 0.3,
    });
  }

  async spin() {
    if (!this.canSpin()) return;

    const spinData = this.prepareSpin();
    if (!spinData) return;

    this.spinManager.setCurrentGrid(this.currentGrid);
    const allCoins = await this.animateAllColumns(spinData);
    this.currentGrid = this.spinManager.getCurrentGrid();

    if (!spinData.isLastSpin) {
      await this.coinEffects.processCoinsAfterSpin(allCoins);
    }

    await this.finalizeSpin(spinData);
  }

  canSpin() {
    return !this.isSpinning && this.freeSpins > 0;
  }

  prepareSpin() {
    playSoundSequentially(sound1Url, 1).catch((e) => {
      if (import.meta.env.DEV) {
        console.error("Error playing spin sound sequence:", e);
      }
    });

    this.isSpinning = true;
    if (this.uiSetupManager) {
      this.uiSetupManager.setIsSpinning(true);
    }
    this.updateSpinUI(true);

    this.freeSpins--;
    if (this.uiSetupManager) {
      this.uiSetupManager.setFreeSpins(this.freeSpins);
    }
    this.updateFreeSpinsDisplay();

    const columns = this.screen.querySelectorAll(".slot-column");
    const isLastSpin = this.freeSpins === 0;
    const previousGrid = this.currentGrid;
    const finalGrid = this.gridManager.generateGridResult(isLastSpin);

    return {
      columns,
      isLastSpin,
      previousGrid,
      finalGrid,
    };
  }

  updateSpinUI(disabled) {
    if (this.uiSetupManager) {
      this.uiSetupManager.updateSpinButton(disabled);
    }

    if (this.customCursor) {
      if (disabled) {
        this.customCursor.classList.remove("active");
      } else {
        this.restoreCursorState();
      }
    }
  }

  updateFreeSpinsDisplay() {
    if (this.uiSetupManager) {
      this.uiSetupManager.updateFreeSpinsDisplay(this.freeSpins);
    }
  }

  async animateAllColumns(spinData) {
    return await this.spinManager.animateAllColumns(spinData);
  }

  async finalizeSpin(spinData) {
    const coinsSum = this.symbolManager.calculateCoinsSum(spinData.finalGrid);
    this.balance += coinsSum;
    this.updateBalanceWithAnimation();
    this.currentGrid = spinData.finalGrid;

    if (spinData.isLastSpin) {
      await this.coinEffects.waitForSymbolAnimations();
    }

    const winResult = this.checkWin(spinData.finalGrid);
    if (winResult) {
      if (winResult.type === "BIG_WIN") {
        await this.showBigWin(winResult);
      } else {
        await this.showNormalWin(winResult);
      }
    }

    this.isSpinning = false;
    if (this.uiSetupManager) {
      this.uiSetupManager.setIsSpinning(false);
    }
    this.updateSpinUI(false);
  }

  restoreCursorState() {
    const hoveredElement = document.elementFromPoint(this.mouseX, this.mouseY);
    if (
      hoveredElement &&
      (hoveredElement.closest(".withdraw-button") ||
        hoveredElement.closest(".refresh-button") ||
        hoveredElement.closest(".balance-billboard") ||
        hoveredElement.closest(".free-spins-billboard") ||
        hoveredElement.closest(".jackpot-mini") ||
        hoveredElement.closest(".jackpot-major") ||
        hoveredElement.closest(".jackpot-minor"))
    ) {
      this.customCursor.classList.add("active");
    }
  }

  updateBalanceWithAnimation() {
    const balanceElement = this.screen.querySelector(".balance-amount");
    if (balanceElement) {
      const currentBalance =
        parseInt(balanceElement.textContent) || this.balance;

      gsap.to(balanceElement, {
        textContent: this.balance,
        duration: 1,
        snap: { textContent: 1 },
        ease: "power1.out",
        onUpdate: function () {
          const value = Math.floor(this.targets()[0].textContent);
          balanceElement.textContent = value.toLocaleString() + " €";
        },
      });
      const balanceAnim = gsap.to(balanceElement, {
        scale: 1.2,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut",
      });
      this.resources.registerAnimation(balanceAnim);
    }
  }

  checkWin(grid) {
    return this.winDetector.checkWin(grid);
  }

  async showBigWin(winResult) {
    const winningRow = winResult.row;

    await new Promise((resolve) => {
      this.resources.setTimeout(resolve, 200);
    });

    const jokerCells = this.screen.querySelectorAll(
      `.slot-cell[data-row="${winningRow}"]`
    );

    if (jokerCells.length === 0) {
      const allCells = this.screen.querySelectorAll(".slot-cell");
      const cellsByRow = Array.from(allCells).filter((cell, index) => {
        const row = Math.floor(index % CONFIG.SLOT_MACHINE.ROWS);
        return row === winningRow;
      });
      if (cellsByRow.length > 0) {
        const jokerCellsArray = Array.from(cellsByRow);
        await this.jokerAnimations.animate(jokerCellsArray);
        return;
      }
      return;
    }

    this.zigzagOutline.create(winningRow, this.screen);
    await new Promise((resolve) => {
      this.resources.setTimeout(resolve, 800);
    });
    await this.jokerAnimations.animate(Array.from(jokerCells));
    this.resources.setTimeout(() => {
      if (this.zigzagOutline) {
        this.zigzagOutline.destroy();
      }
      this.createBigWinCoinExplosion().catch((e) => {
        if (import.meta.env.DEV) {
          console.error("Error creating big win coin explosion:", e);
        }
      });
      this.resources.setTimeout(() => {
        this.showBigWinScreen();
      }, 100);
    }, 2000);
  }

  async showBigWinScreen() {
    if (!this.bigWinScreen) {
      this.bigWinScreen = new BigWinScreen(
        this.resources,
        this.screen,
        this.customCursor,
        this.sparklesApp,
        this.sparklesData
      );
    }
    await this.bigWinScreen.show(this.balance, (newBalance) => {
      this.balance = newBalance;
    });

    this.focusWithdrawButton();
  }

  async createBigWinCoinExplosion() {
    const coinTextures = await this.loadCoinTextures();
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const config = CONFIG.BIG_WIN_COIN_EXPLOSION.COINS;

    AnimationPresets.coinExplosion({
      coinTextures,
      sources: [{ x: centerX, y: centerY }],
      config: {
        count: { min: config.COUNT_MIN, max: config.COUNT_MAX },
        scale: { min: config.SCALE_MIN, max: config.SCALE_MAX },
        speed: { min: config.SPEED_MIN, max: config.SPEED_MAX },
        velocityY: config.VELOCITY_Y,
        gravity: config.GRAVITY,
        rotationSpeedMultiplier: config.ROTATION_SPEED_MULTIPLIER,
        angleRandom: config.ANGLE_RANDOM,
        fadeStartTime: config.FADE_START_TIME,
        duration: config.DURATION,
        boundaryOffset: config.BOUNDARY_OFFSET,
        animationSpeed: config.ANIMATION_SPEED,
      },
      resources: this.resources,
      getCanvasConfig: () => ({
        className: "big-win-coins-canvas",
        zIndex: CONFIG.BIG_WIN_COIN_EXPLOSION.CANVAS.Z_INDEX,
        resolutionMax: CONFIG.BIG_WIN_COIN_EXPLOSION.CANVAS.RESOLUTION_MAX,
        autoStart: true,
      }),
    });
  }

  async loadCoinTextures() {
    await PIXI.Assets.load(coinSpritesheetUrl);
    const coinTexture = PIXI.Texture.from(coinSpritesheetUrl);
    const baseTexture = coinTexture.baseTexture;
    const config = CONFIG.BIG_WIN_COIN_EXPLOSION.SPRITESHEET;
    const coinTextures = PIXIUtils.createTexturesFromSpritesheet(
      baseTexture,
      config.COLS,
      config.ROWS
    );
    coinTextures.forEach((texture) => {
      texture.defaultAnchor = new PIXI.Point(0.5, 0.5);
    });
    return coinTextures;
  }

  focusWithdrawButton() {
    const withdrawButton = this.screen.querySelector(".withdraw-button");
    if (!withdrawButton) return;

    if (this.zigzagOutline) {
      const zigzagElement = this.zigzagOutline.zigzagOutline;
      if (zigzagElement) {
        gsap.to(zigzagElement, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            this.zigzagOutline.destroy();
          },
        });
      } else {
        this.zigzagOutline.destroy();
      }
    }

    if (this.jokerAnimations) {
      this.jokerAnimations.cleanup();
    }

    const refreshButton = this.screen.querySelector(".refresh-button");
    if (refreshButton) {
      refreshButton.disabled = true;
      refreshButton.style.opacity = "0.5";
      refreshButton.style.pointerEvents = "none";
      refreshButton.style.cursor = "not-allowed";
      gsap.killTweensOf(refreshButton);
    }

    const pulseAnim = AnimationUtils.createPulseAnimation(withdrawButton, {
      scale: 1.1,
      duration: 0.5,
    });
    this.resources.registerAnimation(pulseAnim);

    withdrawButton.style.boxShadow = "0 0 20px rgba(0, 255, 0, 0.8)";
    withdrawButton.style.transition = "box-shadow 0.3s ease";
  }

  async showNormalWin(winResult) {
    await new Promise((resolve) =>
      this.resources.setTimeout(
        resolve,
        CONFIG.SLOT_MACHINE.NORMAL_WIN_DISPLAY_DURATION
      )
    );
  }

  destroy() {
    this.isDestroyed = true;

    if (this.bigWinVolcanoManager) {
      this.bigWinVolcanoManager.destroy();
    }

    if (this.sparklesApp) {
      this.resources.registerPixiApp(this.sparklesApp);
    }
    if (this.jokerAnimations?.jokerWinApps) {
      this.jokerAnimations.jokerWinApps.forEach((app) => {
        if (app) {
          this.resources.registerPixiApp(app);
        }
      });
    }

    if (this.resources) {
      this.resources.destroy();
    }

    try {
      gsap.killTweensOf(".slot-column");
      gsap.killTweensOf(".slot-cell");
      gsap.killTweensOf(".big-win-banner");
      gsap.killTweensOf(".coin-particle");
      gsap.killTweensOf(".left-panel > *");
      gsap.killTweensOf(".right-panel > *");
      gsap.killTweensOf(".refresh-button");
      gsap.killTweensOf(".withdraw-button");
    } catch (e) {
      // ignore
    }

    if (this.sparklesSetup) {
      this.sparklesSetup.destroy();
    }

    if (this.volcanoManager) {
      this.volcanoManager.destroy();
    }

    if (this.jokerAnimations) {
      this.jokerAnimations.destroy();
    }

    this.eventListeners.forEach((entry) => {
      try {
        if (entry && entry.remove) {
          entry.remove();
        } else if (entry && entry.element && entry.type && entry.handler) {
          entry.element.removeEventListener(entry.type, entry.handler);
        }
      } catch (e) {
        // ignore
      }
    });
    this.eventListeners = [];

    this.coinParticles.forEach((coin) => {
      try {
        coin.remove();
      } catch (e) {
        // ignore
      }
    });
    this.coinParticles = [];

    try {
      document
        .querySelectorAll(
          ".slot-machine-screen, .big-win-banner, .coin-particle, .install-overlay, .play-now-button"
        )
        .forEach((el) => el.remove());
    } catch (e) {
      // ignore
    }
  }
}
