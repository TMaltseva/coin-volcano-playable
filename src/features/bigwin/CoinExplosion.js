import * as PIXI from "pixi.js";
import { CONFIG } from "../../config.js";
import { PIXIUtils } from "../../utils/pixi.js";
import { CalculationUtils } from "../../utils/calculation.js";
import { AnimationPresets } from "../../utils/animation.js";
import coinSpritesheetUrl from "/spritesheets/spritesheet_5.png";

export class CoinExplosion {
  constructor(resources) {
    this.resources = resources;
  }

  async createFromVolcanoes(volcanoesContainer) {
    await PIXI.Assets.load(coinSpritesheetUrl);
    const coinTexture = PIXI.Texture.from(coinSpritesheetUrl);
    const baseTexture = coinTexture.baseTexture;

    const config = CONFIG.BIG_WIN_SCREEN.COIN_EXPLOSION;
    const coinTextures = PIXIUtils.createTexturesFromSpritesheet(
      baseTexture,
      config.SPRITESHEET.COLS,
      config.SPRITESHEET.ROWS
    );
    coinTextures.forEach((texture) => {
      texture.defaultAnchor = new PIXI.Point(0.5, 0.5);
    });

    let volcanoWrappers = [
      volcanoesContainer.querySelector(".volcano-left"),
      volcanoesContainer.querySelector(".volcano-center"),
      volcanoesContainer.querySelector(".volcano-right"),
    ].filter(Boolean);

    if (volcanoWrappers.length === 0) {
      const volcanoWrapper = volcanoesContainer.querySelector(
        ".three-volcanoes-wrapper"
      );
      if (volcanoWrapper) {
        volcanoWrappers = [volcanoWrapper];
      } else {
        return;
      }
    }

    AnimationPresets.coinExplosion({
      coinTextures,
      sources: volcanoWrappers,
      config: {
        perSource: config.PER_VOLCANO,
        scale: config.SCALE,
        speed: config.SPEED,
        velocityY: config.VELOCITY_Y,
        gravity: config.GRAVITY,
        rotationSpeedMultiplier: config.ROTATION_SPEED_MULTIPLIER,
        fadeStartTime: config.FADE_START_TIME,
        duration: config.DURATION,
        boundaryOffset: config.BOUNDARY_OFFSET,
        animationSpeed: config.ANIMATION_SPEED,
        angleRandom: 0.5,
      },
      resources: this.resources,
      getCanvasConfig: () => ({
        className: "big-win-coins-canvas",
        zIndex: CONFIG.BIG_WIN_SCREEN.Z_INDEX.COINS_CANVAS,
        resolutionMax: 1.5,
        autoStart: true,
      }),
    });
  }

  async createFromBalance(amountElement) {
    await PIXI.Assets.load(coinSpritesheetUrl);
    const coinTexture = PIXI.Texture.from(coinSpritesheetUrl);
    const baseTexture = coinTexture.baseTexture;
    const config = CONFIG.BIG_WIN_SCREEN.BALANCE_COIN_EXPLOSION;
    const coinTextures = PIXIUtils.createTexturesFromSpritesheet(
      baseTexture,
      config.SPRITESHEET.COLS,
      config.SPRITESHEET.ROWS
    );
    coinTextures.forEach((texture) => {
      texture.defaultAnchor = new PIXI.Point(0.5, 0.5);
    });

    const center = CalculationUtils.getElementCenter(amountElement);

    AnimationPresets.coinExplosion({
      coinTextures,
      sources: [{ x: center.x, y: center.y }],
      config: {
        count: config.COUNT,
        scale: config.SCALE,
        speed: config.SPEED,
        velocityY: config.VELOCITY_Y,
        gravity: config.GRAVITY,
        rotationSpeedMultiplier: config.ROTATION_SPEED_MULTIPLIER,
        angleRandom: config.ANGLE_RANDOM,
        startDelayMax: config.START_DELAY_MAX,
        fadeStartTime: config.FADE_START_TIME,
        duration: config.DURATION,
        boundaryOffset: config.BOUNDARY_OFFSET,
        animationSpeed: config.ANIMATION_SPEED,
      },
      resources: this.resources,
      getCanvasConfig: () => ({
        className: "big-win-balance-coins-canvas",
        zIndex: CONFIG.BIG_WIN_SCREEN.Z_INDEX.BALANCE_COINS_CANVAS,
        resolutionMax: 1.5,
        autoStart: false,
      }),
    });
  }

  cleanup() {
    this.cleanupCoinsCanvas();
    this.cleanupBalanceCoinsCanvas();
  }

  cleanupCoinsCanvas() {
    const bigWinCoinsCanvas = document.querySelector(".big-win-coins-canvas");
    if (!bigWinCoinsCanvas) return;

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
      // ignore
    }
  }

  cleanupBalanceCoinsCanvas() {
    const bigWinBalanceCoinsCanvas = document.querySelector(
      ".big-win-balance-coins-canvas"
    );
    if (!bigWinBalanceCoinsCanvas) return;

    try {
      if (bigWinBalanceCoinsCanvas._pixiApp) {
        const app = bigWinBalanceCoinsCanvas._pixiApp;
        app.stage.removeChildren();
        app.destroy(true, { children: true });
      }
      if (bigWinBalanceCoinsCanvas.parentNode) {
        bigWinBalanceCoinsCanvas.parentNode.removeChild(
          bigWinBalanceCoinsCanvas
        );
      }
    } catch (e) {
      // ignore
    }
  }
}
