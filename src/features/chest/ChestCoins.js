import * as PIXI from "pixi.js";
import { CONFIG } from "../../config.js";
import { CalculationUtils } from "../../utils/calculation.js";
import { PIXIUtils } from "../../utils/pixi.js";
import { AnimationPresets } from "../../utils/animation.js";

const coinSpritesheetUrl = "/spritesheets/spritesheet_5.png";

export class ChestCoins {
  constructor(resources) {
    this.resources = resources;
  }

  async createExplosion(wrapper, app, canvas) {
    const coinTextures = await this.loadCoinTextures();
    const { chestX, chestY } = this.getChestCenterPosition(wrapper);
    const config = CONFIG.CHEST_COIN_EXPLOSION.COINS;

    AnimationPresets.coinExplosion({
      coinTextures,
      sources: [{ x: chestX, y: chestY }],
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
        className: "chest-coins-canvas",
        zIndex: CONFIG.CHEST_COIN_EXPLOSION.CANVAS.Z_INDEX,
        resolutionMax: CONFIG.CHEST_COIN_EXPLOSION.CANVAS.RESOLUTION_MAX,
        autoStart: false,
      }),
    });
  }

  async loadCoinTextures() {
    await PIXI.Assets.load(coinSpritesheetUrl);
    const coinTexture = PIXI.Texture.from(coinSpritesheetUrl);
    const baseTexture = coinTexture.baseTexture;
    const config = CONFIG.CHEST_COIN_EXPLOSION.SPRITESHEET;
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

  getChestCenterPosition(wrapper) {
    const chestContainer = wrapper.querySelector(".chest-container");
    const targetElement = chestContainer || wrapper;
    const center = CalculationUtils.getElementCenter(targetElement);
    return { chestX: center.x, chestY: center.y };
  }
}
