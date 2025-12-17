import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { CONFIG } from "../../config.js";
import { PIXIUtils } from "../../utils/pixi.js";
import { playSound } from "../../utils/audio.js";

const sound2Url = "/sounds/sound_2.mp3";

export class ChestAnimations {
  constructor(resources, chestAnimationApps) {
    this.resources = resources;
    this.chestAnimationApps = chestAnimationApps;
  }

  async animateOpening(
    index,
    wrapper,
    loadedAssets,
    onComplete,
    onAnimationComplete
  ) {
    if (!wrapper) {
      if (onComplete) onComplete();
      return;
    }

    const texture = this.getChestOpenTexture(loadedAssets);
    if (!texture) {
      if (onComplete) onComplete();
      return;
    }

    const baseTexture = this.prepareBaseTexture(texture);
    if (!baseTexture) {
      if (onComplete) onComplete();
      return;
    }

    wrapper.classList.add("animating");

    const canvas = wrapper.querySelector(".chest-animation-canvas");
    if (!canvas) {
      if (onComplete) onComplete();
      return;
    }

    const { canvasWidth, canvasHeight } = this.calculateCanvasSize(
      wrapper,
      canvas
    );

    const app = this.createPixiApp(canvas, canvasWidth, canvasHeight);
    this.chestAnimationApps[index] = app;
    this.resources.registerPixiApp(app);

    const { textures, frameWidth, frameHeight } =
      this.createAnimationTextures(baseTexture);

    const animatedSprite = this.createAnimatedSprite(
      textures,
      app,
      canvasWidth,
      canvasHeight,
      frameWidth,
      frameHeight
    );
    app.stage.addChild(animatedSprite);

    this.setupAnimationComplete(
      animatedSprite,
      index,
      onComplete,
      onAnimationComplete
    );
    this.startAnimationLoop(app, animatedSprite);
    this.animateWinIndicator(wrapper);

    const closedImage = wrapper.querySelector(".chest-closed");
    if (closedImage) {
      closedImage.style.opacity = "0";
      closedImage.style.display = "none";
    }

    const centerY = Math.round(app.screen.height / 2);
    const config = CONFIG.CHEST_ANIMATION.SPRITE;

    animatedSprite.alpha = config.FINAL_ALPHA;
    animatedSprite.y = centerY;
    animatedSprite.visible = true;

    playSound(sound2Url);

    if (animatedSprite.textures && animatedSprite.textures.length > 0) {
      animatedSprite.play();
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    } else {
      if (onComplete) onComplete();
      return;
    }
  }

  getChestOpenTexture(loadedAssets) {
    const chestOpenResource = loadedAssets?.chestOpenSheet;
    if (!chestOpenResource) {
      return null;
    }

    let texture = null;

    if (chestOpenResource instanceof PIXI.Texture) {
      texture = chestOpenResource;
    } else if (chestOpenResource.texture instanceof PIXI.Texture) {
      texture = chestOpenResource.texture;
    } else if (chestOpenResource.baseTexture) {
      texture = new PIXI.Texture(chestOpenResource.baseTexture);
    } else if (typeof chestOpenResource === "string") {
      texture = PIXI.Texture.from(chestOpenResource);
    } else {
      try {
        texture = PIXI.Texture.from(chestOpenResource);
      } catch (e) {
        // ignore
      }
    }

    if (!texture || !(texture instanceof PIXI.Texture)) {
      return null;
    }

    return texture;
  }

  prepareBaseTexture(texture) {
    const baseTexture = texture.baseTexture;

    if (!baseTexture) {
      return null;
    }

    baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;

    if (!baseTexture.width || !baseTexture.height) {
      return null;
    }

    return baseTexture;
  }

  calculateCanvasSize(wrapper, canvas) {
    const config = CONFIG.CHEST_ANIMATION.CANVAS;
    const chestContainer = wrapper.querySelector(".chest-container");
    const containerRect = chestContainer
      ? chestContainer.getBoundingClientRect()
      : null;
    const rect = canvas.getBoundingClientRect();

    let canvasWidth = rect.width || canvas.offsetWidth;
    let canvasHeight = rect.height || canvas.offsetHeight;

    if ((canvasWidth === 0 || canvasHeight === 0) && containerRect) {
      canvasWidth = containerRect.width || config.FALLBACK_SIZE;
      canvasHeight = containerRect.height || config.FALLBACK_SIZE;
    }

    if (canvasWidth === 0 || canvasHeight === 0) {
      canvasWidth = config.FALLBACK_SIZE;
      canvasHeight = config.FALLBACK_SIZE;
    }

    return { canvasWidth, canvasHeight };
  }

  createPixiApp(canvas, canvasWidth, canvasHeight) {
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

    app.renderer.roundPixels = true;
    return app;
  }

  createAnimationTextures(baseTexture) {
    const config = CONFIG.CHEST_ANIMATION.SPRITESHEET;
    const totalWidth = baseTexture.width;
    const totalHeight = baseTexture.height;
    const frameWidth = totalWidth / config.COLS;
    const frameHeight = totalHeight / config.ROWS;
    const textures = [];

    for (let row = 0; row < config.ROWS; row++) {
      for (let col = 0; col < config.COLS; col++) {
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

    return { textures, frameWidth, frameHeight };
  }

  createAnimatedSprite(
    textures,
    app,
    canvasWidth,
    canvasHeight,
    frameWidth,
    frameHeight
  ) {
    const config = CONFIG.CHEST_ANIMATION;
    const spriteConfig = config.SPRITE;
    const animatedSprite = PIXIUtils.createAnimatedSprite(textures, {
      anchor: { x: 0.5, y: 0.5 },
      animationSpeed: CONFIG.ANIMATION.SPRITE_SPEED,
      loop: false,
    });

    animatedSprite.x = Math.round(app.screen.width / 2);
    const centerY = Math.round(app.screen.height / 2);
    const startY = centerY - canvasHeight * spriteConfig.START_Y_OFFSET;
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
    animatedSprite.alpha = spriteConfig.INITIAL_ALPHA;
    animatedSprite.visible = true;

    return animatedSprite;
  }

  startAnimationLoop(app, animatedSprite) {
    if (!app || !app.ticker) return;

    app.ticker.add((delta) => {
      if (!app || !app.renderer || app.renderer.destroyed) {
        return;
      }

      if (animatedSprite && animatedSprite.playing) {
        animatedSprite.update(delta);
      }

      app.renderer.render(app.stage);
    });

    if (!app.ticker.started) {
      app.ticker.start();
    }
  }

  animateWinIndicator(wrapper) {
    const winIndicator = wrapper.querySelector(".win-indicator");
    if (!winIndicator) return;

    wrapper.classList.add("win");
    const config = CONFIG.CHEST_ANIMATION.WIN_INDICATOR;
    const startY = this.calculateWinIndicatorStartY(wrapper);

    gsap.set(winIndicator, {
      opacity: 0,
      y: startY,
      scale: config.INITIAL_SCALE,
    });

    gsap.to(winIndicator, {
      opacity: 1,
      y: 0,
      scale: config.FINAL_SCALE,
      duration: config.ANIMATION_DURATION,
      ease: config.EASE,
    });
  }

  calculateWinIndicatorStartY(wrapper) {
    const config = CONFIG.CHEST_ANIMATION.WIN_INDICATOR;
    const chestContainer = wrapper.querySelector(".chest-container");

    if (chestContainer) {
      const containerRect = chestContainer.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      const chestCenterY =
        containerRect.top - wrapperRect.top + containerRect.height / 2;
      const viewportWidth = window.innerWidth;
      const minTop = config.MIN_TOP_REM * 16;
      const preferredTop = -viewportWidth * config.VIEWPORT_MULTIPLIER;
      const maxTop = config.MAX_TOP_REM * 16;
      const finalTop = Math.max(minTop, Math.min(preferredTop, maxTop));
      return chestCenterY - finalTop;
    } else {
      const vh = window.innerHeight / 100;
      const minY = config.MIN_Y_REM * 16;
      const preferredY = config.VH_MULTIPLIER * vh;
      const maxY = config.MAX_Y_REM * 16;
      return Math.max(minY, Math.min(preferredY, maxY));
    }
  }

  setupAnimationComplete(
    animatedSprite,
    index,
    onComplete,
    onAnimationComplete
  ) {
    animatedSprite.onComplete = () => {
      animatedSprite.stop();
      animatedSprite.gotoAndStop(animatedSprite.textures.length - 1);

      this.resources.setTimeout(() => {
        if (this.chestAnimationApps[index]) {
          const app = this.chestAnimationApps[index];
          app.destroy(true, {
            children: true,
          });
          delete this.chestAnimationApps[index];
        }
      }, CONFIG.TIMING.FLY_AWAY_DELAY + CONFIG.CHEST_ANIMATION.CLEANUP_DELAY);

      if (onComplete) {
        onComplete();
      }
    };
  }
}
