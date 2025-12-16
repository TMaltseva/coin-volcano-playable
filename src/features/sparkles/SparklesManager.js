import * as PIXI from "pixi.js";
import { CONFIG } from "../../config.js";
import { CalculationUtils } from "../../utils/calculation.js";
import { FogEffect } from "./FogEffect.js";

export class SparklesManager {
  constructor(resources) {
    this.resources = resources;
  }

  createSparklesContainer(app, count, colors) {
    const container = new PIXI.Container();
    app.stage.addChild(container);

    const config = CONFIG.SPARKLES.SPARKLE;
    const textures = this.createSparkleTextures(app, colors, config);
    const sparkles = this.createSparkles(app, count, colors, textures, config);

    sparkles.forEach((sparkle) => {
      container.addChild(sparkle.sprite);
    });

    return {
      container,
      sparkles,
      width: app.screen.width,
      height: app.screen.height,
      textures,
    };
  }

  createSparkleTextures(app, colors, config) {
    return colors.map((color) => {
      const graphics = new PIXI.Graphics();
      graphics.beginFill(color.glow, 1);
      graphics.drawEllipse(0, 0, config.ELLIPSE_WIDTH, config.ELLIPSE_HEIGHT);
      graphics.endFill();
      const texture = app.renderer.generateTexture(
        graphics,
        PIXI.SCALE_MODES.LINEAR,
        1
      );
      graphics.destroy();
      return texture;
    });
  }

  createSparkles(app, count, colors, textures, config) {
    const sparkles = [];
    const width = app.screen.width;
    const height = app.screen.height;

    for (let i = 0; i < count; i++) {
      const sparkle = this.createSingleSparkle(
        width,
        height,
        colors,
        textures,
        config
      );
      sparkles.push(sparkle);
    }

    return sparkles;
  }

  createSingleSparkle(width, height, colors, textures, config) {
    const angle = Math.random() * Math.PI * 2;
    const speed =
      config.SPEED_MIN + Math.random() * (config.SPEED_MAX - config.SPEED_MIN);
    const colorIndex = CalculationUtils.randomRange(0, colors.length - 1);
    const color = colors[colorIndex];

    const sprite = new PIXI.Sprite(textures[colorIndex]);
    sprite.anchor.set(0.5);

    return {
      sprite: sprite,
      textureIndex: colorIndex,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size:
        config.SIZE_MIN + Math.random() * (config.SIZE_MAX - config.SIZE_MIN),
      length:
        config.LENGTH_MIN +
        Math.random() * (config.LENGTH_MAX - config.LENGTH_MIN),
      angle: angle,
      color: color,
      opacity:
        config.OPACITY_MIN +
        Math.random() * (config.OPACITY_MAX - config.OPACITY_MIN),
      life: Math.random(),
      lifeSpeed:
        config.LIFE_SPEED_MIN +
        Math.random() * (config.LIFE_SPEED_MAX - config.LIFE_SPEED_MIN),
      depth:
        config.DEPTH_MIN +
        Math.random() * (config.DEPTH_MAX - config.DEPTH_MIN),
    };
  }

  updateSparkles(sparkleData, app) {
    if (!app || !app.renderer || app.renderer.destroyed || !app.stage) {
      return;
    }
    const { sparkles, width, height } = sparkleData;
    const config = CONFIG.SPARKLES.SPARKLE;

    for (let i = 0; i < sparkles.length; i++) {
      const sparkle = sparkles[i];

      this.updateSparkleLife(sparkle, config);
      this.updateSparklePosition(sparkle, width, height);
      this.updateSparkleSprite(sparkle, config);
    }
  }

  updateSparkleLife(sparkle, config) {
    sparkle.life += sparkle.lifeSpeed;
    if (sparkle.life > 1) sparkle.life = 0;
  }

  updateSparklePosition(sparkle, width, height) {
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
  }

  updateSparkleSprite(sparkle, config) {
    const lifeOpacity =
      Math.sin(sparkle.life * Math.PI) * config.LIFE_OPACITY_MULTIPLIER +
      config.LIFE_OPACITY_BASE;
    const depthSize = sparkle.size * sparkle.depth;
    const depthLength = sparkle.length * sparkle.depth;
    const finalOpacity = sparkle.opacity * lifeOpacity * sparkle.depth;

    sparkle.sprite.x = sparkle.x;
    sparkle.sprite.y = sparkle.y;
    sparkle.sprite.rotation = sparkle.angle;
    sparkle.sprite.alpha = finalOpacity;
    const scaleX =
      depthLength / config.SCALE_DIVISOR_X / config.BASE_ELLIPSE_SIZE;
    const scaleY = depthSize / config.SCALE_DIVISOR_Y;
    sparkle.sprite.scale.set(scaleX, scaleY);
  }

  initializeSparklesData(loadingApp, chestApp) {
    const colors = CONFIG.SPARKLES.COLORS;

    const loadingSparkles = this.createSparklesContainer(
      loadingApp,
      CONFIG.PARTICLES.SPARKLE_COUNT,
      colors
    );

    const chestSparkles = this.createSparklesContainer(
      chestApp,
      CONFIG.PARTICLES.SPARKLE_COUNT,
      colors
    );

    FogEffect.createFogEffect(loadingApp);
    FogEffect.createFogEffect(chestApp);

    return { loadingSparkles, chestSparkles };
  }

  createSparklesAnimationState() {
    return {
      lastUpdateTime: 0,
      frameInterval: 1000 / CONFIG.PARTICLES.TARGET_FPS,
      cachedLoadingActive: false,
      cachedChestActive: false,
      cachedSlotMachineActive: false,
      lastScreenCheck: 0,
      screenCheckInterval: CONFIG.SPARKLES.ANIMATION.SCREEN_CHECK_INTERVAL,
    };
  }

  startSparklesAnimationLoop(
    sparklesData,
    state,
    screenCheckers,
    slotMachineSparklesUpdater
  ) {
    const animate = (currentTime) => {
      this.resources.requestAnimationFrame(animate);

      if (currentTime - state.lastUpdateTime >= state.frameInterval) {
        const startTime = performance.now();

        this.updateScreenStates(currentTime, state, screenCheckers);
        this.updateSparklesAnimations(
          sparklesData,
          state,
          screenCheckers,
          slotMachineSparklesUpdater
        );
        this.checkSparklesPerformance(startTime);

        state.lastUpdateTime = currentTime;
      }
    };

    animate(0);
  }

  updateScreenStates(currentTime, state, screenCheckers) {
    if (currentTime - state.lastScreenCheck >= state.screenCheckInterval) {
      state.cachedLoadingActive = screenCheckers.isLoadingScreenActive();
      state.cachedChestActive = screenCheckers.isChestScreenActive();
      state.cachedSlotMachineActive =
        screenCheckers.isSlotMachineScreenActive();
      state.lastScreenCheck = currentTime;
    }
  }

  updateSparklesAnimations(
    sparklesData,
    state,
    screenCheckers,
    slotMachineSparklesUpdater
  ) {
    if (state.cachedLoadingActive) {
      this.updateSparkles(
        sparklesData.loadingSparkles,
        screenCheckers.loadingApp
      );
      screenCheckers.loadingApp.renderer.render(
        screenCheckers.loadingApp.stage
      );
    }

    if (state.cachedChestActive) {
      this.updateSparkles(sparklesData.chestSparkles, screenCheckers.chestApp);
      screenCheckers.chestApp.renderer.render(screenCheckers.chestApp.stage);
    }

    if (state.cachedSlotMachineActive && slotMachineSparklesUpdater) {
      slotMachineSparklesUpdater();
    }
  }

  checkSparklesPerformance(startTime) {
    if (!import.meta.env.DEV) return;

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    if (executionTime > CONFIG.SPARKLES.ANIMATION.PERFORMANCE_THRESHOLD) {
      console.warn(`Sparkles RAF slow: ${executionTime.toFixed(2)}ms`);
    }
  }
}
