import { gsap } from "gsap";
import * as PIXI from "pixi.js";
import { DOMUtils } from "./dom.js";
import { CalculationUtils } from "./calculation.js";
import { PIXIUtils } from "./pixi.js";

export const AnimationUtils = {
  createPulseAnimation(target, config = {}) {
    const {
      scale = 1.1,
      duration = 0.8,
      ease = "sine.inOut",
      repeat = -1,
      yoyo = true,
    } = config;

    return gsap.to(target, {
      scale,
      duration,
      yoyo,
      repeat,
      ease,
    });
  },

  createScaleBounceAnimation(target, config = {}) {
    const {
      scale = 0,
      duration = 0.3,
      ease = "back.out(1.7)",
      delay = 0,
    } = config;

    return gsap.from(target, {
      scale,
      duration,
      ease,
      delay,
    });
  },

  createRotationAnimation(target, config = {}) {
    const { rotation = "+=360", duration = 0.5, ease = "power2.out" } = config;

    return gsap.to(target, {
      rotation,
      duration,
      ease,
    });
  },
};

export const AnimationPresets = {
  volcanoEruption({
    volcano,
    glow,
    fire = null,
    config,
    resources,
    onComplete = null,
    onStart = null,
  }) {
    let eruptionTimer = null;
    let isActive = true;
    let currentTimeline = null;

    const eruption = () => {
      if (!isActive) return;

      currentTimeline = gsap.timeline({
        delay: config.delay || 0,
        onComplete: () => {
          if (!isActive) return;
          if (onComplete) {
            onComplete();
          } else {
            const nextDelay =
              (config.nextDelayMin || 3) +
              Math.random() *
                ((config.nextDelayMax || 4) - (config.nextDelayMin || 3));
            eruptionTimer = resources.setTimeout(eruption, nextDelay * 1000);
          }
        },
      });

      if (onStart) {
        onStart();
      }

      currentTimeline.to(
        glow,
        {
          opacity: config.glowOpacity || 1,
          scale: config.glowScale || 1.2,
          duration: config.glowDuration || 0.2,
          ease: config.easeOut || "power2.out",
        },
        0
      );

      if (fire) {
        currentTimeline.to(
          fire,
          {
            opacity: config.fireOpacity || 1,
            duration: config.fireDuration || 0.2,
            ease: config.easeOut || "power2.out",
          },
          0
        );
      }

      if (config.volcanoScaleY) {
        currentTimeline.to(
          volcano,
          {
            scaleY: config.volcanoScaleY,
            duration: config.volcanoDuration1 || 0.3,
            ease: config.easeOut || "power2.out",
            transformOrigin: config.transformOrigin || "bottom center",
          },
          0
        );

        currentTimeline.to(volcano, {
          scaleY: 1,
          duration: config.volcanoDuration2 || 0.5,
          ease: config.easeIn || "power2.in",
        });
      } else if (config.volcanoScaleX1) {
        currentTimeline.to(volcano, {
          scaleX: config.volcanoScaleX1,
          scaleY: 1,
          duration: config.volcanoDuration1 || 0.2,
          ease: config.easeOut || "power2.out",
          transformOrigin: "center center",
        });

        currentTimeline.to(volcano, {
          scaleX: config.volcanoScaleX2 || 0.95,
          scaleY: 1,
          duration: config.volcanoDuration1 || 0.2,
          ease: config.easeIn || "power2.in",
        });

        currentTimeline.to(volcano, {
          scaleX: 1,
          scaleY: config.volcanoScaleY || 1.15,
          duration: config.volcanoDuration2 || 0.3,
          ease: config.easeOut || "power2.out",
          transformOrigin: "center center",
        });

        currentTimeline.to(volcano, {
          scaleX: 1,
          scaleY: 1,
          duration: config.volcanoDuration3 || 0.5,
          ease: config.easeIn || "power2.in",
        });
      }

      const fadeOffset = config.glowFadeOffset || "-=0.4";
      currentTimeline.to(
        glow,
        {
          opacity: 0,
          scale: 1,
          duration: config.glowFadeDuration || 0.4,
          ease: config.easeIn || "power2.out",
        },
        fadeOffset
      );

      if (fire) {
        currentTimeline.to(
          fire,
          {
            opacity: 0,
            duration: config.fireFadeDuration || 0.4,
            ease: config.easeIn || "power2.out",
          },
          fadeOffset
        );
      }

      resources.registerAnimation(currentTimeline);
    };

    const initialDelay =
      (config.initialDelayMin || 0) +
      Math.random() *
        ((config.initialDelayMax || 2) - (config.initialDelayMin || 0));
    eruptionTimer = resources.setTimeout(eruption, initialDelay * 1000);

    return {
      stop: () => {
        isActive = false;
        if (eruptionTimer) {
          resources.clearTimeout(eruptionTimer);
        }
        if (currentTimeline) {
          gsap.killTweensOf(volcano);
          gsap.killTweensOf(glow);
          if (fire) {
            gsap.killTweensOf(fire);
          }
        }
      },
      timeline: currentTimeline,
    };
  },

  coinExplosion({ coinTextures, sources, config, resources, getCanvasConfig }) {
    const canvasConfig = getCanvasConfig();
    const coinsCanvas = DOMUtils.createElement("canvas", {
      className: canvasConfig.className || "coins-canvas",
      style: `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: ${canvasConfig.zIndex || 999};
      `,
    });
    coinsCanvas.width = window.innerWidth;
    coinsCanvas.height = window.innerHeight;
    document.body.appendChild(coinsCanvas);

    const coinsApp = new PIXI.Application({
      view: coinsCanvas,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x000000,
      backgroundAlpha: 0,
      resolution: Math.min(
        window.devicePixelRatio || 1,
        canvasConfig.resolutionMax || 1.5
      ),
      autoDensity: true,
      antialias: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
      clearBeforeRender: true,
      autoStart: canvasConfig.autoStart !== false,
    });

    if (coinsApp.ticker && !canvasConfig.autoStart) {
      coinsApp.ticker.stop();
      coinsApp.ticker.autoStart = false;
    }

    coinsCanvas._pixiApp = coinsApp;
    resources.registerPixiApp(coinsApp);

    const coins = [];
    const sourcesArray = Array.isArray(sources) ? sources : [sources];

    sourcesArray.forEach((source, sourceIndex) => {
      const center =
        source.x !== undefined && source.y !== undefined
          ? { x: source.x, y: source.y }
          : CalculationUtils.getElementCenter(source);

      const coinsCount = config.count
        ? CalculationUtils.randomRange(config.count.min, config.count.max)
        : config.perSource
        ? CalculationUtils.randomRange(
            config.perSource.min,
            config.perSource.max
          )
        : 10;

      for (let i = 0; i < coinsCount; i++) {
        const coin = PIXIUtils.createAnimatedSprite(coinTextures, {
          animationSpeed: config.animationSpeed || 0.3,
          loop: true,
          anchor: { x: 0.5, y: 0.5 },
        });
        coin.x = center.x;
        coin.y = center.y;
        coin.play();
        coin.visible = true;
        coin.alpha = 1.0;

        const scale =
          (config.scale?.min || 0.065) +
          Math.random() *
            ((config.scale?.max || 0.13) - (config.scale?.min || 0.065));
        coin.scale.set(scale, scale);

        const angle =
          (Math.PI * 2 * i) / coinsCount +
          Math.random() * (config.angleRandom || 0.5);
        const speed =
          (config.speed?.min || 3) +
          Math.random() * ((config.speed?.max || 4) - (config.speed?.min || 3));
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed + (config.velocityY || -3);

        coins.push({
          sprite: coin,
          vx,
          vy,
          rotationSpeed:
            (Math.random() - 0.5) * (config.rotationSpeedMultiplier || 0.15),
          startTime:
            performance.now() + Math.random() * (config.startDelayMax || 0),
          fadeStartTime: config.fadeStartTime || 0.6,
        });

        coinsApp.stage.addChild(coin);
      }
    });

    const startTime = performance.now();
    const duration = config.duration || 2000;

    const animateCoins = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      coins.forEach((coin) => {
        if (performance.now() < coin.startTime) {
          return;
        }

        coin.sprite.x += coin.vx;
        coin.sprite.y += coin.vy;
        coin.vy += config.gravity || 0.3;
        coin.sprite.rotation += coin.rotationSpeed;

        let alpha = 1.0;
        if (progress > coin.fadeStartTime) {
          const fadeProgress =
            (progress - coin.fadeStartTime) / (1 - coin.fadeStartTime);
          alpha = 1.0 - fadeProgress;
        }
        coin.sprite.alpha = Math.max(0, alpha);

        const boundaryOffset = config.boundaryOffset || 100;
        if (
          coin.sprite.alpha <= 0 ||
          coin.sprite.x < -boundaryOffset ||
          coin.sprite.x > window.innerWidth + boundaryOffset ||
          coin.sprite.y > window.innerHeight + boundaryOffset
        ) {
          coin.sprite.visible = false;
        }
      });

      coinsApp.renderer.render(coinsApp.stage);

      const hasVisibleCoins = coins.some(
        (coin) => coin.sprite.visible && coin.sprite.alpha > 0
      );

      if (progress < 1 || hasVisibleCoins) {
        resources.requestAnimationFrame(animateCoins);
      } else {
        resources.setTimeout(() => {
          try {
            coinsApp.stage.removeChildren();
            coinsApp.destroy(true, { children: true });
            if (coinsCanvas.parentNode) {
              coinsCanvas.parentNode.removeChild(coinsCanvas);
            }
          } catch (e) {
            // ignore
          }
        }, 500);
      }
    };

    animateCoins();

    return {
      coins,
      app: coinsApp,
      canvas: coinsCanvas,
      cleanup: () => {
        try {
          coinsApp.stage.removeChildren();
          coinsApp.destroy(true, { children: true });
          if (coinsCanvas.parentNode) {
            coinsCanvas.parentNode.removeChild(coinsCanvas);
          }
        } catch (e) {
          // ignore
        }
      },
    };
  },
};
