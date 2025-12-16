import * as PIXI from "pixi.js";
import { CONFIG } from "../../config.js";
import { CalculationUtils } from "../../utils/calculation.js";
import { EventUtils } from "../../utils/event.js";
import { SparklesManager } from "./SparklesManager.js";

export class SparklesSetup {
  constructor(resources) {
    this.resources = resources;
    this.sparklesApp = null;
    this.sparklesData = null;
    this.sparkPool = null;
    this.eventListeners = [];
  }

  async setup() {
    if (this.sparklesApp) return;

    const canvas = this.findOrCreateCanvas();
    if (!canvas) return;

    await this.cleanupOldPixiApp(canvas);
    this.createSparklesApp(canvas);
    this.setupSparklesContent();
    this.setupResizeHandler();
    this.startSparklesAnimation();
  }

  findOrCreateCanvas() {
    let canvas = document.getElementById("sparkles-canvas-slot");
    if (!canvas) {
      canvas = document.getElementById("sparkles-canvas-chest");
      if (canvas) {
        canvas.id = "sparkles-canvas-slot";
      }
    }
    return canvas;
  }

  async cleanupOldPixiApp(canvas) {
    if (!canvas._pixiApp) return;

    const oldApp = canvas._pixiApp;

    if (oldApp.ticker?.started) {
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
    } catch (e) {
      // ignore
    }

    canvas._pixiApp = null;

    await new Promise((resolve) => {
      this.resources.setTimeout(resolve, 50);
    });
  }

  createSparklesApp(canvas) {
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
    this.resources.registerPixiApp(this.sparklesApp);
  }

  setupSparklesContent() {
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

    this.removeFogContainer();
    this.initSparkPool();
  }

  removeFogContainer() {
    if (!this.sparklesApp?.stage) return;

    const fogContainer = this.sparklesApp.stage.children.find(
      (child) => child._smokeParticles && Array.isArray(child._smokeParticles)
    );

    if (fogContainer) {
      fogContainer.removeChildren();
      this.sparklesApp.stage.removeChild(fogContainer);
      fogContainer.destroy({ children: true });
    }
  }

  setupResizeHandler() {
    const handleResize = () => {
      if (this.sparklesApp?.renderer) {
        this.sparklesApp.renderer.resize(window.innerWidth, window.innerHeight);
        if (this.sparklesData) {
          this.sparklesData.width = window.innerWidth;
          this.sparklesData.height = window.innerHeight;
        }
      }
    };

    const resizeListener = EventUtils.addEventListener(
      window,
      "resize",
      handleResize
    );
    this.eventListeners.push(resizeListener);
  }

  startSparklesAnimation() {
    let lastUpdateTime = 0;
    const frameInterval = 1000 / CONFIG.PARTICLES.TARGET_FPS;

    const animate = (currentTime) => {
      const startTime = import.meta.env.DEV ? performance.now() : 0;

      this.resources.requestAnimationFrame(animate);

      if (currentTime - lastUpdateTime >= frameInterval) {
        if (this.isSparklesAppValid()) {
          this.updateSparkles(this.sparklesData, this.sparklesApp);
        }
        lastUpdateTime = currentTime;
      }

      if (import.meta.env.DEV && startTime > 0) {
        this.checkAnimationPerformance(startTime);
      }
    };

    animate(0);
  }

  isSparklesAppValid() {
    return (
      this.sparklesData &&
      this.sparklesApp &&
      this.sparklesApp.ticker?.started &&
      this.sparklesApp.renderer &&
      !this.sparklesApp.renderer.destroyed
    );
  }

  checkAnimationPerformance(startTime) {
    if (!import.meta.env.DEV) return;

    const executionTime = performance.now() - startTime;

    if (executionTime > 16) {
      console.warn(`⚠️ RAF slow: ${executionTime.toFixed(2)}ms`);
    }
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
      const colorIndex = CalculationUtils.randomRange(0, colors.length - 1);
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

  getSparkPool() {
    return this.sparkPool;
  }

  getSparklesApp() {
    return this.sparklesApp;
  }

  getSparklesData() {
    return this.sparklesData;
  }

  destroy() {
    if (this.sparklesApp) {
      try {
        if (this.sparklesApp.ticker) {
          this.sparklesApp.ticker.stop();
        }
        if (this.sparklesApp.stage) {
          this.sparklesApp.stage.removeChildren();
          this.sparklesApp.stage.destroy({ children: true });
        }
        const canvas = this.sparklesApp.view;
        if (canvas && canvas._pixiApp) {
          canvas._pixiApp = null;
        }
        this.sparklesApp.destroy(true, { children: true });
      } catch (e) {
        // ignore
      }
      this.sparklesApp = null;
    }
    this.sparklesData = null;
    this.sparkPool = null;

    this.eventListeners.forEach((listener) => {
      if (listener && listener.remove) {
        listener.remove();
      }
    });
    this.eventListeners = [];
  }
}
