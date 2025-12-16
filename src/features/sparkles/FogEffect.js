import * as PIXI from "pixi.js";
import { BlurFilter } from "@pixi/filter-blur";
import { gsap } from "gsap";
import { CONFIG } from "../../config.js";
import { CalculationUtils } from "../../utils/calculation.js";

export class FogEffect {
  static createFogTexture(app) {
    const config = CONFIG.SPARKLES.FOG_TEXTURE;
    const size = config.SIZE;
    const graphics = new PIXI.Graphics();

    for (let i = 0; i < config.CIRCLE_COUNT; i++) {
      const radius =
        size *
        (config.RADIUS_MULTIPLIER_MIN +
          Math.random() *
            (config.RADIUS_MULTIPLIER_MAX - config.RADIUS_MULTIPLIER_MIN));
      const x =
        size / 2 +
        (Math.random() - 0.5) * size * config.POSITION_OFFSET_MULTIPLIER;
      const y =
        size / 2 +
        (Math.random() - 0.5) * size * config.POSITION_OFFSET_MULTIPLIER;
      const alpha =
        config.ALPHA_MIN +
        Math.random() * (config.ALPHA_MAX - config.ALPHA_MIN);
      const tintColor =
        config.TINTS[CalculationUtils.randomRange(0, config.TINTS.length - 1)];

      graphics.beginFill(tintColor, alpha);
      graphics.drawCircle(x, y, radius);
      graphics.endFill();
    }

    const texture = app.renderer.generateTexture(
      graphics,
      PIXI.SCALE_MODES.LINEAR,
      1
    );

    graphics.destroy();
    return texture;
  }

  static createFogEffect(app) {
    if (!app || !app.renderer) return;

    const config = CONFIG.SPARKLES.FOG;
    const smokes = new PIXI.Container();
    smokes.filters = [new BlurFilter(config.BLUR_FILTER)];
    app.stage.addChild(smokes);

    const smokeTexture = FogEffect.createFogTexture(app);
    const smokeParticles = [];
    const particleCount = Math.min(
      config.PARTICLE_COUNT_MAX,
      CONFIG.PARTICLES.FOG_COUNT
    );

    for (let p = 0; p < particleCount; p++) {
      const particle = FogEffect.createFogParticle(app, smokeTexture, config);
      smokes.addChild(particle);
      smokeParticles.push(particle);
      FogEffect.animateFogParticle(particle, app, config);
    }

    app.ticker.speed = config.TICKER_SPEED;
    app.ticker.add((delta) => {
      let sp = smokeParticles.length;
      while (sp--) {
        const x = smokeParticles[sp]._speed;
        smokeParticles[sp].rotation += delta * x;
      }
    });

    smokes._smokeParticles = smokeParticles;
    smokes._smokeTexture = smokeTexture;
  }

  static createFogParticle(app, smokeTexture, config) {
    const particle = new PIXI.Sprite(smokeTexture);
    const centerX = app.screen.width / 2;
    const centerY =
      app.screen.height *
      (config.CENTER_Y_BASE + Math.random() * config.CENTER_Y_RANGE);

    particle.position.set(
      centerX -
        (Math.random() * config.POSITION_RANGE_X - config.POSITION_OFFSET_X),
      centerY -
        (Math.random() * config.POSITION_RANGE_Y - config.POSITION_OFFSET_Y)
    );
    particle.anchor.set(0.5);
    particle.rotation = Math.random() * 360;
    particle.alpha =
      config.ALPHA_MIN + Math.random() * (config.ALPHA_MAX - config.ALPHA_MIN);
    particle.blendMode = PIXI.BLEND_MODES.ADD;
    particle.tint =
      config.TINTS[CalculationUtils.randomRange(0, config.TINTS.length - 1)];

    const speedRange = config.SPEED_MAX - config.SPEED_MIN;
    particle._speed =
      (CalculationUtils.randomRange(config.SPEED_MIN, config.SPEED_MAX) -
        speedRange / 2) /
      config.SPEED_DIVISOR;

    return particle;
  }

  static animateFogParticle(particle, app, config) {
    if (!particle || !particle.transform || !particle.transform.scale) {
      return;
    }

    const duration =
      config.DURATION_MIN +
      Math.random() * (config.DURATION_MAX - config.DURATION_MIN);
    const distanceX =
      (Math.random() - 0.5) * app.screen.width * config.DISTANCE_MULTIPLIER_X;
    const distanceY =
      (Math.random() - 0.5) * app.screen.height * config.DISTANCE_MULTIPLIER_Y;

    const isParticleValid = () => {
      return (
        particle &&
        particle.transform &&
        particle.transform.scale &&
        !particle.destroyed
      );
    };

    gsap.to(particle, {
      x: particle.x + distanceX,
      y: particle.y + distanceY,
      duration: duration,
      ease: "none",
      repeat: -1,
      yoyo: true,
      onUpdate: function () {
        if (!isParticleValid()) {
          this.kill();
        }
      },
    });

    gsap.to(particle, {
      alpha:
        config.ALPHA_ANIMATION_MIN +
        Math.random() *
          (config.ALPHA_ANIMATION_MAX - config.ALPHA_ANIMATION_MIN),
      duration:
        config.ALPHA_DURATION_MIN +
        Math.random() * (config.ALPHA_DURATION_MAX - config.ALPHA_DURATION_MIN),
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      onUpdate: function () {
        if (!isParticleValid()) {
          this.kill();
        }
      },
    });

    const scale =
      config.SCALE_MIN + Math.random() * (config.SCALE_MAX - config.SCALE_MIN);
    gsap.to(particle.scale, {
      x: scale * config.SCALE_MULTIPLIER,
      y: scale * config.SCALE_MULTIPLIER,
      duration:
        config.SCALE_DURATION_MIN +
        Math.random() * (config.SCALE_DURATION_MAX - config.SCALE_DURATION_MIN),
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      onUpdate: function () {
        if (!isParticleValid()) {
          this.kill();
        }
      },
    });
  }
}
