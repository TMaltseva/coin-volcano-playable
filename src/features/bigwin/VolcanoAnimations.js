import { gsap } from "gsap";
import { CONFIG } from "../../config.js";
import { DOMUtils } from "../../utils/dom.js";
import { AnimationPresets } from "../../utils/animation.js";

export class VolcanoAnimations {
  constructor(resources) {
    this.resources = resources;
    this.bigWinVolcanoFunctions = [];
    this.bigWinExplosionApps = null;
    this.bigWinVolcanoTimers = [];
  }

  startAnimation(
    volcanoWrapper,
    volcanoImg,
    glowElement,
    fireContainer,
    onRegisterStop
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

    if (onRegisterStop) {
      onRegisterStop(() => {
        eruptionControl.stop();
      });
    }
  }

  async startMultipleAnimations(volcanoesContainer, volcanoConfigs) {
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
      const glowElement = DOMUtils.createElement("div", {
        className: "volcano-glow",
        style: { opacity: "0", animation: "none" },
      });
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
      const flames = Array.from({ length: 3 }, () =>
        DOMUtils.createElement("div", {
          className: "flame",
        })
      );
      const smokes = Array.from({ length: 8 }, () =>
        DOMUtils.createElement("div", {
          className: "smoke",
        })
      );
      const fireContainer = DOMUtils.createElement("div", {
        className: "volcano-fire-container",
        children: [...flames, ...smokes],
      });

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
            eruptionTimer = this.resources.setTimeout(
              eruption,
              nextDelay * 1000
            );
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
            this.resources.clearTimeout(eruptionTimer);
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
      eruptionTimer = this.resources.setTimeout(eruption, initialDelay * 1000);
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

  stop() {
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
  }

  cleanupExplosionApps() {
    if (!this.bigWinExplosionApps) return;

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
          } catch (e) {
            // ignore
          }
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
                  // ignore
                }
              }
            }
            app.destroy(true, { children: true });
          } catch (e) {
            // ignore
          }
        }
        if (canvas && canvas.parentNode) {
          try {
            canvas.parentNode.removeChild(canvas);
          } catch (e) {
            // ignore
          }
        }
      }
    );
    this.bigWinExplosionApps = null;
  }
}
