import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { CONFIG } from "../../config.js";
import { DOMUtils } from "../../utils/dom.js";
import { PIXIUtils } from "../../utils/pixi.js";
import { CalculationUtils } from "../../utils/calculation.js";
import { playSound } from "../../utils/audio.js";
import jokerSpritesheetUrl from "/spritesheets/spritesheet_1.png";
import sound8Url from "/sounds/sound_8.mp3";
import sound9Url from "/sounds/sound_9.mp3";

export class JokerAnimations {
  constructor(resources, screen = null) {
    this.resources = resources;
    this.screen = screen;
    this.jokerWinApps = [];
  }

  async animate(jokerCells) {
    const jokerApps = [];

    const audio8 = playSound(sound8Url, false);
    if (audio8) {
      if (audio8.readyState >= 2) {
        audio8.currentTime = 0;
        const promise = audio8.play();
        if (promise !== undefined) {
          promise.catch(() => {
            // autoplay blocked - will be handled by SDK
          });
        }
      } else {
        audio8.addEventListener(
          "canplaythrough",
          () => {
            audio8.currentTime = 0;
            const promise = audio8.play();
            if (promise !== undefined) {
              promise.catch(() => {
                // autoplay blocked
              });
            }
          },
          { once: true }
        );
        if (audio8.readyState === 0) {
          audio8.load();
        }
      }
    }

    this.resources.setTimeout(() => {
      const audio9 = playSound(sound9Url, false);
      if (audio9) {
        if (audio9.readyState >= 2) {
          audio9.currentTime = 0;
          const promise = audio9.play();
          if (promise !== undefined) {
            promise.catch(() => {
              // autoplay blocked
            });
          }
        } else {
          audio9.addEventListener(
            "canplaythrough",
            () => {
              audio9.currentTime = 0;
              const promise = audio9.play();
              if (promise !== undefined) {
                promise.catch(() => {
                  // autoplay blocked
                });
              }
            },
            { once: true }
          );
          if (audio9.readyState === 0) {
            audio9.load();
          }
        }
      }
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

    const textures = PIXIUtils.createTexturesFromSpritesheet(
      baseTexture,
      cols,
      rows
    );

    const sortedCells = Array.from(jokerCells).sort((a, b) => {
      const posA = CalculationUtils.getRelativePosition(a, this.screen);
      const posB = CalculationUtils.getRelativePosition(b, this.screen);
      return posA.x - posB.x;
    });

    for (let index = 0; index < sortedCells.length; index++) {
      const cell = sortedCells[index];
      const delay = index * 0.2;
      const staticImg = cell.querySelector(".joker-static");
      if (!staticImg) continue;

      const rect = cell.getBoundingClientRect();
      const canvasWidth = rect.width || 200;
      const canvasHeight = rect.height || 200;
      const canvas = DOMUtils.createElement("canvas", {
        className: "joker-win-canvas",
        style: { opacity: "0", zIndex: "2" },
      });
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
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

      const animatedJoker = PIXIUtils.createAnimatedSprite(textures, {
        animationSpeed: CONFIG.JOKER_WIN.SPRITE_SPEED,
        loop: false,
        anchor: { x: 0.5, y: 0.5 },
      });
      animatedJoker.x = app.screen.width / 2;
      animatedJoker.y = app.screen.height / 2;
      animatedJoker.visible = false;

      const scale = Math.min(
        app.screen.width / frameWidth,
        app.screen.height / frameHeight
      );
      animatedJoker.scale.set(scale * 1.17);

      app.stage.addChild(animatedJoker);
      jokerApps.push(app);
      this.resources.registerPixiApp(app);

      const timeline = gsap.timeline({
        delay: delay,
      });
      this.resources.registerAnimation(timeline);

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

      timeline.to(canvas, {
        scale: 1,
        duration: 0.4,
        ease: "back.in(1.2)",
        delay: 0.3,
      });
    }

    this.jokerWinApps = jokerApps;
    return jokerApps;
  }

  cleanup() {
    if (this.jokerWinApps && this.jokerWinApps.length > 0) {
      const jokerCells = this.screen?.querySelectorAll(
        `.slot-cell[data-row="1"]`
      );

      if (jokerCells) {
        jokerCells.forEach((cell) => {
          const canvas = cell.querySelector(".joker-win-canvas");

          if (canvas) {
            const app = canvas._pixiApp;
            if (app) {
              try {
                app.destroy(true, { children: true });
              } catch (e) {
                // ignore
              }
            }
            canvas.remove();
          }

          const existingStatic = cell.querySelector(".joker-static");
          if (!existingStatic) {
            const staticImg = DOMUtils.createImage({
              src: "ui/joker/joker-static.png",
              className: "joker-static",
            });
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
      }

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
          // ignore
        }
      });
      this.jokerWinApps = [];
    }
  }

  destroy() {
    this.cleanup();
  }
}
