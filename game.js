import * as PIXI from "pixi.js";
import { BlurFilter } from "@pixi/filter-blur";
import { gsap } from "gsap";
import spritesheetUrl from "./assets/spritesheets/spritesheet_2.png";
import jokerSpritesheetUrl from "./assets/spritesheets/spritesheet_1.png";
import coinSpritesheetUrl from "./assets/spritesheets/spritesheet_5.png";
import backgroundUrl from "./assets/backgrounds/bg_01.png";
import sound1Url from "./assets/sounds/sound_1.mp3";
import sound2Url from "./assets/sounds/sound_2.mp3";
import sound3Url from "./assets/sounds/sound_3.mp3";
import sound4Url from "./assets/sounds/sound_4.mp3";
import sound5Url from "./assets/sounds/sound_5.mp3";
import sound7Url from "./assets/sounds/sound_7.mp3";
import sound8Url from "./assets/sounds/sound_8.mp3";
import sound9Url from "./assets/sounds/sound_9.mp3";
import sound10Url from "./assets/sounds/sound_10.mp3";

const playSound = (url) => {
  try {
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.preload = "auto";
    audio.load();
    audio.play().catch(() => {});
    return audio;
  } catch (e) {
    return null;
  }
};

const playSoundRepeated = (url, times, interval) => {
  for (let i = 0; i < times; i++) {
    setTimeout(() => {
      playSound(url);
    }, i * interval);
  }
};

const CONFIG = {
  ANIMATION: {
    SPRITE_SPEED: 0.25,
    SIZE_MULTIPLIER: 2.7,
    FADE_DURATION: 0.5,
    PULSE_SCALE: 1.12,
    PULSE_DURATION: 0.8,
    HOVER_SCALE: 1.2,
    HOVER_DURATION: 0.3,
    SELECTED_SCALE: 1.5,
    DIM_SCALE: 0.7,
    FLY_AWAY_DELAY: 0.3,
    FLY_AWAY_BOUNCE: "5vh",
    FLY_AWAY_DISTANCE: "120vh",
    FLY_AWAY_BOUNCE_DURATION: 0.2,
    FLY_AWAY_DURATION: 0.8,
  },
  PARTICLES: {
    SPARKLE_COUNT: 20,
    FOG_COUNT: 50,
    TARGET_FPS: 25,
  },
  WIN: {
    DEFAULT_AMOUNT: "100$ + 5 FREE SPINS",
    MIN_SMALL: 10,
    MAX_SMALL: 50,
    MIN_LARGE: 100,
    MAX_LARGE: 10000,
  },
  TIMING: {
    LOADING_DELAY: 500,
    SPARKLES_DELAY: 1500,
    CHEST_OPEN_DELAY: 300,
    FLY_AWAY_DELAY: 1000,
  },
  SLOT_MACHINE: {
    COLUMNS: 4,
    ROWS: 4,
    SPIN_DURATION: 1.5,
    STOP_DELAY: 100,
    BOUNCE_HEIGHT: "5vh",
    SYMBOL_SCALE_DURATION: 0.3,
    BIG_WIN_DISPLAY_DURATION: 5000,
    NORMAL_WIN_DISPLAY_DURATION: 2000,
    COIN_RAIN_PARTICLES: 30,
    COIN_RAIN_DURATION: 3000,
    SPIN_SYMBOL_CHANGE_INTERVAL: 50,
    SPIN_CYCLES: 45,
    COLUMN_START_DELAY: 100,
  },
  VOLCANO: {
    SPRITE_SPEED: 0.2,
    FRAMES: 15,
    COLS: 5,
    ROWS: 3,
  },
  JOKER_WIN: {
    SPRITE_SPEED: 0.18,
    FRAMES: 16,
    COLS: 4,
    ROWS: 4,
  },
  SLOT_WINS: {
    JOKER_4: { amount: 14800, type: "BIG_WIN" },
    COIN_10_4: { amount: 40 },
    COIN_10_3: { amount: 30 },
    COIN_5_4: { amount: 20 },
    COIN_5_3: { amount: 15 },
    COIN_3_4: { amount: 12 },
    COIN_3_3: { amount: 9 },
    COIN_2_4: { amount: 8 },
    COIN_2_3: { amount: 6 },
  },
  UI_ANIMATION: {
    ENTRY_FROM_LEFT_DURATION: 0.8,
    ENTRY_FROM_BOTTOM_DURATION: 1,
    ENTRY_FROM_RIGHT_DURATION: 0.8,
    ENTRY_STAGGER: 0.1,
  },
  CTA: {
    STORE_URL: "https://apps.apple.com/app/coin-volcanoes",
    INSTALL_DELAY: 500,
  },
  EXPLOSION: {
    SPRITE_SPEED: 0.5,
    FRAMES: 7,
    COLS: 7,
    ROWS: 1,
  },
};

class SlotMachine {
  constructor() {
    this.isSpinning = false;
    this.volcanoApps = {};
    this.jokerWinApps = [];
    this.eventListeners = [];
    this.gsapAnimations = [];
    this.coinParticles = [];
    this.freeSpins = 5;
    this.balance = 100;
    this.sparklesApp = null;
    this.sparklesData = null;
    this.sparkPool = null;
    this.animationFrames = new Set();
    this.customCursor = document.getElementById("custom-cursor");
    this.mouseX = window._globalCursorMouse?.x || 0;
    this.mouseY = window._globalCursorMouse?.y || 0;
    this.spinButton = null;
    this.jackpotCounters = {
      mini: { current: 22000, increment: 12, initial: 22000, max: 999999 },
      major: { current: 69000, increment: 25, initial: 69000, max: 999999 },
      minor: { current: 36000, increment: 18, initial: 36000, max: 999999 },
    };

    this.currentGrid = null;
  }

  async init() {
    this.createSlotMachineUI();
    await this.setupSparkles();
    this.fillInitialGrid();
    await this.setupCustomCursor();
    this.setupSpinButton();
    this.setupWithdrawButton();
    this.startJackpotCounterAnimation();
    this.startVolcanoEruptionAnimation();
  }

  createSlotMachineUI() {
    const screen = document.createElement("div");
    screen.className = "slot-machine-screen";

    const sparklesCanvas = document.createElement("canvas");
    sparklesCanvas.id = "sparkles-canvas-slot";
    sparklesCanvas.className = "sparkles-canvas";
    screen.appendChild(sparklesCanvas);

    const leftPanel = document.createElement("div");
    leftPanel.className = "left-panel";

    const logoImg = document.createElement("img");
    logoImg.src = "assets/logo/logo.png";
    logoImg.alt = "Logo";
    logoImg.className = "logo-volcanoes";
    leftPanel.appendChild(logoImg);

    const jackpotMini = document.createElement("div");
    jackpotMini.className = "jackpot-mini";
    const miniImg = document.createElement("img");
    miniImg.src = "assets/ui/billet/mini.png";
    miniImg.alt = "Mini";
    jackpotMini.appendChild(miniImg);
    const miniAmount = document.createElement("span");
    miniAmount.className = "jackpot-amount";
    miniAmount.textContent = "22000 €";
    jackpotMini.appendChild(miniAmount);
    leftPanel.appendChild(jackpotMini);

    const jackpotMajor = document.createElement("div");
    jackpotMajor.className = "jackpot-major";
    const majorImg = document.createElement("img");
    majorImg.src = "assets/ui/billet/major.png";
    majorImg.alt = "Major";
    jackpotMajor.appendChild(majorImg);
    const majorAmount = document.createElement("span");
    majorAmount.className = "jackpot-amount";
    majorAmount.textContent = "69000 €";
    jackpotMajor.appendChild(majorAmount);
    leftPanel.appendChild(jackpotMajor);

    const jackpotMinor = document.createElement("div");
    jackpotMinor.className = "jackpot-minor";
    const minorImg = document.createElement("img");
    minorImg.src = "assets/ui/billet/minor.png";
    minorImg.alt = "Minor";
    jackpotMinor.appendChild(minorImg);
    const minorAmount = document.createElement("span");
    minorAmount.className = "jackpot-amount";
    minorAmount.textContent = "36000 €";
    jackpotMinor.appendChild(minorAmount);
    leftPanel.appendChild(jackpotMinor);

    screen.appendChild(leftPanel);

    const slotMachineCenter = document.createElement("div");
    slotMachineCenter.className = "slot-machine-center";

    const fieldContainer = document.createElement("div");
    fieldContainer.className = "field-container";

    const volcanoesContainer = document.createElement("div");
    volcanoesContainer.className = "volcanoes-container";

    const volcanoWrapper1 = document.createElement("div");
    volcanoWrapper1.className = "volcano-wrapper";
    const volcanoGreen = document.createElement("img");
    volcanoGreen.src = "assets/ui/volcanoes/volcano-green.png";
    volcanoGreen.alt = "LIFE";
    volcanoGreen.className = "volcano-image volcano-left";
    volcanoWrapper1.appendChild(volcanoGreen);
    volcanoesContainer.appendChild(volcanoWrapper1);

    const volcanoWrapper2 = document.createElement("div");
    volcanoWrapper2.className = "volcano-wrapper";
    const volcanoBlue = document.createElement("img");
    volcanoBlue.src = "assets/ui/volcanoes/volcano-blue.png";
    volcanoBlue.alt = "GROW";
    volcanoBlue.className = "volcano-image volcano-center";
    volcanoWrapper2.appendChild(volcanoBlue);
    volcanoesContainer.appendChild(volcanoWrapper2);

    const volcanoWrapper3 = document.createElement("div");
    volcanoWrapper3.className = "volcano-wrapper";
    const volcanoRed = document.createElement("img");
    volcanoRed.src = "assets/ui/volcanoes/volcano-red.png";
    volcanoRed.alt = "MULTI";
    volcanoRed.className = "volcano-image volcano-right";
    volcanoWrapper3.appendChild(volcanoRed);
    volcanoesContainer.appendChild(volcanoWrapper3);

    fieldContainer.appendChild(volcanoesContainer);

    const slotFrame = document.createElement("img");
    slotFrame.src = "assets/ui/field/field.png";
    slotFrame.alt = "Slot Frame";
    slotFrame.className = "slot-frame";
    fieldContainer.appendChild(slotFrame);

    const slotGrid = document.createElement("div");
    slotGrid.className = "slot-grid";
    fieldContainer.appendChild(slotGrid);

    slotMachineCenter.appendChild(fieldContainer);
    screen.appendChild(slotMachineCenter);

    const rightPanel = document.createElement("div");
    rightPanel.className = "right-panel";

    const balanceBillboard = document.createElement("div");
    balanceBillboard.className = "balance-billboard";
    const balanceImg = document.createElement("img");
    balanceImg.src = "assets/ui/billet/balance.png";
    balanceImg.alt = "Balance";
    balanceBillboard.appendChild(balanceImg);
    const balanceAmount = document.createElement("span");
    balanceAmount.className = "balance-amount";
    balanceAmount.textContent = "100 €";
    balanceBillboard.appendChild(balanceAmount);
    rightPanel.appendChild(balanceBillboard);

    const withdrawButton = document.createElement("button");
    withdrawButton.className = "withdraw-button";
    const withdrawSpan = document.createElement("span");
    withdrawSpan.textContent = "Withdraw";
    withdrawButton.appendChild(withdrawSpan);
    rightPanel.appendChild(withdrawButton);

    const freeSpinsBillboard = document.createElement("div");
    freeSpinsBillboard.className = "free-spins-billboard";
    const freeSpinsImg = document.createElement("img");
    freeSpinsImg.src = "assets/ui/billet/free-spins.png";
    freeSpinsImg.alt = "Free Spins";
    freeSpinsBillboard.appendChild(freeSpinsImg);
    const freeSpinsCount = document.createElement("span");
    freeSpinsCount.className = "free-spins-count";
    freeSpinsCount.textContent = "5";
    freeSpinsBillboard.appendChild(freeSpinsCount);
    rightPanel.appendChild(freeSpinsBillboard);

    const refreshButton = document.createElement("button");
    refreshButton.className = "refresh-button";
    const refreshButtonIcon = document.createElement("img");
    refreshButtonIcon.src = "assets/ui/buttons/refresh-button.png";
    refreshButtonIcon.alt = "Spin";
    refreshButtonIcon.className = "refresh-button-icon";
    refreshButton.appendChild(refreshButtonIcon);
    rightPanel.appendChild(refreshButton);

    screen.appendChild(rightPanel);

    for (let col = 0; col < CONFIG.SLOT_MACHINE.COLUMNS; col++) {
      const column = document.createElement("div");
      column.className = "slot-column";
      column.setAttribute("data-column", col);
      for (let row = 0; row < CONFIG.SLOT_MACHINE.ROWS; row++) {
        const cell = document.createElement("div");
        cell.className = "slot-cell";
        cell.setAttribute("data-row", row);
        column.appendChild(cell);
      }
      slotGrid.appendChild(column);
    }

    document.body.appendChild(screen);
    this.screen = screen;
  }

  async setupSparkles() {
    if (this.sparklesApp) {
      return;
    }
    let canvas = document.getElementById("sparkles-canvas-slot");
    if (!canvas) {
      canvas = document.getElementById("sparkles-canvas-chest");
      if (canvas) {
        canvas.id = "sparkles-canvas-slot";
      } else {
        return;
      }
    }

    if (canvas._pixiApp) {
      const oldApp = canvas._pixiApp;

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

      canvas._pixiApp = null;

      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    this.sparklesApp = new PIXI.Application({
      view: canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x000000,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });

    canvas._pixiApp = this.sparklesApp;

    const colors = [
      { main: 0xffb6c1, glow: 0xff69b4 },
      { main: 0xadd8e6, glow: 0x87ceeb },
      { main: 0xffff99, glow: 0xffd700 },
    ];

    this.sparklesData = this.createSparklesContainer(
      this.sparklesApp,
      CONFIG.PARTICLES.SPARKLE_COUNT,
      colors
    );

    if (this.sparklesApp && this.sparklesApp.stage) {
      const fogContainer = this.sparklesApp.stage.children.find(
        (child) => child._smokeParticles && Array.isArray(child._smokeParticles)
      );
      if (fogContainer) {
        fogContainer.removeChildren();
        this.sparklesApp.stage.removeChild(fogContainer);
        fogContainer.destroy({ children: true });
      }
    }

    this.initSparkPool();

    const handleResize = () => {
      if (this.sparklesApp && this.sparklesApp.renderer) {
        this.sparklesApp.renderer.resize(window.innerWidth, window.innerHeight);
        if (this.sparklesData) {
          this.sparklesData.width = window.innerWidth;
          this.sparklesData.height = window.innerHeight;
        }
      }
    };

    window.addEventListener("resize", handleResize);
    this.eventListeners.push({
      type: "resize",
      handler: handleResize,
      element: null,
    });

    let lastUpdateTime = 0;
    const frameInterval = 1000 / CONFIG.PARTICLES.TARGET_FPS;

    const animate = (currentTime) => {
      const startTime = performance.now();

      const frameId = requestAnimationFrame(animate);
      this.animationFrames.add(frameId);

      if (currentTime - lastUpdateTime >= frameInterval) {
        if (
          this.sparklesData &&
          this.sparklesApp &&
          this.sparklesApp.ticker &&
          this.sparklesApp.ticker.started &&
          this.sparklesApp.renderer &&
          !this.sparklesApp.renderer.destroyed
        ) {
          this.updateSparkles(this.sparklesData, this.sparklesApp);
        }
        lastUpdateTime = currentTime;
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      if (executionTime > 16) {
        console.warn(`⚠️ RAF slow: ${executionTime.toFixed(2)}ms`);
      }
    };

    animate(0);
  }

  createSparklesContainer(app, count, colors) {
    const container = new PIXI.Container();
    app.stage.addChild(container);

    const textures = colors.map((color) => {
      const graphics = new PIXI.Graphics();
      graphics.beginFill(color.glow, 1);
      graphics.drawEllipse(0, 0, 15, 3);
      graphics.endFill();
      const texture = app.renderer.generateTexture(
        graphics,
        PIXI.SCALE_MODES.LINEAR,
        1
      );
      graphics.destroy();
      return texture;
    });

    const sparkles = [];
    const width = app.screen.width;
    const height = app.screen.height;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 3 + 2) * 4.5;
      const colorIndex = Math.floor(Math.random() * colors.length);
      const color = colors[colorIndex];

      const sprite = new PIXI.Sprite(textures[colorIndex]);
      sprite.anchor.set(0.5);

      const sparkle = {
        sprite: sprite,
        textureIndex: colorIndex,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1.5,
        length: Math.random() * 10 + 7,
        angle: angle,
        color: color,
        opacity: Math.random() * 0.6 + 0.4,
        life: Math.random(),
        lifeSpeed: Math.random() * 0.01 + 0.005,
        depth: Math.random() * 0.5 + 0.5,
      };

      container.addChild(sparkle.sprite);
      sparkles.push(sparkle);
    }

    return { container, sparkles, width, height, textures };
  }

  updateSparkles(sparkleData, app) {
    if (!app || !app.renderer || app.renderer.destroyed || !app.stage) {
      return;
    }
    const { sparkles, width, height } = sparkleData;

    for (let i = 0; i < sparkles.length; i++) {
      const sparkle = sparkles[i];

      sparkle.life += sparkle.lifeSpeed;
      if (sparkle.life > 1) sparkle.life = 0;
      const lifeOpacity = Math.sin(sparkle.life * Math.PI) * 0.3 + 0.7;

      sparkle.x += sparkle.vx;
      sparkle.y += sparkle.vy;

      sparkle.angle = Math.atan2(sparkle.vy, sparkle.vx);

      if (sparkle.x < -sparkle.length) {
        sparkle.x = width + sparkle.length;
      } else if (sparkle.x > width + sparkle.length) {
        sparkle.x = -sparkle.length;
      }
      if (sparkle.y < -sparkle.length) {
        sparkle.y = height + sparkle.length;
      } else if (sparkle.y > height + sparkle.length) {
        sparkle.y = -sparkle.length;
      }

      const depthSize = sparkle.size * sparkle.depth;
      const depthLength = sparkle.length * sparkle.depth;
      const finalOpacity = sparkle.opacity * lifeOpacity * sparkle.depth;

      sparkle.sprite.x = sparkle.x;
      sparkle.sprite.y = sparkle.y;
      sparkle.sprite.rotation = sparkle.angle;
      sparkle.sprite.alpha = finalOpacity;
      const scaleX = depthLength / 2 / 15;
      const scaleY = depthSize / 3;
      sparkle.sprite.scale.set(scaleX, scaleY);
    }
  }

  initSparkPool() {
    if (!this.sparklesApp) return;

    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xffff00);
    graphics.drawCircle(0, 0, 8);
    graphics.endFill();
    const texture = this.sparklesApp.renderer.generateTexture(graphics);
    graphics.destroy();

    this.sparkPool = {
      texture: texture,
      pool: [],
      active: new Set(),
      maxSize: 200,
    };

    for (let i = 0; i < this.sparkPool.maxSize; i++) {
      const sprite = new PIXI.Sprite(texture);
      sprite.visible = false;
      sprite.anchor.set(0.5, 0.5);
      this.sparkPool.pool.push(sprite);
    }
  }

  getSparkFromPool() {
    if (!this.sparkPool) return null;

    const sprite = this.sparkPool.pool.find((s) => !s.visible);
    if (sprite) {
      sprite.visible = true;
      sprite.alpha = 1;
      sprite.scale.set(1);
      this.sparkPool.active.add(sprite);
      return sprite;
    }
    return null;
  }

  releaseSparkToPool(sprite) {
    if (!this.sparkPool || !sprite) return;

    sprite.visible = false;
    sprite.alpha = 1;
    sprite.scale.set(1);
    gsap.killTweensOf(sprite);
    this.sparkPool.active.delete(sprite);
  }

  createCoinFire(coinContainer) {
    const fireContainer = document.createElement("div");
    fireContainer.className = "volcano-fire-container";
    fireContainer.style.cssText = `
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
    `;

    for (let i = 0; i < 3; i++) {
      const flame = document.createElement("div");
      flame.className = "flame coin-flame";
      fireContainer.appendChild(flame);
    }

    for (let i = 0; i < 8; i++) {
      const smoke = document.createElement("div");
      smoke.className = "smoke";
      fireContainer.appendChild(smoke);
    }

    coinContainer.appendChild(fireContainer);
    return fireContainer;
  }

  createCoinSparks(coinContainer) {
    const rect = coinContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    if (
      !this.sparklesApp ||
      !this.sparklesApp.stage ||
      !this.sparklesApp.view ||
      !this.sparkPool
    ) {
      return;
    }

    const app = this.sparklesApp;
    const canvasRect = app.view.getBoundingClientRect();

    const canvasX = centerX - canvasRect.left;
    const canvasY = centerY - canvasRect.top;

    const sparklesContainer = new PIXI.Container();
    app.stage.addChild(sparklesContainer);

    const sparkCount = 12;

    for (let i = 0; i < sparkCount; i++) {
      const sparkle = this.getSparkFromPool();
      if (!sparkle) continue;

      const angle =
        (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.8;
      const distance = Math.random() * 50 + 30;

      const size = Math.random() * 0.5 + 0.75;
      sparkle.scale.set(size);
      sparkle.x = canvasX;
      sparkle.y = canvasY;
      sparkle.zIndex = -1;

      sparklesContainer.addChild(sparkle);

      const targetX = canvasX + Math.cos(angle) * distance;
      const targetY = canvasY + Math.sin(angle) * distance;

      gsap.to(sparkle, {
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0,
        duration: 0.6 + Math.random() * 0.3,
        ease: "power2.out",
        onComplete: () => {
          if (sparkle.parent) {
            sparkle.parent.removeChild(sparkle);
          }
          this.releaseSparkToPool(sparkle);
        },
      });
    }

    setTimeout(() => {
      if (sparklesContainer.parent) {
        sparklesContainer.parent.removeChild(sparklesContainer);
        sparklesContainer.destroy({ children: true });
      }
    }, 1000);
  }

  async setupCustomCursor() {
    if (!this.customCursor) return;

    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      this.customCursor.style.display = "none";
      return;
    }

    if (!window._globalCursorInitialized) {
      return;
    }

    this.customCursor.style.display = "block";
    document.body.classList.add("custom-cursor-active");

    const interactiveElements = this.screen.querySelectorAll(
      ".withdraw-button, .refresh-button, .balance-billboard, .free-spins-billboard, .jackpot-mini, .jackpot-major, .jackpot-minor"
    );

    const handleElementMouseEnter = () => {
      if (this.customCursor && !this.isSpinning) {
        this.customCursor.classList.add("active");
      }
    };

    const handleElementMouseLeave = () => {
      if (this.customCursor) {
        this.customCursor.classList.remove("active");
      }
    };

    interactiveElements.forEach((element) => {
      element.addEventListener("mouseenter", handleElementMouseEnter);
      element.addEventListener("mouseleave", handleElementMouseLeave);

      this.eventListeners.push(
        { element, type: "mouseenter", handler: handleElementMouseEnter },
        { element, type: "mouseleave", handler: handleElementMouseLeave }
      );
    });
  }

  fillInitialGrid() {
    const gridResult = this.currentGrid || this.generateGridResult();
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
          const symbol = this.createSymbol(gridResult[colIndex][rowIndex]);
          cell.appendChild(symbol);
        });
      });
    }
  }

  generateGridResult(isLastSpin = false) {
    const grid = Array(CONFIG.SLOT_MACHINE.COLUMNS)
      .fill(null)
      .map(() => Array(CONFIG.SLOT_MACHINE.ROWS).fill("empty"));

    if (isLastSpin) {
      const winningRow = 1;
      for (let col = 0; col < CONFIG.SLOT_MACHINE.COLUMNS; col++) {
        grid[col][winningRow] = "joker";
      }

      const positions = [];
      for (let col = 0; col < CONFIG.SLOT_MACHINE.COLUMNS; col++) {
        for (let row = 0; row < CONFIG.SLOT_MACHINE.ROWS; row++) {
          if (row !== winningRow) {
            positions.push({ col, row });
          }
        }
      }

      const shuffledPositions = positions.sort(() => Math.random() - 0.5);
      const coinsWithValue = 2 + Math.floor(Math.random() * 2);
      const totalCoins = 5 + Math.floor(Math.random() * 2);
      const emptyCoins = totalCoins - coinsWithValue;

      const coinValues = [2, 3, 5];
      let coinValueIndex = 0;

      for (let i = 0; i < coinsWithValue; i++) {
        const pos = shuffledPositions.pop();
        if (pos) {
          grid[pos.col][pos.row] =
            coinValues[coinValueIndex % coinValues.length];
          coinValueIndex++;
        }
      }

      for (let i = 0; i < emptyCoins; i++) {
        const pos = shuffledPositions.pop();
        if (pos) {
          grid[pos.col][pos.row] = "coin-empty";
        }
      }

      return grid;
    }

    const positions = [];
    for (let col = 0; col < CONFIG.SLOT_MACHINE.COLUMNS; col++) {
      for (let row = 0; row < CONFIG.SLOT_MACHINE.ROWS; row++) {
        positions.push({ col, row });
      }
    }

    const shuffledPositions = positions.sort(() => Math.random() - 0.5);

    const coinsWithValue = 2 + Math.floor(Math.random() * 2);
    const totalCoins = 5 + Math.floor(Math.random() * 2);
    const emptyCoins = totalCoins - coinsWithValue;
    const jokers = 1 + Math.floor(Math.random() * 4);

    const coinValues = [2, 3, 5];
    let coinValueIndex = 0;

    for (let i = 0; i < coinsWithValue; i++) {
      const pos = shuffledPositions.pop();
      if (pos) {
        grid[pos.col][pos.row] = coinValues[coinValueIndex % coinValues.length];
        coinValueIndex++;
      }
    }

    for (let i = 0; i < emptyCoins; i++) {
      const pos = shuffledPositions.pop();
      if (pos) {
        grid[pos.col][pos.row] = "coin-empty";
      }
    }

    for (let i = 0; i < jokers; i++) {
      const pos = shuffledPositions.pop();
      if (pos) {
        grid[pos.col][pos.row] = "joker";
      }
    }

    return grid;
  }

  startJackpotCounterAnimation() {
    const miniElement = this.screen.querySelector(
      ".jackpot-mini .jackpot-amount"
    );
    const majorElement = this.screen.querySelector(
      ".jackpot-major .jackpot-amount"
    );
    const minorElement = this.screen.querySelector(
      ".jackpot-minor .jackpot-amount"
    );

    if (!miniElement || !majorElement || !minorElement) return;

    let lastUpdateTime = performance.now();
    const updateInterval = 16;

    const updateCounter = (currentTime) => {
      const startTime = performance.now();

      if (currentTime - lastUpdateTime >= updateInterval) {
        this.jackpotCounters.mini.current +=
          this.jackpotCounters.mini.increment;
        if (
          this.jackpotCounters.mini.current >= this.jackpotCounters.mini.max
        ) {
          this.jackpotCounters.mini.current = this.jackpotCounters.mini.initial;
        }
        miniElement.textContent = `${Math.floor(
          this.jackpotCounters.mini.current
        ).toLocaleString("ru-RU")} €`;

        this.jackpotCounters.major.current +=
          this.jackpotCounters.major.increment;
        if (
          this.jackpotCounters.major.current >= this.jackpotCounters.major.max
        ) {
          this.jackpotCounters.major.current =
            this.jackpotCounters.major.initial;
        }
        majorElement.textContent = `${Math.floor(
          this.jackpotCounters.major.current
        ).toLocaleString("ru-RU")} €`;

        this.jackpotCounters.minor.current +=
          this.jackpotCounters.minor.increment;
        if (
          this.jackpotCounters.minor.current >= this.jackpotCounters.minor.max
        ) {
          this.jackpotCounters.minor.current =
            this.jackpotCounters.minor.initial;
        }
        minorElement.textContent = `${Math.floor(
          this.jackpotCounters.minor.current
        ).toLocaleString("ru-RU")} €`;

        lastUpdateTime = currentTime;
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      if (executionTime > 16) {
        console.warn(`⚠️ Jackpot RAF slow: ${executionTime.toFixed(2)}ms`);
      }

      const frameId = requestAnimationFrame(updateCounter);
      this.animationFrames.add(frameId);
    };

    updateCounter(performance.now());
  }

  async startVolcanoEruptionAnimation() {
    const volcanoLeft = this.screen.querySelector(".volcano-left");
    const volcanoCenter = this.screen.querySelector(".volcano-center");
    const volcanoRight = this.screen.querySelector(".volcano-right");

    if (!volcanoLeft || !volcanoCenter || !volcanoRight) return;

    const createGlowElement = (volcano) => {
      const wrapper = volcano.parentElement;
      const glowElement = document.createElement("div");
      glowElement.className = "volcano-glow";
      glowElement.style.opacity = "0";
      glowElement.style.animation = "none";
      wrapper.appendChild(glowElement);
      return glowElement;
    };

    const glowElements = {
      left: createGlowElement(volcanoLeft),
      center: createGlowElement(volcanoCenter),
      right: createGlowElement(volcanoRight),
    };

    const createFireElement = (volcano) => {
      const wrapper = volcano.parentElement;
      const fireContainer = document.createElement("div");
      fireContainer.className = "volcano-fire-container";

      for (let i = 0; i < 3; i++) {
        const flame = document.createElement("div");
        flame.className = "flame";
        fireContainer.appendChild(flame);
      }

      for (let i = 0; i < 8; i++) {
        const smoke = document.createElement("div");
        smoke.className = "smoke";
        fireContainer.appendChild(smoke);
      }

      wrapper.appendChild(fireContainer);
      return fireContainer;
    };

    const fireElements = {
      left: createFireElement(volcanoLeft),
      center: createFireElement(volcanoCenter),
      right: createFireElement(volcanoRight),
    };

    if (!this.volcanoEruptionTimers) {
      this.volcanoEruptionTimers = [];
    }
    if (!this.volcanoEruptionFunctions) {
      this.volcanoEruptionFunctions = [];
    }

    const createEruptionAnimation = (
      volcano,
      glowElement,
      fireElement,
      delay
    ) => {
      let eruptionTimer = null;
      let isActive = true;

      const eruption = () => {
        if (!isActive) return;

        const timeline = gsap.timeline({
          delay: delay,
          onComplete: () => {
            if (!isActive) return;
            const nextDelay = 3 + Math.random() * 4;
            eruptionTimer = setTimeout(eruption, nextDelay * 1000);
            const timerIndex = this.volcanoEruptionTimers.length;
            this.volcanoEruptionTimers.push(eruptionTimer);
          },
        });

        timeline.to(
          glowElement,
          {
            opacity: 1,
            scale: 1.2,
            duration: 0.2,
            ease: "power2.out",
          },
          0
        );

        timeline.to(
          fireElement,
          {
            opacity: 1,
            duration: 0.2,
            ease: "power2.out",
          },
          0
        );

        timeline.to(volcano, {
          scaleY: 1.15,
          duration: 0.3,
          ease: "power2.out",
          transformOrigin: "bottom center",
        });

        timeline.to(volcano, {
          scaleY: 1,
          duration: 0.5,
          ease: "power2.in",
        });

        timeline.to(
          glowElement,
          {
            opacity: 0,
            scale: 1,
            duration: 0.4,
            ease: "power2.out",
          },
          "-=0.4"
        );

        timeline.to(
          fireElement,
          {
            opacity: 0,
            duration: 0.4,
            ease: "power2.out",
          },
          "-=0.4"
        );
      };

      const eruptionControl = {
        stop: () => {
          isActive = false;
          if (eruptionTimer) {
            clearTimeout(eruptionTimer);
          }
          gsap.killTweensOf(volcano);
          gsap.killTweensOf(glowElement);
          gsap.killTweensOf(fireElement);
        },
      };
      this.volcanoEruptionFunctions.push(eruptionControl);

      const initialDelay = delay + Math.random() * 2;
      eruptionTimer = setTimeout(eruption, initialDelay * 1000);
      this.volcanoEruptionTimers.push(eruptionTimer);
    };

    createEruptionAnimation(
      volcanoLeft,
      glowElements.left,
      fireElements.left,
      0
    );
    createEruptionAnimation(
      volcanoCenter,
      glowElements.center,
      fireElements.center,
      1
    );
    createEruptionAnimation(
      volcanoRight,
      glowElements.right,
      fireElements.right,
      2
    );
  }
  async setupVolcanoes() {
    const volcanoConfigs = [
      { id: "volcano-life", color: "green", type: "LIFE" },
      { id: "volcano-multi", color: "red", type: "MULTI" },
      { id: "volcano-grow", color: "blue", type: "GROW" },
    ];

    for (const config of volcanoConfigs) {
      const canvas = document.getElementById(config.id);
      if (!canvas) continue;

      const rect = canvas.getBoundingClientRect();
      const app = new PIXI.Application({
        view: canvas,
        width: rect.width || 200,
        height: rect.height || 200,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });

      const volcanoUrl = `assets/ui/volcanoes/volcano-${config.color}.png`;
      const texture = await PIXI.Assets.load(volcanoUrl);
      const baseTexture =
        texture instanceof PIXI.Texture ? texture.baseTexture : texture;

      const cols = CONFIG.VOLCANO.COLS;
      const rows = CONFIG.VOLCANO.ROWS;
      const frameWidth = baseTexture.width / cols;
      const frameHeight = baseTexture.height / rows;

      const textures = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const frameRect = new PIXI.Rectangle(
            col * frameWidth,
            row * frameHeight,
            frameWidth,
            frameHeight
          );
          const frameTexture = new PIXI.Texture(baseTexture, frameRect);
          textures.push(frameTexture);
        }
      }

      const animatedSprite = new PIXI.AnimatedSprite(textures);
      animatedSprite.anchor.set(0.5);
      animatedSprite.x = app.screen.width / 2;
      animatedSprite.y = app.screen.height / 2 - 400;
      animatedSprite.animationSpeed = CONFIG.VOLCANO.SPRITE_SPEED;
      animatedSprite.loop = true;
      animatedSprite.play();

      const scale = Math.min(
        app.screen.width / frameWidth,
        app.screen.height / frameHeight
      );
      animatedSprite.scale.set(scale * 0.9);

      app.stage.addChild(animatedSprite);
      this.volcanoApps[config.id] = app;

      const handleResize = () => {
        app.renderer.resize(canvas.offsetWidth, canvas.offsetHeight);
        animatedSprite.x = app.screen.width / 2;
        animatedSprite.y = app.screen.height / 2;
        const newScale = Math.min(
          app.screen.width / frameWidth,
          app.screen.height / frameHeight
        );
        animatedSprite.scale.set(newScale * 0.9);
      };

      window.addEventListener("resize", handleResize);
      this.eventListeners.push({
        type: "resize",
        handler: handleResize,
        element: null,
      });
    }
  }

  setupSpinButton() {
    const spinBtn = this.screen.querySelector(".refresh-button");
    if (!spinBtn) return;

    this.spinButton = spinBtn;

    const handleSpin = async () => {
      if (this.isSpinning) return;
      if (this.freeSpins <= 0) return;

      playSound(sound3Url);

      const anim = gsap.to(spinBtn, {
        rotation: "+=360",
        duration: 0.5,
        ease: "power2.out",
      });
      this.gsapAnimations.push(anim);

      await this.spin();
    };

    spinBtn.addEventListener("click", handleSpin);
    this.eventListeners.push({
      element: spinBtn,
      type: "click",
      handler: handleSpin,
    });

    const handleTouchStart = (e) => {
      e.preventDefault();
      handleSpin();
    };
    spinBtn.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    this.eventListeners.push({
      element: spinBtn,
      type: "touchstart",
      handler: handleTouchStart,
    });

    const pulseAnim = gsap.to(spinBtn, {
      scale: 1.1,
      duration: 0.8,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    this.gsapAnimations.push(pulseAnim);
  }

  setupWithdrawButton() {
    const withdrawBtn = this.screen.querySelector(".withdraw-button");
    if (!withdrawBtn) return;

    const handleWithdraw = () => {
      this.triggerCTA("withdraw_clicked");
    };

    withdrawBtn.addEventListener("click", handleWithdraw);
    this.eventListeners.push({
      element: withdrawBtn,
      type: "click",
      handler: handleWithdraw,
    });

    const handleWithdrawTouch = (e) => {
      e.preventDefault();
      handleWithdraw();
    };
    withdrawBtn.addEventListener("touchstart", handleWithdrawTouch, {
      passive: false,
    });
    this.eventListeners.push({
      element: withdrawBtn,
      type: "touchstart",
      handler: handleWithdrawTouch,
    });
  }

  triggerCTA(source) {
    this.destroy();
    this.showInstallOverlay();

    if (typeof mraid !== "undefined") {
      mraid.open();
    } else {
      window.open(CONFIG.CTA.STORE_URL, "_blank");
    }
  }

  showInstallOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "install-overlay";

    const installContent = document.createElement("div");
    installContent.className = "install-content";

    const spinner = document.createElement("div");
    spinner.className = "spinner";

    const installText = document.createElement("div");
    installText.className = "install-text";
    installText.textContent = "Installing...";

    installContent.appendChild(spinner);
    installContent.appendChild(installText);
    overlay.appendChild(installContent);
    document.body.appendChild(overlay);

    gsap.from(overlay, {
      opacity: 0,
      duration: 0.3,
    });
  }

  async spin() {
    if (this.isSpinning) return;
    if (this.freeSpins <= 0) return;
    this.isSpinning = true;

    if (this.spinButton) {
      this.spinButton.disabled = true;
      this.spinButton.classList.add("disabled");
    }

    if (this.customCursor) {
      this.customCursor.classList.remove("active");
    }

    this.freeSpins--;
    const freeSpinsElement = this.screen.querySelector(".free-spins-count");
    if (freeSpinsElement) {
      freeSpinsElement.textContent = this.freeSpins;
    }

    const columns = this.screen.querySelectorAll(".slot-column");
    const isLastSpin = this.freeSpins === 0;
    const previousGrid = this.currentGrid;
    const finalGrid = this.generateGridResult(isLastSpin);
    const allCoins = [];

    for (let col = 0; col < columns.length; col++) {
      const column = columns[col];

      const originalCells = Array.from(column.querySelectorAll(".slot-cell"));

      column.replaceChildren();

      column.style.position = "relative";
      column.style.overflow = "hidden";
      column.style.height = "100%";

      const reelStrip = document.createElement("div");
      reelStrip.style.position = "absolute";
      reelStrip.style.top = "0";
      reelStrip.style.left = "0";
      reelStrip.style.width = "100%";
      reelStrip.style.willChange = "transform";
      reelStrip.style.display = "flex";
      reelStrip.style.flexDirection = "column";

      const columnHeight = column.offsetHeight || 400;
      const cellHeightPx = columnHeight / CONFIG.SLOT_MACHINE.ROWS;

      const spinCycles = CONFIG.SLOT_MACHINE.SPIN_CYCLES;

      const totalSymbols =
        spinCycles * CONFIG.SLOT_MACHINE.ROWS + CONFIG.SLOT_MACHINE.ROWS;
      const startGrid = previousGrid || this.currentGrid || finalGrid;

      for (let i = 0; i < totalSymbols; i++) {
        let symbolType;

        if (i >= spinCycles * CONFIG.SLOT_MACHINE.ROWS) {
          const finalRow = i - spinCycles * CONFIG.SLOT_MACHINE.ROWS;
          symbolType = finalGrid[col][finalRow];
        } else if (i < CONFIG.SLOT_MACHINE.ROWS && startGrid) {
          symbolType = startGrid[col][i % CONFIG.SLOT_MACHINE.ROWS];
        } else {
          const tempColumn = this.generateColumnResult();
          symbolType = tempColumn[i % CONFIG.SLOT_MACHINE.ROWS];
        }

        const symbolCell = document.createElement("div");
        symbolCell.className = "slot-cell";
        symbolCell.style.height = `${cellHeightPx}px`;
        symbolCell.style.flexShrink = "0";
        symbolCell.style.display = "flex";
        symbolCell.style.alignItems = "center";
        symbolCell.style.justifyContent = "center";

        const symbol = this.createSymbol(symbolType);
        symbolCell.appendChild(symbol);
        reelStrip.appendChild(symbolCell);
      }

      column.appendChild(reelStrip);

      const spinDelay = col * CONFIG.SLOT_MACHINE.COLUMN_START_DELAY;
      await new Promise((resolve) => setTimeout(resolve, spinDelay));

      const totalHeight = cellHeightPx * totalSymbols;
      const finalPositionPx = -(totalHeight - columnHeight);

      const spinDuration = CONFIG.SLOT_MACHINE.SPIN_DURATION + col * 0.1;

      const calculateBlur = () => {
        const vw = window.innerWidth / 100;
        const minBlur = 0.2 * 16;
        const preferredBlur = 0.5 * vw;
        const maxBlur = 0.4 * 16;
        return Math.max(minBlur, Math.min(preferredBlur, maxBlur));
      };

      gsap.fromTo(
        reelStrip,
        {
          y: 0,
        },
        {
          y: finalPositionPx,
          duration: spinDuration,
          ease: "power2.out",
          onStart: () => {
            playSound(sound1Url);
            const blurPx = calculateBlur();
            reelStrip.style.filter = `blur(${blurPx}px)`;
          },
          onUpdate: function () {
            const progress = this.progress();
            if (progress > 0.6) {
              const fadeOutProgress = (progress - 0.6) / 0.4;
              const blurMultiplier = 1 - fadeOutProgress;
              const blurPx = calculateBlur() * blurMultiplier;
              reelStrip.style.filter = `blur(${blurPx}px)`;
            }
          },
          onComplete: () => {
            reelStrip.style.filter = "none";

            column.replaceChildren();
            column.style.overflow = "visible";
            column.style.display = "flex";
            column.style.flexDirection = "column";
            column.style.gap = "clamp(0.5rem, 1vw, 1rem)";

            originalCells.forEach((cell, rowIndex) => {
              const newCell = cell.cloneNode(false);
              newCell.replaceChildren();
              newCell.setAttribute("data-row", rowIndex);
              const symbolValue = finalGrid[col][rowIndex];
              const finalSymbol = this.createSymbol(symbolValue);
              newCell.appendChild(finalSymbol);
              column.appendChild(newCell);

              gsap.from(finalSymbol, {
                scale: 0,
                duration: CONFIG.SLOT_MACHINE.SYMBOL_SCALE_DURATION,
                ease: "back.out(1.7)",
                delay: rowIndex * 0.05,
                onComplete: () => {
                  if (
                    typeof symbolValue === "number" &&
                    (symbolValue === 2 ||
                      symbolValue === 3 ||
                      symbolValue === 5)
                  ) {
                    allCoins.push(finalSymbol);
                  }
                },
              });
            });
          },
        }
      );

      await new Promise((resolve) =>
        setTimeout(
          resolve,
          spinDuration * 1000 + CONFIG.SLOT_MACHINE.STOP_DELAY
        )
      );
    }

    if (!isLastSpin) {
      const lastSymbolDelay = (CONFIG.SLOT_MACHINE.ROWS - 1) * 0.05;
      const additionalDelay = CONFIG.SLOT_MACHINE.SYMBOL_SCALE_DURATION;
      const waitForAllSymbols =
        (lastSymbolDelay + additionalDelay) * 1000 + 100;

      await new Promise((resolve) => setTimeout(resolve, waitForAllSymbols));

      allCoins.forEach((coinContainer, index) => {
        if (coinContainer.querySelector(".coin-text")) {
          coinContainer.classList.add("coin-with-value");

          const fireContainer = this.createCoinFire(coinContainer);

          const timeline = gsap.timeline({
            delay: index * 0.1,
            onStart: () => {
              playSound(sound7Url);
              this.createCoinSparks(coinContainer);
            },
          });

          timeline.to(
            fireContainer,
            {
              opacity: 1,
              duration: 0.2,
              ease: "power2.out",
            },
            0
          );

          timeline.to(coinContainer, {
            scale: 2,
            duration: 0.4,
            ease: "back.out(1.5)",
          });

          timeline.to(coinContainer, {
            scale: 1,
            duration: 0.4,
            ease: "back.in(1.2)",
            onComplete: () => {
              coinContainer.classList.remove("coin-with-value");
            },
          });

          timeline.to(
            fireContainer,
            {
              opacity: 0,
              duration: 0.3,
              ease: "power2.out",
              onComplete: () => {
                if (fireContainer.parentNode) {
                  fireContainer.parentNode.removeChild(fireContainer);
                }
              },
            },
            "-=0.3"
          );
        }
      });
    }

    const coinsSum = this.calculateCoinsSum(finalGrid);
    this.balance += coinsSum;
    this.updateBalanceWithAnimation();
    this.currentGrid = finalGrid;

    if (isLastSpin) {
      const lastSymbolDelay = (CONFIG.SLOT_MACHINE.ROWS - 1) * 0.05;
      const additionalDelay = CONFIG.SLOT_MACHINE.SYMBOL_SCALE_DURATION;
      const waitForAllSymbols =
        (lastSymbolDelay + additionalDelay) * 1000 + 100;
      await new Promise((resolve) => setTimeout(resolve, waitForAllSymbols));
    }

    const winResult = this.checkWin(finalGrid);
    if (winResult) {
      if (winResult.type === "BIG_WIN") {
        await this.showBigWin(winResult);
      } else {
        await this.showNormalWin(winResult);
      }
    }

    this.isSpinning = false;

    if (this.spinButton) {
      this.spinButton.disabled = false;
      this.spinButton.classList.remove("disabled");
    }

    if (this.customCursor) {
      const hoveredElement = document.elementFromPoint(
        this.mouseX,
        this.mouseY
      );
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
  }

  generateColumnResult() {
    const result = [];
    for (let i = 0; i < CONFIG.SLOT_MACHINE.ROWS; i++) {
      const rand = Math.random();
      if (rand < 0.15) {
        result.push("joker");
      } else if (rand < 0.35) {
        result.push(5);
      } else if (rand < 0.55) {
        result.push(3);
      } else if (rand < 0.7) {
        result.push(2);
      } else if (rand < 0.85) {
        result.push("coin-empty");
      } else {
        result.push("empty");
      }
    }
    return result;
  }

  createSymbol(value) {
    const container = document.createElement("div");
    container.className = "coin-container";

    if (value === "joker") {
      const img = document.createElement("img");
      img.src = "assets/ui/joker/joker-static.png";
      img.className = "joker-static";
      img.alt = "Joker";
      container.appendChild(img);
    } else if (value === "empty") {
      container.classList.add("empty-cell");
    } else if (value === "coin-empty") {
      const coinImg = document.createElement("img");
      coinImg.src = "assets/ui/coin/coin.png";
      coinImg.className = "coin-base";
      coinImg.alt = "Coin";
      container.appendChild(coinImg);
    } else {
      const coinImg = document.createElement("img");
      coinImg.src = "assets/ui/coin/coin.png";
      coinImg.className = "coin-base";
      coinImg.alt = "Coin";

      const coinText = document.createElement("div");
      coinText.className = "coin-text";
      coinText.textContent = `${value} €`;

      container.appendChild(coinImg);
      container.appendChild(coinText);
    }

    return container;
  }

  calculateCoinsSum(grid) {
    let sum = 0;
    for (let col = 0; col < grid.length; col++) {
      for (let row = 0; row < grid[col].length; row++) {
        const value = grid[col][row];
        if (typeof value === "number") {
          sum += value;
        }
      }
    }
    return sum;
  }

  updateBalance() {
    const balanceElement = this.screen.querySelector(".balance-amount");
    if (balanceElement) {
      balanceElement.textContent = `${this.balance} €`;
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
      this.gsapAnimations.push(
        gsap.to(balanceElement, {
          scale: 1.2,
          duration: 0.3,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
        })
      );
    }
  }

  checkWin(grid) {
    for (let row = 0; row < CONFIG.SLOT_MACHINE.ROWS; row++) {
      const rowSymbols = grid.map((col) => col[row]);
      const firstSymbol = rowSymbols[0];

      if (firstSymbol === "joker" && rowSymbols.every((s) => s === "joker")) {
        return {
          type: "BIG_WIN",
          amount: CONFIG.SLOT_WINS.JOKER_4.amount,
          row: row,
          symbols: rowSymbols,
        };
      }

      if (
        firstSymbol !== "joker" &&
        firstSymbol !== "empty" &&
        firstSymbol !== "coin-empty" &&
        typeof firstSymbol === "number"
      ) {
        const count = rowSymbols.filter(
          (s) => s === firstSymbol && typeof s === "number"
        ).length;
        if (count >= 3) {
          const winKey = `COIN_${firstSymbol}_${count}`;
          const winConfig = CONFIG.SLOT_WINS[winKey];
          if (winConfig) {
            return {
              type: "NORMAL",
              amount: winConfig.amount,
              row: row,
              symbols: rowSymbols,
            };
          }
        }
      }
    }
    return null;
  }

  async showBigWin(winResult) {
    const winningRow = winResult.row;

    await new Promise((resolve) => setTimeout(resolve, 200));

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
        this.jokerWinApps = await this.animateJokerWin(jokerCellsArray);
        return;
      }
      return;
    }

    this.createZigzagOutline(winningRow);
    await new Promise((resolve) => setTimeout(resolve, 800));
    this.jokerWinApps = await this.animateJokerWin(Array.from(jokerCells));
    setTimeout(() => {
      if (this.zigzagOutline) {
        if (this.zigzagOutline.parentNode) {
          this.zigzagOutline.remove();
        }
        this.zigzagOutline = null;
      }
      this.showBigWinScreen();
    }, 2000);
  }

  async showBigWinScreen() {
    if (this.customCursor) {
      this.customCursor.style.display = "block";
    }

    const balanceElement = this.screen.querySelector(".balance-amount");
    let currentBalance = this.balance;
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
    const targetBalance = currentBalance + 5000;
    const leftPanel = this.screen.querySelector(".left-panel");
    const centerPanel = this.screen.querySelector(".slot-machine-center");
    const rightPanel = this.screen.querySelector(".right-panel");

    gsap.to([leftPanel, centerPanel, rightPanel], {
      opacity: 0,
      duration: 0.5,
      ease: "power2.in",
    });

    const bigWinScreen = document.createElement("div");
    bigWinScreen.className = "big-win-screen";
    bigWinScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 1000;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
    `;

    const explosionContainer = document.createElement("div");
    explosionContainer.className = "big-win-explosion";
    explosionContainer.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 200vw;
      height: 200vh;
      pointer-events: none;
      z-index: 1;
    `;

    const explosionCanvas = document.createElement("canvas");
    explosionCanvas.width = 800;
    explosionCanvas.height = 800;
    explosionCanvas.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
      pointer-events: none;
    `;
    explosionContainer.appendChild(explosionCanvas);

    explosionCanvas._pixiApp = null;

    const contentContainer = document.createElement("div");
    contentContainer.className = "big-win-content";
    contentContainer.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: clamp(4rem, 10vh, 8rem);
      z-index: 2;
      pointer-events: none;
    `;

    const volcanoesContainer = document.createElement("div");
    volcanoesContainer.className = "big-win-volcanoes";
    volcanoesContainer.style.cssText = `
      position: absolute;
      top: 0px;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      pointer-events: none;
    `;

    const volcanoWrapper = document.createElement("div");
    volcanoWrapper.className = "three-volcanoes-wrapper";
    volcanoWrapper.style.cssText = `
      position: relative;
      width: clamp(25rem, 60vw, 50rem);
      height: clamp(20rem, 50vh, 40rem);
      display: flex;
      justify-content: center;
      align-items: center;
      transform: translateY(clamp(-12rem, -18vh, -10rem));
      z-index: 2;
    `;

    const glowElement = document.createElement("div");
    glowElement.className = "volcano-glow";
    glowElement.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: clamp(12rem, 30vw, 24rem);
      height: clamp(12rem, 30vw, 24rem);
      border-radius: 50%;
      background: radial-gradient(
        ellipse at 50% 50%,
        rgba(255, 215, 0, 0.6) 0%,
        rgba(255, 215, 0, 0.4) 30%,
        rgba(255, 215, 0, 0.2) 60%,
        rgba(255, 215, 0, 0) 100%
      );
      filter: blur(clamp(0.8rem, 2vw, 1.5rem));
      pointer-events: none;
      z-index: 0;
      opacity: 0;
    `;
    volcanoWrapper.appendChild(glowElement);

    const fireContainer = document.createElement("div");
    fireContainer.className = "volcano-fire-container";
    fireContainer.style.cssText = `
      position: absolute;
      top: -30%;
      left: 50%;
      transform: translateX(-50%) translateY(-50px);
      width: 100%;
      height: 90%;
      pointer-events: none;
      z-index: -1;
      opacity: 0;
      overflow: visible;
      filter: blur(8px);
    `;

    for (let i = 0; i < 3; i++) {
      const flame = document.createElement("div");
      flame.className = "flame";
      fireContainer.appendChild(flame);
    }

    for (let i = 0; i < 8; i++) {
      const smoke = document.createElement("div");
      smoke.className = "smoke";
      fireContainer.appendChild(smoke);
    }
    volcanoWrapper.appendChild(fireContainer);

    const volcanoImg = document.createElement("img");
    volcanoImg.src = "assets/ui/volcanoes/three-volcanoes.png";
    volcanoImg.alt = "Three Volcanoes";
    volcanoImg.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
      position: relative;
      z-index: 1;
      transform-origin: center center;
    `;
    volcanoWrapper.appendChild(volcanoImg);

    volcanoesContainer.appendChild(volcanoWrapper);
    contentContainer.appendChild(volcanoesContainer);

    this.startBigWinVolcanoAnimation(
      volcanoWrapper,
      volcanoImg,
      glowElement,
      fireContainer
    );

    const bigWinBanner = document.createElement("div");
    bigWinBanner.className = "big-win-banner";
    bigWinBanner.style.cssText = `
      position: absolute;
      top: 55%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: clamp(1rem, 2vh, 1.5rem);
      width: clamp(26rem, 75vw, 60rem);
      margin-top: clamp(8rem, 15vh, 12rem);
    `;

    const bigWinImageContainer = document.createElement("div");
    bigWinImageContainer.style.cssText = `
      position: relative;
      width: 100%;
      display: block;
    `;

    const bigWinImage = document.createElement("img");
    bigWinImage.src = "assets/ui/billet/bigwin.png";
    bigWinImage.style.cssText = `
      width: 100%;
      height: auto;
      object-fit: contain;
      display: block;
    `;
    bigWinImageContainer.appendChild(bigWinImage);

    const bigWinAmount = document.createElement("div");
    bigWinAmount.className = "big-win-amount";
    bigWinAmount.textContent = `${currentBalance.toLocaleString("ru-RU")} €`;
    bigWinAmount.style.cssText = `
      position: absolute;
      top: 40%;
      left: 50%;
      transform: translateX(-50%) !important;
      font-family: 'The Logo Font', 'Arial Black', sans-serif;
      font-size: clamp(2rem, 6vw, 4rem);
      font-weight: 900;
      color: #ffffff;
      text-shadow: 0.15rem 0.15rem 0.4rem rgba(0, 0, 0, 1), 0 0 1rem rgba(255, 255, 255, 0.8);
      white-space: nowrap;
      pointer-events: none;
      text-align: center;
      z-index: 1001;
      margin: 0;
      display: block;
      width: 100%;
    `;
    bigWinImageContainer.appendChild(bigWinAmount);

    bigWinBanner.appendChild(bigWinImageContainer);

    contentContainer.appendChild(bigWinBanner);

    this.createBigWinCoinExplosion(volcanoesContainer);

    bigWinScreen.appendChild(explosionContainer);
    bigWinScreen.appendChild(contentContainer);
    document.body.appendChild(bigWinScreen);

    explosionContainer.style.display = "none";

    gsap.set(bigWinScreen, {
      opacity: 0,
      scale: 0,
      transformOrigin: "center center",
    });

    gsap.set(contentContainer, {
      opacity: 0,
      scale: 0,
      transformOrigin: "center center",
    });

    gsap.to(bigWinScreen, {
      opacity: 1,
      scale: 1,
      duration: 0.5,
      ease: "back.out(1.7)",
    });

    setTimeout(() => {
      gsap.to(contentContainer, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "back.out(1.5)",
      });

      playSound(sound10Url);

      gsap.to(bigWinAmount, {
        textContent: targetBalance,
        duration: 3,
        snap: { textContent: 1 },
        ease: "power1.out",
        onUpdate: function () {
          const value = Math.floor(this.targets()[0].textContent);
          bigWinAmount.textContent = value.toLocaleString("ru-RU") + " €";
        },
        onComplete: async () => {
          this.balance = targetBalance;
          if (balanceElement) {
            balanceElement.textContent = `${targetBalance.toLocaleString(
              "ru-RU"
            )} €`;
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));

          gsap.to(bigWinScreen, {
            opacity: 0,
            scale: 0.8,
            duration: 0.5,
            ease: "power2.in",
            onComplete: () => {
              if (this.bigWinVolcanoTimers) {
                this.bigWinVolcanoTimers.forEach((timer) => {
                  clearTimeout(timer);
                });
                this.bigWinVolcanoTimers = [];
              }
              if (this.bigWinVolcanoFunctions) {
                this.bigWinVolcanoFunctions.forEach((control) => {
                  control.stop();
                });
                this.bigWinVolcanoFunctions = [];
              }
              if (this.bigWinExplosionApps) {
                Object.values(this.bigWinExplosionApps).forEach(
                  ({ app, sprite, canvas }) => {
                    if (sprite) {
                      sprite.visible = false;
                      sprite.stop();
                    }
                    if (app && app.ticker) {
                      try {
                        app.ticker.stop();
                        app.ticker.destroy();
                      } catch (e) {}
                    }
                    if (app) {
                      try {
                        if (app.stage) {
                          app.stage.removeChildren();
                          app.stage.destroy({ children: true });
                        }
                        if (app.renderer) {
                          if (!app.renderer.destroyed && app.renderer.gl) {
                            try {
                              app.renderer.destroy(true);
                            } catch (e) {
                              // Ignore
                            }
                          }
                        }
                        app.destroy(true, { children: true });
                      } catch (e) {
                        // Ignore
                      }
                    }
                    if (canvas && canvas.parentNode) {
                      try {
                        canvas.parentNode.removeChild(canvas);
                      } catch (e) {}
                    }
                  }
                );
                this.bigWinExplosionApps = null;
              }

              const bigWinCoinsCanvas = document.querySelector(
                ".big-win-coins-canvas"
              );
              if (bigWinCoinsCanvas) {
                try {
                  if (bigWinCoinsCanvas._pixiApp) {
                    const app = bigWinCoinsCanvas._pixiApp;
                    app.stage.removeChildren();
                    app.destroy(true, { children: true });
                  }
                  if (bigWinCoinsCanvas.parentNode) {
                    bigWinCoinsCanvas.parentNode.removeChild(bigWinCoinsCanvas);
                  }
                } catch (e) {
                  // Ignore errors
                }
              }

              bigWinScreen.remove();

              gsap.to([leftPanel, centerPanel, rightPanel], {
                opacity: 1,
                duration: 0.5,
                ease: "power2.out",
              });

              if (this.sparklesApp && this.sparklesData) {
                if (
                  this.sparklesApp.ticker &&
                  !this.sparklesApp.ticker.started
                ) {
                  this.sparklesApp.ticker.start();
                }
              }

              this.focusWithdrawButton();
            },
          });
        },
      });
    }, 600);
  }

  startBigWinVolcanoAnimation(
    volcanoWrapper,
    volcanoImg,
    glowElement,
    fireContainer
  ) {
    let eruptionTimer = null;
    let isActive = true;

    const eruption = () => {
      if (!isActive) return;

      const timeline = gsap.timeline({
        onComplete: () => {
          if (!isActive) return;
          const nextDelay = 3 + Math.random() * 4;
          eruptionTimer = setTimeout(eruption, nextDelay * 1000);
          if (this.bigWinVolcanoTimers) {
            this.bigWinVolcanoTimers.push(eruptionTimer);
          }
        },
      });

      timeline.to(
        glowElement,
        {
          opacity: 1,
          scale: 1.2,
          duration: 0.2,
          ease: "power2.out",
        },
        0
      );

      timeline.to(
        fireContainer,
        {
          opacity: 1,
          duration: 0.2,
          ease: "power2.out",
        },
        0
      );

      timeline.to(volcanoImg, {
        scaleX: 1.1,
        scaleY: 1,
        duration: 0.2,
        ease: "power2.out",
        transformOrigin: "center center",
      });

      timeline.to(volcanoImg, {
        scaleX: 0.95,
        scaleY: 1,
        duration: 0.2,
        ease: "power2.in",
      });

      timeline.to(volcanoImg, {
        scaleX: 1,
        scaleY: 1.15,
        duration: 0.3,
        ease: "power2.out",
        transformOrigin: "center center",
      });

      timeline.to(volcanoImg, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.5,
        ease: "power2.in",
      });

      timeline.to(
        glowElement,
        {
          opacity: 0,
          scale: 1,
          duration: 0.8,
          ease: "power2.in",
        },
        "-=0.5"
      );

      timeline.to(
        fireContainer,
        {
          opacity: 0,
          duration: 0.8,
          ease: "power2.in",
        },
        "-=0.5"
      );
    };

    const initialDelay = 1 + Math.random() * 2;
    eruptionTimer = setTimeout(eruption, initialDelay * 1000);

    if (!this.bigWinVolcanoTimers) {
      this.bigWinVolcanoTimers = [];
    }
    this.bigWinVolcanoTimers.push(eruptionTimer);

    if (!this.bigWinVolcanoFunctions) {
      this.bigWinVolcanoFunctions = [];
    }
    this.bigWinVolcanoFunctions.push({
      stop: () => {
        isActive = false;
        if (eruptionTimer) {
          clearTimeout(eruptionTimer);
        }
      },
    });
  }

  async startBigWinVolcanoAnimations(volcanoesContainer, volcanoConfigs) {
    const volcanoElements = {
      left: volcanoesContainer.querySelector(".volcano-left img"),
      center: volcanoesContainer.querySelector(".volcano-center img"),
      right: volcanoesContainer.querySelector(".volcano-right img"),
    };

    if (
      !volcanoElements.left ||
      !volcanoElements.center ||
      !volcanoElements.right
    )
      return;

    const createGlowElement = (volcanoWrapper) => {
      const glowElement = document.createElement("div");
      glowElement.className = "volcano-glow";
      glowElement.style.opacity = "0";
      glowElement.style.animation = "none";
      volcanoWrapper.appendChild(glowElement);
      return glowElement;
    };

    const glowElements = {};
    volcanoConfigs.forEach((config) => {
      const wrapper = volcanoesContainer.querySelector(
        `.volcano-${config.position}`
      );
      if (wrapper) {
        glowElements[config.position] = createGlowElement(wrapper);
      }
    });

    const createFireElement = (volcanoWrapper) => {
      const fireContainer = document.createElement("div");
      fireContainer.className = "volcano-fire-container";

      for (let i = 0; i < 3; i++) {
        const flame = document.createElement("div");
        flame.className = "flame";
        fireContainer.appendChild(flame);
      }

      for (let i = 0; i < 8; i++) {
        const smoke = document.createElement("div");
        smoke.className = "smoke";
        fireContainer.appendChild(smoke);
      }

      volcanoWrapper.appendChild(fireContainer);
      return fireContainer;
    };

    const fireElements = {};
    volcanoConfigs.forEach((config) => {
      const wrapper = volcanoesContainer.querySelector(
        `.volcano-${config.position}`
      );
      if (wrapper) {
        fireElements[config.position] = createFireElement(wrapper);
      }
    });

    const explosions = {
      left: { app: null, sprite: null, canvas: null },
      center: { app: null, sprite: null, canvas: null },
      right: { app: null, sprite: null, canvas: null },
    };

    if (!this.bigWinVolcanoTimers) {
      this.bigWinVolcanoTimers = [];
    }
    if (!this.bigWinVolcanoFunctions) {
      this.bigWinVolcanoFunctions = [];
    }

    const createEruptionAnimation = (
      volcanoImg,
      explosionData,
      glowElement,
      fireElement,
      delay
    ) => {
      let eruptionTimer = null;
      let isActive = true;

      const eruption = () => {
        if (!isActive) return;

        const timeline = gsap.timeline({
          delay: delay,
          onComplete: () => {
            if (!isActive) return;
            const nextDelay = 3 + Math.random() * 4;
            eruptionTimer = setTimeout(eruption, nextDelay * 1000);
            this.bigWinVolcanoTimers.push(eruptionTimer);
          },
        });

        if (explosionData.canvas) {
          gsap.set(explosionData.canvas, { opacity: 1 });
        }

        timeline.to(
          glowElement,
          {
            opacity: 1,
            scale: 1.2,
            duration: 0.2,
            ease: "power2.out",
          },
          0
        );

        if (fireElement) {
          timeline.to(
            fireElement,
            {
              opacity: 1,
              duration: 0.2,
              ease: "power2.out",
            },
            0
          );
        }

        timeline.to(volcanoImg, {
          scaleY: 1.15,
          duration: 0.3,
          ease: "power2.out",
          transformOrigin: "bottom center",
          onStart: () => {
            if (explosionData.app && explosionData.sprite) {
              if (explosionData.app.ticker) {
                explosionData.app.ticker.start();
              }
              explosionData.sprite.visible = true;
              explosionData.sprite.gotoAndPlay(0);
            }
          },
        });

        timeline.to(volcanoImg, {
          scaleY: 1,
          duration: 0.5,
          ease: "power2.in",
        });

        timeline.to(
          glowElement,
          {
            opacity: 0,
            scale: 1,
            duration: 0.4,
            ease: "power2.out",
          },
          "-=0.4"
        );

        if (fireElement) {
          timeline.to(
            fireElement,
            {
              opacity: 0,
              duration: 0.4,
              ease: "power2.out",
            },
            "-=0.4"
          );
        }

        if (explosionData.canvas) {
          timeline.to(
            explosionData.canvas,
            {
              opacity: 0,
              duration: 0.4,
              ease: "power2.out",
              onComplete: () => {
                if (explosionData.sprite) {
                  explosionData.sprite.visible = false;
                }
                if (explosionData.app && explosionData.app.ticker) {
                  explosionData.app.ticker.stop();
                }
                if (explosionData.canvas) {
                  gsap.set(explosionData.canvas, { opacity: 1 });
                }
              },
            },
            "-=0.2"
          );
        }
      };

      const eruptionControl = {
        stop: () => {
          isActive = false;
          if (eruptionTimer) {
            clearTimeout(eruptionTimer);
          }
          gsap.killTweensOf(volcanoImg);
          gsap.killTweensOf(explosionData.canvas);
          gsap.killTweensOf(glowElement);
          if (fireElement) {
            gsap.killTweensOf(fireElement);
          }
        },
      };
      this.bigWinVolcanoFunctions.push(eruptionControl);

      const initialDelay = delay + Math.random() * 2;
      eruptionTimer = setTimeout(eruption, initialDelay * 1000);
      this.bigWinVolcanoTimers.push(eruptionTimer);
    };

    createEruptionAnimation(
      volcanoElements.left,
      explosions.left,
      glowElements.left,
      fireElements.left,
      0
    );
    createEruptionAnimation(
      volcanoElements.center,
      explosions.center,
      glowElements.center,
      fireElements.center,
      1
    );
    createEruptionAnimation(
      volcanoElements.right,
      explosions.right,
      glowElements.right,
      fireElements.right,
      2
    );

    this.bigWinExplosionApps = explosions;
  }

  async createBigWinCoinExplosion(volcanoesContainer) {
    await PIXI.Assets.load(coinSpritesheetUrl);
    const coinTexture = PIXI.Texture.from(coinSpritesheetUrl);
    const baseTexture = coinTexture.baseTexture;

    const cols = 4;
    const rows = 2;
    const frameWidth = baseTexture.width / cols;
    const frameHeight = baseTexture.height / rows;

    const coinTextures = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const frameRect = new PIXI.Rectangle(
          col * frameWidth,
          row * frameHeight,
          frameWidth,
          frameHeight
        );
        const frameTexture = new PIXI.Texture(baseTexture, frameRect);
        frameTexture.defaultAnchor = new PIXI.Point(0.5, 0.5);
        coinTextures.push(frameTexture);
      }
    }

    const volcanoWrappers = [
      volcanoesContainer.querySelector(".volcano-left"),
      volcanoesContainer.querySelector(".volcano-center"),
      volcanoesContainer.querySelector(".volcano-right"),
    ].filter(Boolean);

    if (volcanoWrappers.length === 0) return;

    const coinsCanvas = document.createElement("canvas");
    coinsCanvas.className = "big-win-coins-canvas";
    coinsCanvas.width = window.innerWidth;
    coinsCanvas.height = window.innerHeight;
    coinsCanvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 999;
    `;
    document.body.appendChild(coinsCanvas);

    const coinsApp = new PIXI.Application({
      view: coinsCanvas,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x000000,
      backgroundAlpha: 0,
      resolution: Math.min(window.devicePixelRatio || 1, 1.5),
      autoDensity: true,
      antialias: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
      clearBeforeRender: true,
    });

    coinsCanvas._pixiApp = coinsApp;

    const coins = [];
    volcanoWrappers.forEach((volcanoWrapper, volcanoIndex) => {
      const rect = volcanoWrapper.getBoundingClientRect();
      const volcanoX = rect.left + rect.width / 2;
      const volcanoY = rect.top + rect.height / 2;

      const coinsPerVolcano = 6 + Math.floor(Math.random() * 3);
      for (let i = 0; i < coinsPerVolcano; i++) {
        const coin = new PIXI.AnimatedSprite(coinTextures);
        coin.anchor.set(0.5, 0.5);
        coin.x = volcanoX;
        coin.y = volcanoY;
        coin.animationSpeed = 0.3;
        coin.loop = true;
        coin.play();
        coin.visible = true;
        coin.alpha = 1.0;

        const scale = 0.065 + Math.random() * 0.065;
        coin.scale.set(scale, scale);

        const angle = (Math.PI * 2 * i) / coinsPerVolcano + Math.random() * 0.5;
        const speed = 3 + Math.random() * 4;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 3;

        coins.push({
          sprite: coin,
          vx,
          vy,
          rotationSpeed: (Math.random() - 0.5) * 0.15,
          startTime: performance.now(),
          fadeStartTime: 0.6,
        });

        coinsApp.stage.addChild(coin);
      }
    });

    const startTime = performance.now();
    const duration = 2000;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      coins.forEach((coin) => {
        if (performance.now() < coin.startTime) {
          return;
        }

        coin.sprite.x += coin.vx;
        coin.sprite.y += coin.vy;
        coin.vy += 0.3;
        coin.sprite.rotation += coin.rotationSpeed;

        let alpha = 1.0;
        if (progress > coin.fadeStartTime) {
          const fadeProgress =
            (progress - coin.fadeStartTime) / (1 - coin.fadeStartTime);
          alpha = 1.0 - fadeProgress;
        }
        coin.sprite.alpha = Math.max(0, alpha);

        if (
          coin.sprite.alpha <= 0 ||
          coin.sprite.x < -100 ||
          coin.sprite.x > window.innerWidth + 100 ||
          coin.sprite.y > window.innerHeight + 100
        ) {
          coin.sprite.visible = false;
        }
      });

      const hasVisibleCoins = coins.some(
        (coin) => coin.sprite.visible && coin.sprite.alpha > 0
      );

      if (progress < 1 || hasVisibleCoins) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          try {
            coinsApp.stage.removeChildren();
            coinsApp.destroy(true, { children: true });
            if (coinsCanvas.parentNode) {
              coinsCanvas.parentNode.removeChild(coinsCanvas);
            }
          } catch (e) {
            // Ignore
          }
        }, 500);
      }
    };

    animate();
  }

  focusWithdrawButton() {
    const bigWinCoinsCanvas = document.querySelector(".big-win-coins-canvas");
    if (bigWinCoinsCanvas) {
      try {
        if (bigWinCoinsCanvas._pixiApp) {
          const app = bigWinCoinsCanvas._pixiApp;
          app.stage.removeChildren();
          app.destroy(true, { children: true });
        }
        if (bigWinCoinsCanvas.parentNode) {
          bigWinCoinsCanvas.parentNode.removeChild(bigWinCoinsCanvas);
        }
      } catch (e) {
        // Ignore
      }
    }

    const withdrawButton = this.screen.querySelector(".withdraw-button");
    if (!withdrawButton) return;

    const refreshButton = this.screen.querySelector(".refresh-button");
    if (refreshButton) {
      refreshButton.disabled = true;
      refreshButton.style.opacity = "0.5";
      refreshButton.style.pointerEvents = "none";
      refreshButton.style.cursor = "not-allowed";
      gsap.killTweensOf(refreshButton);
    }

    if (this.zigzagOutline) {
      gsap.to(this.zigzagOutline, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          if (this.zigzagOutline && this.zigzagOutline.parentNode) {
            this.zigzagOutline.remove();
          }
          this.zigzagOutline = null;
        },
      });
    }

    if (this.jokerWinApps && this.jokerWinApps.length > 0) {
      const jokerCells = this.screen.querySelectorAll(
        `.slot-cell[data-row="1"]`
      );

      jokerCells.forEach((cell) => {
        const canvas = cell.querySelector(".joker-win-canvas");

        if (canvas) {
          const app = canvas._pixiApp;
          if (app) {
            try {
              app.destroy(true, { children: true });
            } catch (e) {
              // Ignore
            }
          }
          canvas.remove();
        }

        const existingStatic = cell.querySelector(".joker-static");
        if (!existingStatic) {
          const staticImg = document.createElement("img");
          staticImg.src = "assets/ui/joker/joker-static.png";
          staticImg.className = "joker-static";
          staticImg.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            transform-origin: center center;
          `;
          cell.replaceChildren();
          cell.appendChild(staticImg);
        } else {
          existingStatic.style.display = "block";
          existingStatic.style.opacity = "1";
        }
      });

      this.jokerWinApps.forEach((app) => {
        try {
          if (app.ticker) app.ticker.stop();
          if (app.stage) {
            app.stage.removeChildren();
            app.stage.destroy({ children: true });
          }
          if (app.renderer && !app.renderer.destroyed) {
            app.renderer.destroy(true);
          }
          app.destroy(true, { children: true });
        } catch (e) {
          // console.warn("Error destroying joker app:", e);
        }
      });
      this.jokerWinApps = [];
    }

    const volcanoLeft = this.screen.querySelector(".volcano-left");
    const volcanoCenter = this.screen.querySelector(".volcano-center");
    const volcanoRight = this.screen.querySelector(".volcano-right");

    if (this.volcanoEruptionTimers) {
      this.volcanoEruptionTimers.forEach((timer) => {
        clearTimeout(timer);
      });
      this.volcanoEruptionTimers = [];
    }

    if (this.volcanoEruptionFunctions) {
      this.volcanoEruptionFunctions.forEach((control) => {
        control.stop();
      });
      this.volcanoEruptionFunctions = [];
    }

    [volcanoLeft, volcanoCenter, volcanoRight].forEach((volcano) => {
      if (volcano) {
        gsap.killTweensOf(volcano);
        gsap.set(volcano, { scaleY: 1 });
      }
    });

    if (this.animationFrames && this.animationFrames.size > 0) {
      this.animationFrames.forEach((frameId) => {
        cancelAnimationFrame(frameId);
      });
      this.animationFrames.clear();
    }

    const pulseAnim = gsap.to(withdrawButton, {
      scale: 1.1,
      duration: 0.5,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    this.gsapAnimations.push(pulseAnim);

    withdrawButton.style.boxShadow = "0 0 20px rgba(0, 255, 0, 0.8)";
    withdrawButton.style.transition = "box-shadow 0.3s ease";
  }

  createZigzagOutline(winningRow) {
    const slotGrid = this.screen.querySelector(".slot-grid");
    if (!slotGrid) return;

    const winningCells = Array.from(
      this.screen.querySelectorAll(`.slot-cell[data-row="${winningRow}"]`)
    );

    if (winningCells.length === 0) return;

    const slotFrame = this.screen.querySelector(".slot-frame");
    const fieldContainer = this.screen.querySelector(".field-container");

    let fieldWidth = 0;
    let fieldLeft = 0;

    if (slotFrame && fieldContainer) {
      const frameRect = slotFrame.getBoundingClientRect();
      const containerRect = fieldContainer.getBoundingClientRect();
      fieldWidth = frameRect.width;
      fieldLeft = frameRect.left - containerRect.left;
    }

    const firstCell = winningCells[0];
    const lastCell = winningCells[winningCells.length - 1];

    const firstRect = firstCell.getBoundingClientRect();
    const lastRect = lastCell.getBoundingClientRect();
    const gridRect = slotGrid.getBoundingClientRect();
    const cellHeight = lastRect.bottom - firstRect.top;
    const verticalPadding = cellHeight * 0.3;
    const top = firstRect.top - gridRect.top - verticalPadding;
    const bottom = lastRect.bottom - gridRect.top + verticalPadding;
    const height = bottom - top;

    let width, left;
    if (fieldWidth > 0 && fieldContainer) {
      const rightTrim = fieldWidth * 0.04;
      width = fieldWidth - rightTrim;

      const fieldRect = slotFrame.getBoundingClientRect();
      left = fieldRect.left - gridRect.left;
    } else {
      left = firstRect.left - gridRect.left;
      const right = lastRect.right - gridRect.left;
      const originalWidth = right - left;
      const rightTrim = originalWidth * 0.04;
      width = originalWidth - rightTrim;
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "lightning-outline");
    svg.style.position = "absolute";
    svg.style.left = `${left}px`;
    svg.style.top = `${top}px`;
    svg.style.width = `${width}px`;
    svg.style.height = `${height}px`;
    svg.style.pointerEvents = "none";
    svg.style.zIndex = "100";
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

    const gradient = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "linearGradient"
    );
    gradient.setAttribute("id", `lightningGradient-${winningRow}`);
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "100%");
    gradient.setAttribute("y2", "100%");

    const stop1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "stop"
    );
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "#ffffff");
    stop1.setAttribute("stop-opacity", "1");

    const stop2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "stop"
    );
    stop2.setAttribute("offset", "50%");
    stop2.setAttribute("stop-color", "#ffff00");
    stop2.setAttribute("stop-opacity", "1");

    const stop3 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "stop"
    );
    stop3.setAttribute("offset", "100%");
    stop3.setAttribute("stop-color", "#ffa500");
    stop3.setAttribute("stop-opacity", "1");

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    gradient.appendChild(stop3);
    defs.appendChild(gradient);

    const filter = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "filter"
    );
    filter.setAttribute("id", `lightningGlow-${winningRow}`);

    const feGaussianBlur = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feGaussianBlur"
    );
    feGaussianBlur.setAttribute("stdDeviation", "4");
    feGaussianBlur.setAttribute("result", "coloredBlur");

    const feMerge = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feMerge"
    );
    const feMergeNode1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feMergeNode"
    );
    feMergeNode1.setAttribute("in", "coloredBlur");
    const feMergeNode2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feMergeNode"
    );
    feMergeNode2.setAttribute("in", "SourceGraphic");

    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);
    filter.appendChild(feGaussianBlur);
    filter.appendChild(feMerge);
    defs.appendChild(filter);

    svg.appendChild(defs);

    const zigzagSize = Math.min(25, width / 6);
    const padding = 10;
    const cornerRadius = Math.min(20, Math.min(width, height) / 8);

    let pathData = ``;

    pathData += `M ${padding + cornerRadius} ${padding}`;

    let x = padding + cornerRadius;
    while (x < width - padding - cornerRadius) {
      const segmentLength = Math.min(
        zigzagSize * 1.5,
        width - padding - cornerRadius - x
      );
      const nextX = x + segmentLength;
      const midX = x + segmentLength / 2;
      const randomOffset = (Math.random() - 0.5) * zigzagSize * 0.6;
      pathData += ` Q ${midX} ${padding + randomOffset} ${nextX} ${padding}`;
      x = nextX;
    }

    pathData += ` L ${width - padding - cornerRadius} ${padding}`;
    pathData += ` Q ${width - padding} ${padding} ${width - padding} ${
      padding + cornerRadius
    }`;

    pathData += ` L ${width - padding} ${height - padding - cornerRadius}`;

    pathData += ` Q ${width - padding} ${height - padding} ${
      width - padding - cornerRadius
    } ${height - padding}`;

    x = width - padding - cornerRadius;
    while (x > padding + cornerRadius) {
      const segmentLength = Math.min(
        zigzagSize * 1.5,
        x - padding - cornerRadius
      );
      const prevX = x - segmentLength;
      const midX = x - segmentLength / 2;
      const randomOffset = (Math.random() - 0.5) * zigzagSize * 0.6;
      pathData += ` Q ${midX} ${height - padding + randomOffset} ${prevX} ${
        height - padding
      }`;
      x = prevX;
    }

    pathData += ` L ${padding + cornerRadius} ${height - padding}`;
    pathData += ` Q ${padding} ${height - padding} ${padding} ${
      height - padding - cornerRadius
    }`;

    pathData += ` L ${padding} ${padding + cornerRadius}`;

    pathData += ` Q ${padding} ${padding} ${
      padding + cornerRadius
    } ${padding} Z`;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", `url(#lightningGradient-${winningRow})`);
    path.setAttribute("stroke-width", "4");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("filter", `url(#lightningGlow-${winningRow})`);

    const path2 = path.cloneNode(true);
    path2.setAttribute("stroke-width", "2");
    path2.setAttribute("opacity", "0.6");

    svg.appendChild(path2);
    svg.appendChild(path);
    slotGrid.appendChild(svg);

    requestAnimationFrame(() => {
      const pathLength = path.getTotalLength();
      if (pathLength > 0) {
        path.setAttribute("stroke-dasharray", pathLength);
        path.setAttribute("stroke-dashoffset", pathLength);
        path2.setAttribute("stroke-dasharray", pathLength);
        path2.setAttribute("stroke-dashoffset", pathLength);

        gsap.from(svg, {
          opacity: 0,
          scale: 0.95,
          duration: 0.5,
          ease: "power2.out",
        });

        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 0.8,
          ease: "power2.out",
          delay: 0.2,
        });

        gsap.to(path2, {
          strokeDashoffset: 0,
          duration: 0.8,
          ease: "power2.out",
          delay: 0.3,
          onComplete: () => {
            gsap.to([path, path2], {
              opacity: 0.3,
              duration: 0.15,
              yoyo: true,
              repeat: -1,
              ease: "sine.inOut",
            });

            gsap.to(path, {
              strokeWidth: 6,
              duration: 0.3,
              yoyo: true,
              repeat: -1,
              ease: "sine.inOut",
            });
          },
        });
      }
    });

    this.zigzagOutline = svg;
  }

  async animateJokerWin(jokerCells) {
    const jokerApps = [];

    playSound(sound8Url);

    setTimeout(() => {
      playSound(sound9Url);
    }, 1000);

    await PIXI.Assets.load(jokerSpritesheetUrl);

    const jokerTexture = PIXI.Texture.from(jokerSpritesheetUrl);
    const jokerBaseTexture = jokerTexture.baseTexture;

    const texture = jokerTexture;
    const baseTexture = jokerBaseTexture;

    const cols = CONFIG.JOKER_WIN.COLS;
    const rows = CONFIG.JOKER_WIN.ROWS;
    const frameWidth = baseTexture.width / cols;
    const frameHeight = baseTexture.height / rows;

    const textures = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const frameRect = new PIXI.Rectangle(
          col * frameWidth,
          row * frameHeight,
          frameWidth,
          frameHeight
        );
        const frameTexture = new PIXI.Texture(baseTexture, frameRect);
        textures.push(frameTexture);
      }
    }

    const sortedCells = Array.from(jokerCells).sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      return rectA.left - rectB.left;
    });

    for (let index = 0; index < sortedCells.length; index++) {
      const cell = sortedCells[index];
      const delay = index * 0.2;
      const staticImg = cell.querySelector(".joker-static");
      if (!staticImg) continue;

      const rect = cell.getBoundingClientRect();
      const canvasWidth = rect.width || 200;
      const canvasHeight = rect.height || 200;
      const canvas = document.createElement("canvas");
      canvas.className = "joker-win-canvas";
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvas.style.opacity = "0";
      canvas.style.zIndex = "2";
      cell.appendChild(canvas);

      const app = new PIXI.Application({
        view: canvas,
        width: canvas.width,
        height: canvas.height,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });

      const animatedJoker = new PIXI.AnimatedSprite(textures);
      animatedJoker.anchor.set(0.5);
      animatedJoker.x = app.screen.width / 2;
      animatedJoker.y = app.screen.height / 2;
      animatedJoker.animationSpeed = CONFIG.JOKER_WIN.SPRITE_SPEED;
      animatedJoker.loop = false;
      animatedJoker.visible = false;

      const scale = Math.min(
        app.screen.width / frameWidth,
        app.screen.height / frameHeight
      );
      animatedJoker.scale.set(scale * 1.17);

      app.stage.addChild(animatedJoker);
      jokerApps.push(app);

      const timeline = gsap.timeline({
        delay: delay,
      });

      timeline.to(staticImg, {
        opacity: 0,
        scale: 0.8,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          staticImg.style.display = "none";
        },
      });

      timeline.to(
        canvas,
        {
          opacity: 1,
          scale: 0.75,
          duration: 0.2,
          ease: "power2.out",
          onStart: () => {
            animatedJoker.visible = true;
            animatedJoker.play();
          },
        },
        "-=0.2"
      );

      timeline.to(canvas, {
        scale: 1.5,
        duration: 0.5,
        ease: "back.out(1.5)",
      });
      this.gsapAnimations.push(timeline);

      timeline.to(canvas, {
        scale: 1,
        duration: 0.4,
        ease: "back.in(1.2)",
        delay: 0.3,
      });
    }

    return jokerApps;
  }

  createCoinRainEffect() {
    for (let i = 0; i < CONFIG.SLOT_MACHINE.COIN_RAIN_PARTICLES; i++) {
      const coin = document.createElement("img");
      coin.src = "assets/ui/coin/coin.png";
      coin.className = "coin-particle";
      coin.style.cssText = `
        position: fixed;
        width: clamp(2rem, 5vw, 4rem);
        height: clamp(2rem, 5vw, 4rem);
        left: ${Math.random() * 100}vw;
        top: -10vh;
        pointer-events: none;
        z-index: 999;
      `;
      document.body.appendChild(coin);
      this.coinParticles.push(coin);

      const anim = gsap.to(coin, {
        y: "120vh",
        rotation: Math.random() * 720 - 360,
        duration: 2 + Math.random() * 2,
        delay: Math.random() * 1,
        ease: "power1.in",
        onComplete: () => coin.remove(),
      });
      this.gsapAnimations.push(anim);
    }
  }

  showPlayNowCTA() {
    const playNowBtn = document.createElement("button");
    playNowBtn.className = "play-now-button";
    playNowBtn.textContent = "PLAY NOW";
    document.body.appendChild(playNowBtn);

    gsap.from(playNowBtn, {
      scale: 0,
      opacity: 0,
      duration: 0.5,
      ease: "back.out",
    });

    const handlePlayNow = () => {
      this.triggerCTA("play_now_clicked");
    };

    playNowBtn.addEventListener("click", handlePlayNow);
    this.eventListeners.push({
      element: playNowBtn,
      type: "click",
      handler: handlePlayNow,
    });

    const handlePlayNowTouch = (e) => {
      e.preventDefault();
      handlePlayNow();
    };
    playNowBtn.addEventListener("touchstart", handlePlayNowTouch, {
      passive: false,
    });
    this.eventListeners.push({
      element: playNowBtn,
      type: "touchstart",
      handler: handlePlayNowTouch,
    });
  }

  async showNormalWin(winResult) {
    await new Promise((resolve) =>
      setTimeout(resolve, CONFIG.SLOT_MACHINE.NORMAL_WIN_DISPLAY_DURATION)
    );
  }

  destroy() {
    this.animationFrames.forEach((id) => cancelAnimationFrame(id));
    this.animationFrames.clear();

    this.gsapAnimations.forEach((anim) => anim?.kill());
    this.gsapAnimations = [];

    gsap.killTweensOf(".slot-column");
    gsap.killTweensOf(".slot-cell");
    gsap.killTweensOf(".big-win-banner");
    gsap.killTweensOf(".coin-particle");
    gsap.killTweensOf(".left-panel > *");
    gsap.killTweensOf(".right-panel > *");
    gsap.killTweensOf(".refresh-button");
    gsap.killTweensOf(".withdraw-button");

    if (this.sparklesApp) {
      this.animationFrames.forEach((id) => cancelAnimationFrame(id));
      this.animationFrames.clear();

      if (this.sparklesApp.ticker) {
        this.sparklesApp.ticker.stop();
      }

      if (this.sparklesApp.stage) {
        this.sparklesApp.stage.removeChildren();
      }

      const canvas = this.sparklesApp.view;
      if (canvas && canvas._pixiApp) {
        canvas._pixiApp = null;
      }

      this.sparklesApp.destroy(true, {
        children: true,
      });
      this.sparklesApp = null;
    }
    this.sparklesData = null;

    Object.values(this.volcanoApps).forEach((app) => {
      if (app && app.ticker) {
        app.ticker.stop();
      }
      app?.destroy(true, { children: true });
    });
    this.volcanoApps = {};

    if (this.jokerWinApps) {
      this.jokerWinApps.forEach((app) => {
        if (app && app.ticker) {
          app.ticker.stop();
        }
        app?.destroy(true, { children: true });
      });
      this.jokerWinApps = [];
    }

    this.eventListeners.forEach((entry) => {
      if (entry.element && entry.type && entry.handler) {
        entry.element.removeEventListener(entry.type, entry.handler);
      } else if (entry.type === "resize" && entry.handler) {
        window.removeEventListener(entry.type, entry.handler);
      }
    });
    this.eventListeners = [];

    this.coinParticles.forEach((coin) => coin.remove());
    this.coinParticles = [];

    document
      .querySelectorAll(
        ".slot-machine-screen, .big-win-banner, .coin-particle, .install-overlay, .play-now-button"
      )
      .forEach((el) => el.remove());
  }
}

class Game {
  constructor() {
    this.loadingScreen = document.getElementById("loading-screen");
    this.chestScreen = document.getElementById("chest-screen");
    this.progressBar = document.getElementById("progress-bar");
    this.chestWrappers = document.querySelectorAll(".chest-wrapper");
    this.customCursor = document.getElementById("custom-cursor");

    this.isLoaded = false;
    this.selectedChest = null;
    this.winningChests = [];
    this.winAmounts = {};

    if (!window._globalCursorMouse) {
      window._globalCursorMouse = { x: 0, y: 0 };
    }
    this.mouseX = window._globalCursorMouse.x;
    this.mouseY = window._globalCursorMouse.y;

    this.loadingApp = null;
    this.chestApp = null;
    this.chestAnimationApps = {};

    this.resources = {};

    this.animationFrames = new Set();

    this.chestPulseAnimations = [];
    this.chestPulseAnimationsByIndex = {};

    this.chestHoverAnimations = {};

    this.eventListeners = {
      resize: null,
      mousemove: null,
      mouseleave: null,
      chestWrappers: [],
    };

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

    document.addEventListener("selectstart", preventSelect, { passive: false });
    document.addEventListener("contextmenu", preventContextMenu, {
      passive: false,
    });
    document.addEventListener("dragstart", preventDrag, { passive: false });

    document.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    this.eventListeners.preventSelection = {
      selectstart: preventSelect,
      contextmenu: preventContextMenu,
      dragstart: preventDrag,
    };
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
    }

    const handleResize = () => {
      if (this.loadingApp && this.loadingApp.renderer) {
        this.loadingApp.renderer.resize(window.innerWidth, window.innerHeight);
      }
      if (this.chestApp && this.chestApp.renderer) {
        this.chestApp.renderer.resize(window.innerWidth, window.innerHeight);
      }
    };

    this.eventListeners.resize = handleResize;
    window.addEventListener("resize", handleResize);
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
        this.resources = bundle;
        this.onAssetsLoaded();
      })
      .catch((error) => {
        // console.error("Error loading assets:", error);
        this.onAssetsLoaded();
      });
  }

  updateProgress(percent) {
    if (this.progressBar) {
      this.progressBar.style.width = `${percent}%`;
    }
  }

  onAssetsLoaded() {
    this.updateProgress(100);
    setTimeout(() => {
      this.startSparklesAnimation();
      setTimeout(() => {
        this.showChestScreen();
      }, CONFIG.TIMING.SPARKLES_DELAY);
    }, CONFIG.TIMING.LOADING_DELAY);
  }

  startSparklesAnimation() {
    if (!this.loadingApp || !this.chestApp) return;

    const colors = [
      { main: 0xffb6c1, glow: 0xff69b4 },
      { main: 0xadd8e6, glow: 0x87ceeb },
      { main: 0xffff99, glow: 0xffd700 },
    ];

    const loadingSparkles = this.createSparklesContainer(
      this.loadingApp,
      CONFIG.PARTICLES.SPARKLE_COUNT,
      colors
    );

    const chestSparkles = this.createSparklesContainer(
      this.chestApp,
      CONFIG.PARTICLES.SPARKLE_COUNT,
      colors
    );

    this.createFogEffect(this.loadingApp);
    this.createFogEffect(this.chestApp);

    let lastUpdateTime = 0;
    const frameInterval = 1000 / CONFIG.PARTICLES.TARGET_FPS;

    let cachedLoadingActive = false;
    let cachedChestActive = false;
    let cachedSlotMachineActive = false;
    let lastScreenCheck = 0;
    const screenCheckInterval = 500;

    const animate = (currentTime) => {
      const frameId = requestAnimationFrame(animate);
      this.animationFrames.add(frameId);

      if (currentTime - lastUpdateTime >= frameInterval) {
        const startTime = performance.now();

        if (currentTime - lastScreenCheck >= screenCheckInterval) {
          cachedLoadingActive =
            this.loadingScreen?.classList.contains("active") &&
            this.loadingApp &&
            this.loadingApp.renderer &&
            !this.loadingApp.renderer.destroyed;

          cachedChestActive =
            this.chestScreen?.classList.contains("active") &&
            this.chestApp &&
            this.chestApp.renderer &&
            !this.chestApp.renderer.destroyed;

          cachedSlotMachineActive =
            this.slotMachine &&
            this.slotMachine.sparklesApp &&
            this.slotMachine.sparklesData &&
            this.slotMachine.sparklesApp.renderer &&
            !this.slotMachine.sparklesApp.renderer.destroyed &&
            this.slotMachine.screen &&
            document.body.contains(this.slotMachine.screen);

          lastScreenCheck = currentTime;
        }

        if (cachedLoadingActive) {
          this.updateSparkles(loadingSparkles, this.loadingApp);
          this.loadingApp.renderer.render(this.loadingApp.stage);
        }

        if (cachedChestActive) {
          this.updateSparkles(chestSparkles, this.chestApp);
          this.chestApp.renderer.render(this.chestApp.stage);
        }

        if (cachedSlotMachineActive) {
          this.updateSparkles(
            this.slotMachine.sparklesData,
            this.slotMachine.sparklesApp
          );
          this.slotMachine.sparklesApp.renderer.render(
            this.slotMachine.sparklesApp.stage
          );
        }

        const endTime = performance.now();
        const executionTime = endTime - startTime;

        if (executionTime > 16) {
          console.warn(`⚠️ Sparkles RAF slow: ${executionTime.toFixed(2)}ms`);
        }

        lastUpdateTime = currentTime;
      }
    };

    animate(0);
  }

  createFogTexture(app) {
    const size = 150;
    const graphics = new PIXI.Graphics();

    const blueTints = [
      0x1e88e5, 0x42a5f5, 0x64b5f6, 0x90caf9, 0x2196f3, 0x0d47a1,
    ];
    for (let i = 0; i < 8; i++) {
      const radius = size * (0.2 + Math.random() * 0.5);
      const x = size / 2 + (Math.random() - 0.5) * size * 0.4;
      const y = size / 2 + (Math.random() - 0.5) * size * 0.4;
      const alpha = 0.01 + Math.random() * 0.015;
      const tintColor = blueTints[Math.floor(Math.random() * blueTints.length)];

      graphics.beginFill(tintColor, alpha);
      graphics.drawCircle(x, y, radius);
      graphics.endFill();
    }

    const texture = app.renderer.generateTexture(
      graphics,
      PIXI.SCALE_MODES.LINEAR,
      1
    );

    graphics.destroy();
    return texture;
  }

  createFogEffect(app) {
    if (!app || !app.renderer) return;

    const smokes = new PIXI.Container();
    smokes.filters = [new BlurFilter(4)];
    app.stage.addChild(smokes);

    const smokeTexture = this.createFogTexture(app);
    const smokeParticles = [];
    const particleCount = Math.min(15, CONFIG.PARTICLES.FOG_COUNT);

    const r = (min, max) => {
      return Math.floor(Math.random() * (max - min) + 1) + min;
    };

    for (let p = 0; p < particleCount; p++) {
      const particle = new PIXI.Sprite(smokeTexture);
      const centerX = app.screen.width / 2;
      const centerY = app.screen.height * (0.7 + Math.random() * 0.1);

      particle.position.set(
        centerX - (Math.random() * 500 - 250),
        centerY - (Math.random() * 300 - 150)
      );
      particle.anchor.set(0.5);
      particle.rotation = Math.random() * 360;
      particle.alpha = 0.2 + Math.random() * 0.15;
      particle.blendMode = PIXI.BLEND_MODES.ADD;
      const blueTints = [
        0xff4500, 0xff6600, 0xffaa00, 0xff0000, 0xff8800, 0xffcc00, 0xff5500,
        0xff9900,
      ];
      particle.tint = blueTints[Math.floor(Math.random() * blueTints.length)];

      particle._speed = (r(0, 100) - 50) / 10000;

      smokes.addChild(particle);
      smokeParticles.push(particle);

      const duration = 20 + Math.random() * 30;
      const distanceX = (Math.random() - 0.5) * app.screen.width * 0.8;
      const distanceY = (Math.random() - 0.5) * app.screen.height * 0.8;

      gsap.to(particle, {
        x: particle.x + distanceX,
        y: particle.y + distanceY,
        duration: duration,
        ease: "none",
        repeat: -1,
        yoyo: true,
      });

      gsap.to(particle, {
        alpha: 0.1 + Math.random() * 0.15,
        duration: 3 + Math.random() * 4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      const scale = 0.4 + Math.random() * 0.4;
      gsap.to(particle.scale, {
        x: scale * 1.2,
        y: scale * 1.2,
        duration: 4 + Math.random() * 3,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }

    app.ticker.speed = 0.3;
    app.ticker.add((delta) => {
      let sp = smokeParticles.length;
      while (sp--) {
        const x = smokeParticles[sp]._speed;
        smokeParticles[sp].rotation += delta * x;
      }
    });

    smokes._smokeParticles = smokeParticles;
    smokes._smokeTexture = smokeTexture;
  }

  createSparklesContainer(app, count, colors) {
    const container = new PIXI.Container();
    app.stage.addChild(container);

    const textures = colors.map((color) => {
      const graphics = new PIXI.Graphics();
      graphics.beginFill(color.glow, 1);
      graphics.drawEllipse(0, 0, 15, 3);
      graphics.endFill();
      const texture = app.renderer.generateTexture(
        graphics,
        PIXI.SCALE_MODES.LINEAR,
        1
      );
      graphics.destroy();
      return texture;
    });

    const sparkles = [];
    const width = app.screen.width;
    const height = app.screen.height;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 2;
      const colorIndex = Math.floor(Math.random() * colors.length);
      const color = colors[colorIndex];

      const sprite = new PIXI.Sprite(textures[colorIndex]);
      sprite.anchor.set(0.5);

      const sparkle = {
        sprite: sprite,
        textureIndex: colorIndex,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1.5,
        length: Math.random() * 10 + 7,
        angle: angle,
        color: color,
        opacity: Math.random() * 0.6 + 0.4,
        life: Math.random(),
        lifeSpeed: Math.random() * 0.01 + 0.005,
        depth: Math.random() * 0.5 + 0.5,
      };

      container.addChild(sparkle.sprite);
      sparkles.push(sparkle);
    }

    return { container, sparkles, width, height, textures };
  }

  updateSparkles(sparkleData, app) {
    if (!app || !app.renderer || app.renderer.destroyed || !app.stage) {
      return;
    }
    const { sparkles, width, height } = sparkleData;

    for (let i = 0; i < sparkles.length; i++) {
      const sparkle = sparkles[i];

      sparkle.life += sparkle.lifeSpeed;
      if (sparkle.life > 1) sparkle.life = 0;
      const lifeOpacity = Math.sin(sparkle.life * Math.PI) * 0.3 + 0.7;

      sparkle.x += sparkle.vx;
      sparkle.y += sparkle.vy;

      sparkle.angle = Math.atan2(sparkle.vy, sparkle.vx);

      if (sparkle.x < -sparkle.length) {
        sparkle.x = width + sparkle.length;
      } else if (sparkle.x > width + sparkle.length) {
        sparkle.x = -sparkle.length;
      }
      if (sparkle.y < -sparkle.length) {
        sparkle.y = height + sparkle.length;
      } else if (sparkle.y > height + sparkle.length) {
        sparkle.y = -sparkle.length;
      }

      const depthSize = sparkle.size * sparkle.depth;
      const depthLength = sparkle.length * sparkle.depth;
      const finalOpacity = sparkle.opacity * lifeOpacity * sparkle.depth;

      sparkle.sprite.x = sparkle.x;
      sparkle.sprite.y = sparkle.y;
      sparkle.sprite.rotation = sparkle.angle;
      sparkle.sprite.alpha = finalOpacity;
      const scaleX = depthLength / 2 / 15;
      const scaleY = depthSize / 3;
      sparkle.sprite.scale.set(scaleX, scaleY);
    }
  }

  showChestScreen() {
    requestAnimationFrame(() => {
      if (this.loadingScreen) {
        this.loadingScreen.classList.remove("active");
      }
      if (this.chestScreen) {
        this.chestScreen.classList.add("active");
      }
      this.isLoaded = true;

      this.setupChestInteractions();
      this.setupCustomCursor();
      this.startChestPulseAnimation();
    });

    const winCount = Math.floor(Math.random() * 2) + 1;
    const indices = [0, 1, 2];
    for (let i = 0; i < winCount; i++) {
      const randomIndex = Math.floor(Math.random() * indices.length);
      const winIndex = indices.splice(randomIndex, 1)[0];
      this.winningChests.push(winIndex);
      const winAmount =
        Math.floor(
          Math.random() * (CONFIG.WIN.MAX_LARGE - CONFIG.WIN.MIN_LARGE + 1)
        ) + CONFIG.WIN.MIN_LARGE;
      this.winAmounts[winIndex] = winAmount;
    }
  }

  setupCustomCursor() {
    if (!this.customCursor) return;

    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      this.customCursor.style.display = "none";
      return;
    }

    if (window._globalCursorInitialized) {
      this.attachChestCursorHandlers();
      return;
    }

    window._globalCursorInitialized = true;
    this.customCursor.style.display = "block";
    document.body.classList.add("custom-cursor-active");

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
      rafId = requestAnimationFrame(updateCursor);
      this.animationFrames.add(rafId);
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

    this.eventListeners.mousemove = handleMouseMove;
    this.eventListeners.mouseleave = handleMouseLeave;

    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    this.attachChestCursorHandlers();
  }

  attachChestCursorHandlers() {
    const handleWrapperMouseEnter = (wrapper) => () => {
      if (
        !wrapper.classList.contains("disabled") &&
        this.selectedChest === null &&
        this.customCursor
      ) {
        this.customCursor.classList.add("active");
      }
    };

    const handleWrapperMouseLeave = () => {
      if (this.selectedChest === null && this.customCursor) {
        this.customCursor.classList.remove("active");
      }
    };

    this.chestWrappers.forEach((wrapper) => {
      const enterHandler = handleWrapperMouseEnter(wrapper);
      const leaveHandler = handleWrapperMouseLeave;
      wrapper.addEventListener("mouseenter", enterHandler);
      wrapper.addEventListener("mouseleave", leaveHandler);

      this.eventListeners.chestWrappers.push({
        wrapper,
        handlers: [
          { type: "mouseenter", handler: enterHandler },
          { type: "mouseleave", handler: leaveHandler },
        ],
      });
    });
  }

  setupChestInteractions() {
    this.chestWrappers.forEach((wrapper, index) => {
      wrapper.setAttribute("data-chest-index", index);
      wrapper._chestIndex = index;

      const handleChestClick = (e) => {
        e.stopPropagation();
        if (this.selectedChest !== null) return;
        const chestIndex = wrapper._chestIndex;
        if (chestIndex !== undefined) {
          this.selectChest(chestIndex);
        }
      };

      const handleChestTouch = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.selectedChest !== null) return;
        const chestIndex = wrapper._chestIndex;
        if (chestIndex !== undefined) {
          this.selectChest(chestIndex);
        }
      };

      wrapper.addEventListener("click", handleChestClick, { passive: false });
      wrapper.addEventListener("touchstart", handleChestTouch, {
        passive: false,
      });

      let wrapperEntry = this.eventListeners.chestWrappers.find(
        (entry) => entry.wrapper === wrapper
      );
      if (!wrapperEntry) {
        wrapperEntry = { wrapper, handlers: [] };
        this.eventListeners.chestWrappers.push(wrapperEntry);
      }

      wrapperEntry.handlers.push(
        { type: "click", handler: handleChestClick },
        { type: "touchstart", handler: handleChestTouch }
      );

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

      wrapper.addEventListener("mouseenter", handleMouseEnter);
      wrapper.addEventListener("mouseleave", handleMouseLeave);

      if (!wrapperEntry) {
        wrapperEntry = { wrapper, handlers: [] };
        this.eventListeners.chestWrappers.push(wrapperEntry);
      }

      wrapperEntry.handlers.push(
        { type: "mouseenter", handler: handleMouseEnter },
        { type: "mouseleave", handler: handleMouseLeave }
      );
    });
  }

  startChestPulseAnimation() {
    this.stopChestPulseAnimation();

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

  stopChestPulseAnimation() {
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

  selectChest(index) {
    this.stopChestPulseAnimation();

    try {
      const clickSound = new Audio(sound3Url);
      clickSound.volume = 0.5;

      clickSound.onended = () => {
        playSound(sound2Url);
        playSound(sound4Url);
      };

      const playPromise = clickSound.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // console.warn("Failed to play click sound:", error);
        });
      }
    } catch (error) {
      // console.warn("Error creating click sound:", error);
      playSound(sound2Url);
      playSound(sound4Url);
    }

    this.selectedChest = index;
    const wrapper = this.chestWrappers[index];

    wrapper.classList.add("selected");

    this.winAmounts[index] = CONFIG.WIN.DEFAULT_AMOUNT;
    this.showWinAmount(wrapper, index);

    this.chestWrappers.forEach((w, i) => {
      if (i !== index) {
        w.classList.add("disabled", "dimmed");
      }
    });

    this.animateChestOpening(index, () => {
      wrapper.classList.add("opened");

      setTimeout(() => {
        this.chestWrappers.forEach((w, i) => {
          if (i !== index) {
            this.openDimmedChest(w);

            if (this.winningChests.includes(i)) {
              w.classList.add("win");
              this.showWinAmount(w, i);
            } else {
              if (!this.winAmounts[i]) {
                const smallAmount =
                  Math.floor(
                    Math.random() *
                      (CONFIG.WIN.MAX_SMALL - CONFIG.WIN.MIN_SMALL + 1)
                  ) + CONFIG.WIN.MIN_SMALL;
                this.winAmounts[i] = smallAmount;
              }
              w.classList.add("win");
              this.showWinAmount(w, i);
            }
          }
        });
      }, CONFIG.TIMING.CHEST_OPEN_DELAY);
    });
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

  async animateChestOpening(index, onComplete) {
    const wrapper = this.chestWrappers[index];
    if (!wrapper) {
      if (onComplete) onComplete();
      return;
    }

    const chestOpenResource = this.resources.chestOpenSheet;
    if (!chestOpenResource) {
      if (onComplete) onComplete();
      return;
    }

    const texture =
      chestOpenResource instanceof PIXI.Texture
        ? chestOpenResource
        : chestOpenResource;

    if (!texture || !(texture instanceof PIXI.Texture)) {
      console.error("animateChestOpening: invalid texture", texture);
      if (onComplete) onComplete();
      return;
    }

    const baseTexture = texture.baseTexture;

    if (!baseTexture) {
      console.error("animateChestOpening: baseTexture not found");
      if (onComplete) onComplete();
      return;
    }

    baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;

    if (!baseTexture.width || !baseTexture.height) {
      if (onComplete) onComplete();
      return;
    }

    const closedImage = wrapper.querySelector(".chest-closed");

    wrapper.classList.add("animating");

    const canvas = wrapper.querySelector(".chest-animation-canvas");
    if (!canvas) {
      if (onComplete) onComplete();
      return;
    }

    const chestContainer = wrapper.querySelector(".chest-container");
    const containerRect = chestContainer
      ? chestContainer.getBoundingClientRect()
      : null;
    const rect = canvas.getBoundingClientRect();

    let canvasWidth = rect.width || canvas.offsetWidth;
    let canvasHeight = rect.height || canvas.offsetHeight;

    if ((canvasWidth === 0 || canvasHeight === 0) && containerRect) {
      canvasWidth = containerRect.width || 200;
      canvasHeight = containerRect.height || 200;
    }

    if (canvasWidth === 0 || canvasHeight === 0) {
      canvasWidth = 200;
      canvasHeight = 200;
    }

    const targetResolution = window.devicePixelRatio || 1;

    const app = new PIXI.Application({
      view: canvas,
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: 0x000000,
      backgroundAlpha: 0,
      resolution: targetResolution,
      autoDensity: true,
      antialias: true,
      powerPreference: "high-performance",
    });

    this.chestAnimationApps[index] = app;

    app.renderer.roundPixels = true;

    const totalWidth = baseTexture.width;
    const totalHeight = baseTexture.height;
    const cols = 5;
    const rows = 3;
    const frameWidth = totalWidth / cols;
    const frameHeight = totalHeight / rows;
    const textures = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const frameX = col * frameWidth;
        const frameY = row * frameHeight;

        const frameRect = new PIXI.Rectangle(
          Math.floor(frameX),
          Math.floor(frameY),
          Math.floor(frameWidth),
          Math.floor(frameHeight)
        );

        const frameTexture = new PIXI.Texture(baseTexture, frameRect);
        frameTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;

        if (frameTexture && frameTexture.valid !== false) {
          textures.push(frameTexture);
        }
      }
    }

    const animatedSprite = new PIXI.AnimatedSprite(textures);
    animatedSprite.anchor.set(0.5);
    animatedSprite.x = Math.round(app.screen.width / 2);
    const centerY = Math.round(app.screen.height / 2);
    const startY = centerY - canvasHeight * 0.15;
    animatedSprite.y = startY;
    animatedSprite.roundPixels = true;

    const frameAspectRatio = frameWidth / frameHeight;
    const canvasAspectRatio = canvasWidth / canvasHeight;
    const maxWidth = canvasWidth * CONFIG.ANIMATION.SIZE_MULTIPLIER;
    const maxHeight = canvasHeight * CONFIG.ANIMATION.SIZE_MULTIPLIER;

    let targetWidth, targetHeight;

    if (frameAspectRatio > canvasAspectRatio) {
      targetWidth = maxWidth;
      targetHeight = targetWidth / frameAspectRatio;
    } else {
      targetHeight = maxHeight;
      targetWidth = targetHeight * frameAspectRatio;
    }

    animatedSprite.width = targetWidth;
    animatedSprite.height = targetHeight;

    animatedSprite.alpha = 0;

    animatedSprite.animationSpeed = CONFIG.ANIMATION.SPRITE_SPEED;
    animatedSprite.loop = false;
    animatedSprite.visible = true;

    app.stage.addChild(animatedSprite);

    let lastChestUpdateTime = performance.now();
    const chestFrameInterval = 1000 / 60;

    const animateChest = (currentTime) => {
      if (!app || !app.renderer || app.renderer.destroyed) {
        return;
      }

      const delta = (currentTime - lastChestUpdateTime) / 1000;
      lastChestUpdateTime = currentTime;

      if (animatedSprite && animatedSprite.playing) {
        animatedSprite.update(delta);
      }

      app.renderer.render(app.stage);

      requestAnimationFrame(animateChest);
    };

    requestAnimationFrame(animateChest);

    this.createChestCoinExplosion(wrapper, app, canvas);

    const winIndicator = wrapper.querySelector(".win-indicator");
    if (winIndicator) {
      wrapper.classList.add("win");

      const chestContainer = wrapper.querySelector(".chest-container");
      let startY = 0;

      if (chestContainer) {
        const containerRect = chestContainer.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();

        const chestCenterY =
          containerRect.top - wrapperRect.top + containerRect.height / 2;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const minTop = -18 * 16;
        const preferredTop = -viewportWidth * 0.45;
        const maxTop = -20 * 16;
        const finalTop = Math.max(minTop, Math.min(preferredTop, maxTop));

        startY = chestCenterY - finalTop;
      } else {
        const vh = window.innerHeight / 100;
        const minY = 15 * 16;
        const preferredY = 40 * vh;
        const maxY = 20 * 16;
        startY = Math.max(minY, Math.min(preferredY, maxY));
      }
      gsap.set(winIndicator, {
        opacity: 0,
        y: startY,
        scale: 0.3,
      });

      gsap.to(winIndicator, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: CONFIG.ANIMATION.HOVER_DURATION,
        ease: "sine.out",
      });
    }

    animatedSprite.alpha = 1;
    animatedSprite.y = centerY;

    if (closedImage) {
      closedImage.style.opacity = "0";
      closedImage.style.display = "none";
    }

    playSound(sound2Url);
    animatedSprite.play();

    animatedSprite.onComplete = () => {
      animatedSprite.stop();
      animatedSprite.gotoAndStop(animatedSprite.textures.length - 1);

      setTimeout(() => {
        this.animateChestsFlyAway();
      }, CONFIG.TIMING.FLY_AWAY_DELAY);

      setTimeout(() => {
        if (this.chestAnimationApps[index]) {
          const app = this.chestAnimationApps[index];
          app.destroy(true, {
            children: true,
          });
          delete this.chestAnimationApps[index];
        }
      }, CONFIG.TIMING.FLY_AWAY_DELAY + 2000);

      if (onComplete) onComplete();
    };
  }

  async createChestCoinExplosion(wrapper, app, canvas) {
    await PIXI.Assets.load(coinSpritesheetUrl);
    const coinTexture = PIXI.Texture.from(coinSpritesheetUrl);
    const baseTexture = coinTexture.baseTexture;
    const cols = 4;
    const rows = 2;
    const frameWidth = baseTexture.width / cols;
    const frameHeight = baseTexture.height / rows;

    const coinTextures = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const frameRect = new PIXI.Rectangle(
          col * frameWidth,
          row * frameHeight,
          frameWidth,
          frameHeight
        );
        const frameTexture = new PIXI.Texture(baseTexture, frameRect);
        frameTexture.defaultAnchor = new PIXI.Point(0.5, 0.5);
        coinTextures.push(frameTexture);
      }
    }

    const chestContainer = wrapper.querySelector(".chest-container");
    const rect = chestContainer
      ? chestContainer.getBoundingClientRect()
      : wrapper.getBoundingClientRect();

    const chestX = rect.left + rect.width / 2;
    const chestY = rect.top + rect.height / 2;

    const coinsCanvas = document.createElement("canvas");
    coinsCanvas.className = "chest-coins-canvas";
    coinsCanvas.width = window.innerWidth;
    coinsCanvas.height = window.innerHeight;
    coinsCanvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 999;
    `;
    document.body.appendChild(coinsCanvas);

    const coinsApp = new PIXI.Application({
      view: coinsCanvas,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x000000,
      backgroundAlpha: 0,
      resolution: Math.min(window.devicePixelRatio || 1, 1.5),
      autoDensity: true,
      antialias: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
      clearBeforeRender: true,
      autoStart: false,
    });

    if (coinsApp.ticker) {
      coinsApp.ticker.stop();
      coinsApp.ticker.autoStart = false;
    }

    coinsCanvas._pixiApp = coinsApp;

    const coins = [];
    const coinsCount = 6 + Math.floor(Math.random() * 5);

    for (let i = 0; i < coinsCount; i++) {
      const coin = new PIXI.AnimatedSprite(coinTextures);
      coin.anchor.set(0.5, 0.5);
      coin.x = chestX;
      coin.y = chestY;
      coin.animationSpeed = 0.3;
      coin.loop = true;
      coin.play();
      coin.visible = true;
      coin.alpha = 1.0;

      const scale = 0.08 + Math.random() * 0.02;
      coin.scale.set(scale, scale);

      const angle = (Math.PI * 2 * i) / coinsCount + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 2;

      coins.push({
        sprite: coin,
        vx,
        vy,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        startTime: performance.now(),
        fadeStartTime: 0.6,
      });

      coinsApp.stage.addChild(coin);
    }

    const startTime = performance.now();
    const duration = 2000;

    const animateCoins = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      coins.forEach((coin) => {
        if (performance.now() < coin.startTime) {
          return;
        }

        coin.sprite.x += coin.vx;
        coin.sprite.y += coin.vy;
        coin.vy += 0.3;

        coin.sprite.rotation += coin.rotationSpeed;

        let alpha = 1.0;
        if (progress > coin.fadeStartTime) {
          const fadeProgress =
            (progress - coin.fadeStartTime) / (1 - coin.fadeStartTime);
          alpha = 1.0 - fadeProgress;
        }
        coin.sprite.alpha = Math.max(0, alpha);

        if (
          coin.sprite.alpha <= 0 ||
          coin.sprite.x < -100 ||
          coin.sprite.x > window.innerWidth + 100 ||
          coin.sprite.y > window.innerHeight + 100
        ) {
          coin.sprite.visible = false;
        }
      });

      coinsApp.renderer.render(coinsApp.stage);

      const hasVisibleCoins = coins.some(
        (coin) => coin.sprite.visible && coin.sprite.alpha > 0
      );

      if (progress < 1 || hasVisibleCoins) {
        requestAnimationFrame(animateCoins);
      } else {
        setTimeout(() => {
          try {
            coinsApp.stage.removeChildren();
            coinsApp.destroy(true, { children: true });
            if (coinsCanvas.parentNode) {
              coinsCanvas.parentNode.removeChild(coinsCanvas);
            }
          } catch (e) {
            // Ignore
          }
        }, 500);
      }
    };

    animateCoins();
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

    setTimeout(() => {
      this.transitionToSlotMachine();
    }, maxDelay * 1000 + 500);
  }

  async transitionToSlotMachine() {
    await gsap.to(".chests-container", {
      opacity: 0,
      duration: 0.5,
    });

    const chestBackgroundContainer = this.chestScreen?.querySelector(
      ".background-container"
    );
    const chestSparklesCanvas = this.chestScreen?.querySelector(
      "#sparkles-canvas-chest"
    );

    if (this.sparklesApp) {
      this.animationFrames.forEach((frameId) => {
        cancelAnimationFrame(frameId);
      });
      this.animationFrames.clear();

      if (this.sparklesApp.ticker && this.sparklesApp.ticker.started) {
        this.sparklesApp.ticker.stop();
      }

      if (this.sparklesApp.stage) {
        this.sparklesApp.stage.removeChildren();
        this.sparklesApp.stage.destroy({ children: true });
      }

      const canvas = this.sparklesApp.view;

      if (this.sparklesApp.renderer && !this.sparklesApp.renderer.destroyed) {
        this.sparklesApp.renderer.destroy(true);
      }

      try {
        this.sparklesApp.destroy(true, { children: true });
      } catch (e) {
        // console.warn("Error destroying sparklesApp:", e);
      }

      if (canvas) {
        canvas._pixiApp = null;
      }

      this.sparklesApp = null;
    }
    this.sparklesData = null;
    this.sparkPool = null;

    await new Promise((resolve) => setTimeout(resolve, 100));

    if (this.chestScreen) {
      this.chestScreen.classList.remove("active");
    }

    if (!this.slotMachine) {
      this.slotMachine = new SlotMachine();
    }

    if (
      !this.slotMachine.screen ||
      !document.body.contains(this.slotMachine.screen)
    ) {
      this.slotMachine.createSlotMachineUI();
    }

    const slotScreen = document.querySelector(".slot-machine-screen");

    if (slotScreen) {
      const leftPanel = slotScreen.querySelector(".left-panel");
      const centerPanel = slotScreen.querySelector(".slot-machine-center");
      const rightPanel = slotScreen.querySelector(".right-panel");

      if (leftPanel) {
        leftPanel.style.transform = "translateX(-100vw)";
        leftPanel.style.opacity = "0";
      }
      if (centerPanel) {
        centerPanel.style.transform = "translateY(100vh)";
        centerPanel.style.opacity = "0";
      }
      if (rightPanel) {
        rightPanel.style.transform = "translateX(100vw)";
        rightPanel.style.opacity = "0";
      }

      if (leftPanel)
        gsap.set(leftPanel, { x: "-100vw", opacity: 0, immediateRender: true });
      if (centerPanel)
        gsap.set(centerPanel, {
          y: "100vh",
          opacity: 0,
          immediateRender: true,
        });
      if (rightPanel)
        gsap.set(rightPanel, { x: "100vw", opacity: 0, immediateRender: true });
    }

    if (chestBackgroundContainer && slotScreen) {
      gsap.set(chestBackgroundContainer, { opacity: 1 });
      slotScreen.insertBefore(chestBackgroundContainer, slotScreen.firstChild);
    }

    if (chestSparklesCanvas) {
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

    if (slotScreen) {
      const slotSparklesCanvas = slotScreen.querySelector(
        "#sparkles-canvas-slot"
      );
      if (slotSparklesCanvas) {
        slotSparklesCanvas.remove();
      }

      const newCanvas = document.createElement("canvas");
      newCanvas.id = "sparkles-canvas-slot";
      newCanvas.className = "sparkles-canvas";
      slotScreen.insertBefore(newCanvas, slotScreen.firstChild);
    }

    await this.slotMachine.setupSparkles();

    const fieldImage = slotScreen.querySelector(".slot-frame");
    const slotGrid = slotScreen.querySelector(".slot-grid");

    if (slotGrid) {
      gsap.set(slotGrid, { opacity: 0, visibility: "hidden" });
    }

    const waitForImageLoad = (img) => {
      return new Promise((resolve) => {
        if (img.complete && img.naturalHeight !== 0) {
          resolve();
        } else {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        }
      });
    };

    if (fieldImage) {
      await waitForImageLoad(fieldImage);
    }

    if (slotGrid) {
      gsap.set(slotGrid, { opacity: 1, visibility: "visible" });
    }

    this.slotMachine.fillInitialGrid();
    await this.slotMachine.setupCustomCursor();
    this.slotMachine.setupSpinButton();
    this.slotMachine.setupWithdrawButton();
    this.slotMachine.startJackpotCounterAnimation();
    this.slotMachine.startVolcanoEruptionAnimation();

    const leftPanel = slotScreen.querySelector(".left-panel");
    const centerPanel = slotScreen.querySelector(".slot-machine-center");
    const rightPanel = slotScreen.querySelector(".right-panel");

    if (leftPanel) gsap.set(leftPanel, { x: "-100vw", opacity: 0 });
    if (centerPanel) gsap.set(centerPanel, { y: "100vh", opacity: 0 });
    if (rightPanel) gsap.set(rightPanel, { x: "100vw", opacity: 0 });

    playSound(sound5Url);

    const timeline = gsap.timeline();

    timeline.to(
      leftPanel,
      {
        x: 0,
        opacity: 1,
        duration: CONFIG.UI_ANIMATION.ENTRY_FROM_LEFT_DURATION,
        ease: "power2.out",
      },
      0
    );

    timeline.to(
      centerPanel,
      {
        y: 0,
        opacity: 1,
        duration: CONFIG.UI_ANIMATION.ENTRY_FROM_BOTTOM_DURATION,
        ease: "power2.out",
      },
      0.1
    );

    timeline.to(
      rightPanel,
      {
        x: 0,
        opacity: 1,
        duration: CONFIG.UI_ANIMATION.ENTRY_FROM_RIGHT_DURATION,
        ease: "power2.out",
      },
      0.2
    );

    await timeline;

    await new Promise((resolve) =>
      setTimeout(resolve, CONFIG.CTA.INSTALL_DELAY)
    );
    await this.slotMachine.spin();
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
          winAmountElement.appendChild(br);
          winAmountElement.appendChild(document.createTextNode("FREE SPINS"));
        } else {
          winAmountElement.textContent = amount;
        }
      } else {
        const formattedAmount = amount
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        winAmountElement.textContent = `$${formattedAmount}`;
      }
    }
  }

  removeEventListeners() {
    if (this.eventListeners.resize) {
      window.removeEventListener("resize", this.eventListeners.resize);
      this.eventListeners.resize = null;
    }

    if (this.eventListeners.mousemove) {
      document.removeEventListener("mousemove", this.eventListeners.mousemove);
      this.eventListeners.mousemove = null;
    }
    if (this.eventListeners.mouseleave) {
      document.removeEventListener(
        "mouseleave",
        this.eventListeners.mouseleave
      );
      this.eventListeners.mouseleave = null;
    }

    this.eventListeners.chestWrappers.forEach((entry) => {
      entry.handlers.forEach(({ type, handler }) => {
        entry.wrapper.removeEventListener(type, handler);
      });
    });
    this.eventListeners.chestWrappers = [];
  }

  destroy() {
    this.animationFrames.forEach((id) => cancelAnimationFrame(id));
    this.animationFrames.clear();

    this.chestPulseAnimations.forEach((anim) => anim?.kill());
    this.chestPulseAnimations = [];
    this.chestPulseAnimationsByIndex = {};
    Object.values(this.chestHoverAnimations).forEach((anim) => anim?.kill());
    this.chestHoverAnimations = {};

    if (this.loadingApp) {
      if (this.loadingApp.ticker) {
        this.loadingApp.ticker.stop();
      }
      this.loadingApp.destroy(true, {
        children: true,
      });
      this.loadingApp = null;
    }
    if (this.chestApp) {
      if (this.chestApp.ticker) {
        this.chestApp.ticker.stop();
      }
      this.chestApp.destroy(true, {
        children: true,
      });
      this.chestApp = null;
    }
    Object.values(this.chestAnimationApps).forEach((app) => {
      if (app && app.ticker) {
        app.ticker.stop();
      }
      app?.destroy(true, { children: true });
    });
    this.chestAnimationApps = {};

    this.removeEventListeners();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new Game();
  });
} else {
  new Game();
}
