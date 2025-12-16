import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { CONFIG } from "../../config.js";
import { DOMUtils } from "../../utils/dom.js";
import { PIXIUtils } from "../../utils/pixi.js";
import { AnimationPresets } from "../../utils/animation.js";
import { EventUtils } from "../../utils/event.js";

export class VolcanoManager {
  constructor(resources, screen = null) {
    this.resources = resources;
    this.screen = screen;
    this.volcanoApps = {};
    this.volcanoEruptionFunctions = [];
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

      this.resources.registerPixiApp(app);

      const volcanoUrl = `ui/volcanoes/volcano-${config.color}.png`;
      const texture = await PIXI.Assets.load(volcanoUrl);
      const baseTexture =
        texture instanceof PIXI.Texture ? texture.baseTexture : texture;

      const cols = CONFIG.VOLCANO.COLS;
      const rows = CONFIG.VOLCANO.ROWS;
      const frameWidth = baseTexture.width / cols;
      const frameHeight = baseTexture.height / rows;
      const textures = PIXIUtils.createTexturesFromSpritesheet(
        baseTexture,
        cols,
        rows
      );

      const animatedSprite = PIXIUtils.createAnimatedSprite(textures, {
        animationSpeed: CONFIG.VOLCANO.SPRITE_SPEED,
        loop: true,
        anchor: { x: 0.5, y: 0.5 },
      });
      animatedSprite.x = app.screen.width / 2;
      animatedSprite.y = app.screen.height / 2 - 400;
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
        animatedSprite.y = app.screen.height / 2 - 400;
      };

      const resizeListener = EventUtils.addEventListener(
        window,
        "resize",
        handleResize
      );
      this.resources.registerEventListener(resizeListener);
    }
  }

  async startEruptionAnimations() {
    const volcanoes = this.getVolcanoElements();
    if (!this.canStartVolcanoAnimation(volcanoes)) return;

    this.initializeEruptionFunctions();
    const glowElements = this.createGlowElements(volcanoes);
    const fireElements = this.createFireElements(volcanoes);
    this.setupEruptionAnimations(volcanoes, glowElements, fireElements);
  }

  getVolcanoElements() {
    return {
      left: this.screen?.querySelector(".volcano-left"),
      center: this.screen?.querySelector(".volcano-center"),
      right: this.screen?.querySelector(".volcano-right"),
    };
  }

  canStartVolcanoAnimation(volcanoes) {
    return volcanoes.left && volcanoes.center && volcanoes.right && this.screen;
  }

  initializeEruptionFunctions() {
    if (!this.volcanoEruptionFunctions) {
      this.volcanoEruptionFunctions = [];
    }
  }

  createGlowElements(volcanoes) {
    return {
      left: this.createGlowElement(volcanoes.left),
      center: this.createGlowElement(volcanoes.center),
      right: this.createGlowElement(volcanoes.right),
    };
  }

  createGlowElement(volcano) {
    const wrapper = volcano.parentElement;
    const glowElement = DOMUtils.createElement("div", {
      className: "volcano-glow",
      style: { opacity: "0", animation: "none" },
    });
    wrapper.appendChild(glowElement);
    return glowElement;
  }

  createFireElements(volcanoes) {
    return {
      left: this.createFireElement(volcanoes.left),
      center: this.createFireElement(volcanoes.center),
      right: this.createFireElement(volcanoes.right),
    };
  }

  createFireElement(volcano) {
    const wrapper = volcano.parentElement;
    const isLeftVolcano = volcano.classList.contains("volcano-left");
    const fireContainer = DOMUtils.createElement("div", {
      className: "volcano-fire-container",
    });

    if (isLeftVolcano) {
      fireContainer.style.transform = `translateX(calc(-50% + ${CONFIG.VOLCANO_ERUPTION.LEFT_OFFSET_X}px)) translateY(${CONFIG.VOLCANO_ERUPTION.LEFT_OFFSET_Y}px)`;
    }

    this.addFlamesToContainer(fireContainer);
    this.addSmokeToContainer(fireContainer);

    wrapper.appendChild(fireContainer);
    return fireContainer;
  }

  addFlamesToContainer(container) {
    const flames = Array.from(
      { length: CONFIG.VOLCANO_ERUPTION.FLAME_COUNT },
      () =>
        DOMUtils.createElement("div", {
          className: "flame",
        })
    );
    container.append(...flames);
  }

  addSmokeToContainer(container) {
    const smokes = Array.from(
      { length: CONFIG.VOLCANO_ERUPTION.SMOKE_COUNT },
      () =>
        DOMUtils.createElement("div", {
          className: "smoke",
        })
    );
    container.append(...smokes);
  }

  setupEruptionAnimations(volcanoes, glowElements, fireElements) {
    this.createEruptionAnimation(
      volcanoes.left,
      glowElements.left,
      fireElements.left,
      CONFIG.VOLCANO_ERUPTION.DELAYS.LEFT
    );
    this.createEruptionAnimation(
      volcanoes.center,
      glowElements.center,
      fireElements.center,
      CONFIG.VOLCANO_ERUPTION.DELAYS.CENTER
    );
    this.createEruptionAnimation(
      volcanoes.right,
      glowElements.right,
      fireElements.right,
      CONFIG.VOLCANO_ERUPTION.DELAYS.RIGHT
    );
  }

  createEruptionAnimation(volcano, glowElement, fireElement, delay) {
    const animConfig = CONFIG.VOLCANO_ERUPTION;
    const eruptionControl = AnimationPresets.volcanoEruption({
      volcano,
      glow: glowElement,
      fire: fireElement,
      config: {
        delay,
        initialDelayMin: delay,
        initialDelayMax: delay + animConfig.INITIAL_DELAY_VARIATION,
        nextDelayMin: animConfig.NEXT_DELAY_MIN,
        nextDelayMax: animConfig.NEXT_DELAY_MAX,
        glowOpacity: 1,
        glowScale: animConfig.GLOW_SCALE,
        glowDuration: animConfig.ANIMATION.GLOW_DURATION,
        glowFadeDuration: animConfig.ANIMATION.FADE_DURATION,
        glowFadeOffset: `-=${animConfig.ANIMATION.FADE_DURATION}`,
        fireOpacity: 1,
        fireDuration: animConfig.ANIMATION.FIRE_DURATION,
        fireFadeDuration: animConfig.ANIMATION.FADE_DURATION,
        volcanoScaleY: animConfig.VOLCANO_SCALE,
        volcanoDuration1: animConfig.ANIMATION.VOLCANO_EXPAND_DURATION,
        volcanoDuration2: animConfig.ANIMATION.VOLCANO_CONTRACT_DURATION,
        transformOrigin: "bottom center",
        easeOut: "power2.out",
        easeIn: "power2.in",
      },
      resources: this.resources,
    });

    this.volcanoEruptionFunctions.push(eruptionControl);
  }

  stopEruptions() {
    if (this.volcanoEruptionFunctions) {
      this.volcanoEruptionFunctions.forEach((control) => {
        control.stop();
      });
      this.volcanoEruptionFunctions = [];
    }

    const volcanoLeft = this.screen?.querySelector(".volcano-left");
    const volcanoCenter = this.screen?.querySelector(".volcano-center");
    const volcanoRight = this.screen?.querySelector(".volcano-right");

    [volcanoLeft, volcanoCenter, volcanoRight].forEach((volcano) => {
      if (volcano) {
        gsap.killTweensOf(volcano);
        gsap.set(volcano, { scaleY: 1 });
      }
    });
  }

  destroy() {
    this.stopEruptions();

    Object.values(this.volcanoApps).forEach((app) => {
      try {
        if (app?.ticker) {
          app.ticker.stop();
        }
        app?.destroy(true, { children: true });
      } catch (e) {
        // ignore
      }
    });
    this.volcanoApps = {};
  }
}
