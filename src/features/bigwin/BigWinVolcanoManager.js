import { gsap } from "gsap";
import * as PIXI from "pixi.js";
import { CONFIG } from "../../config.js";
import { DOMUtils } from "../../utils/dom.js";
import { PIXIUtils } from "../../utils/pixi.js";
import { AnimationPresets } from "../../utils/animation.js";
import coinSpritesheetUrl from "/spritesheets/spritesheet_5.png";

export class BigWinVolcanoManager {
  constructor(resources) {
    this.resources = resources;
    this.bigWinVolcanoFunctions = [];
    this.bigWinVolcanoTimers = [];
    this.bigWinExplosionApps = null;
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

    this.startVolcanoAnimation(
      volcanoWrapper,
      volcanoImg,
      glowElement,
      fireContainer
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

  startVolcanoAnimation(
    volcanoWrapper,
    volcanoImg,
    glowElement,
    fireContainer
  ) {
    const anim = CONFIG.BIG_WIN_SCREEN.VOLCANO_ANIMATION.ERUPTION;
    const eruptionControl = AnimationPresets.volcanoEruption({
      volcano: volcanoImg,
      glow: glowElement,
      fire: fireContainer,
      config: {
        initialDelayMin: anim.INITIAL_DELAY_MIN,
        initialDelayMax: anim.INITIAL_DELAY_MAX,
        nextDelayMin: anim.NEXT_DELAY_MIN,
        nextDelayMax: anim.NEXT_DELAY_MAX,
        glowOpacity: anim.GLOW_OPACITY,
        glowScale: anim.GLOW_SCALE,
        glowDuration: anim.GLOW_DURATION,
        glowFadeDuration: anim.GLOW_FADE_DURATION,
        glowFadeOffset: anim.GLOW_FADE_OFFSET,
        fireOpacity: anim.FIRE_OPACITY,
        fireDuration: anim.FIRE_DURATION,
        fireFadeDuration: anim.FIRE_FADE_DURATION,
        fireFadeOffset: anim.FIRE_FADE_OFFSET,
        volcanoScaleX1: anim.VOLCANO_SCALE_X_1,
        volcanoScaleX2: anim.VOLCANO_SCALE_X_2,
        volcanoScaleY: anim.VOLCANO_SCALE_Y,
        volcanoDuration1: anim.VOLCANO_DURATION_1,
        volcanoDuration2: anim.VOLCANO_DURATION_2,
        volcanoDuration3: anim.VOLCANO_DURATION_3,
        transformOrigin: "center center",
        easeOut: anim.EASE_OUT,
        easeIn: anim.EASE_IN,
      },
      resources: this.resources,
    });

    this.registerVolcanoAnimationStop(() => {
      eruptionControl.stop();
    });
  }

  registerVolcanoAnimationStop(stopFunction) {
    if (!this.bigWinVolcanoFunctions) {
      this.bigWinVolcanoFunctions = [];
    }
    this.bigWinVolcanoFunctions.push({ stop: stopFunction });
  }

  async createCoinExplosion(volcanoesContainer) {
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

    const volcanoWrappers = [
      volcanoesContainer?.querySelector(".volcano-left"),
      volcanoesContainer?.querySelector(".volcano-center"),
      volcanoesContainer?.querySelector(".volcano-right"),
    ].filter(Boolean);

    if (volcanoWrappers.length === 0) return;

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
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundAlpha: 0,
      }),
    });
  }

  stopAnimations() {
    if (this.bigWinVolcanoFunctions) {
      this.bigWinVolcanoFunctions.forEach((control) => {
        control.stop();
      });
      this.bigWinVolcanoFunctions = [];
    }

    if (this.bigWinVolcanoTimers) {
      this.bigWinVolcanoTimers.forEach((timer) => {
        if (timer) this.resources.clearTimeout(timer);
      });
      this.bigWinVolcanoTimers = [];
    }

    if (!this.bigWinExplosionApps) return;

    Object.values(this.bigWinExplosionApps).forEach(
      (explosionData) => {
        if (explosionData.app) {
          try {
            if (explosionData.app.ticker) {
              explosionData.app.ticker.stop();
            }
            if (explosionData.sprite) {
              explosionData.sprite.visible = false;
            }
            if (explosionData.canvas) {
              gsap.killTweensOf(explosionData.canvas);
              gsap.set(explosionData.canvas, { opacity: 0 });
            }
            explosionData.app.destroy(true, { children: true });
          } catch (e) {
            // ignore
          }
        }
      }
    );
    this.bigWinExplosionApps = null;
  }

  destroy() {
    this.stopAnimations();
  }
}

