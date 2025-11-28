import * as PIXI from "pixi.js";
import { gsap } from "gsap";

class Game {
  constructor() {
    this.loadingScreen = document.getElementById("loading-screen");
    this.chestScreen = document.getElementById("chest-screen");
    this.progressBar = document.getElementById("progress-bar");
    this.chestWrappers = document.querySelectorAll(".chest-wrapper");
    this.customCursor = document.getElementById("custom-cursor");

    this.isLoaded = false;
    this.selectedChest = null;
    this.winningChests = [];
    this.winAmounts = {};
    this.mouseX = 0;
    this.mouseY = 0;

    this.loadingApp = null;
    this.chestApp = null;

    this.resources = {};

    this.animationFrames = new Set();

    this.chestPulseAnimations = [];
    this.chestPulseAnimationsByIndex = {};

    this.chestHoverAnimations = {};

    this.init();
  }

  async init() {
    await this.setupPixiApplications();
    this.loadAssets();
  }

  async setupPixiApplications() {
    const loadingCanvas = document.getElementById("sparkles-canvas");
    if (loadingCanvas) {
      this.loadingApp = new PIXI.Application({
        view: loadingCanvas,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });
    }

    const chestCanvas = document.getElementById("sparkles-canvas-chest");
    if (chestCanvas) {
      this.chestApp = new PIXI.Application({
        view: chestCanvas,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });
    }

    window.addEventListener("resize", () => {
      if (this.loadingApp && this.loadingApp.renderer) {
        this.loadingApp.renderer.resize(window.innerWidth, window.innerHeight);
      }
      if (this.chestApp && this.chestApp.renderer) {
        this.chestApp.renderer.resize(window.innerWidth, window.innerHeight);
      }
    });
  }

  loadAssets() {
    const assets = {
      chestOpenSheet: "/assets/spritesheets/spritesheet_2.png",
      background: "/assets/backgrounds/bg_01.png",
    };

    const assetUrls = Object.values(assets);
    let loadedCount = 0;
    const totalCount = assetUrls.length;

    Promise.all(
      assetUrls.map((url) =>
        PIXI.Assets.load(url).then((texture) => {
          loadedCount++;
          const progress = (loadedCount / totalCount) * 100;
          this.updateProgress(progress);
          return { url, texture };
        })
      )
    )
      .then((results) => {
        this.resources = {};
        results.forEach(({ url, texture }) => {
          const key = Object.keys(assets).find((k) => assets[k] === url);
          if (key) {
            this.resources[key] = texture;
          }
        });

        this.onAssetsLoaded();
      })
      .catch((error) => {
        this.onAssetsLoaded();
      });
  }

  updateProgress(percent) {
    if (this.progressBar) {
      this.progressBar.style.width = `${percent}%`;
    }
  }

  onAssetsLoaded() {
    this.updateProgress(100);
    setTimeout(() => {
      this.startSparklesAnimation();
      setTimeout(() => {
        this.showChestScreen();
      }, 1500);
    }, 500);
  }

  startSparklesAnimation() {
    if (!this.loadingApp || !this.chestApp) return;

    const colors = [
      { main: 0xffb6c1, glow: 0xff69b4 },
      { main: 0xadd8e6, glow: 0x87ceeb },
      { main: 0xffff99, glow: 0xffd700 },
    ];

    const sparkleCount = 80;

    const loadingSparkles = this.createSparklesContainer(
      this.loadingApp,
      sparkleCount,
      colors
    );

    const chestSparkles = this.createSparklesContainer(
      this.chestApp,
      sparkleCount,
      colors
    );

    this.createFogEffect(this.loadingApp);
    this.createFogEffect(this.chestApp);

    let lastUpdateTime = 0;
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime) => {
      const frameId = requestAnimationFrame(animate);
      this.animationFrames.add(frameId);

      if (currentTime - lastUpdateTime >= frameInterval) {
        if (this.loadingScreen?.classList.contains("active")) {
          this.updateSparkles(loadingSparkles, this.loadingApp);
        }

        if (this.chestScreen?.classList.contains("active")) {
          this.updateSparkles(chestSparkles, this.chestApp);
        }
        lastUpdateTime = currentTime;
      }
    };

    animate(0);
  }

  createFogTexture(app) {
    const size = 300;
    const graphics = new PIXI.Graphics();

    const purpleTints = [
      0xffb6c1, 0xdda0dd, 0xda70d6, 0xba55d3, 0x9370db, 0x8b7fa8,
    ];
    for (let i = 0; i < 8; i++) {
      const radius = size * (0.2 + Math.random() * 0.5);
      const x = size / 2 + (Math.random() - 0.5) * size * 0.4;
      const y = size / 2 + (Math.random() - 0.5) * size * 0.4;
      const alpha = 0.02 + Math.random() * 0.03;
      const tintColor =
        purpleTints[Math.floor(Math.random() * purpleTints.length)];

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

  createFogEffect(app) {
    if (!app || !app.renderer) return;

    const smokes = new PIXI.Container();
    app.stage.addChild(smokes);

    const smokeTexture = this.createFogTexture(app);
    const smokeParticles = [];
    const particleCount = 50;

    const r = (min, max) => {
      return Math.floor(Math.random() * (max - min) + 1) + min;
    };

    for (let p = 0; p < particleCount; p++) {
      const particle = new PIXI.Sprite(smokeTexture);
      const centerX = app.screen.width / 2;
      const centerY = app.screen.height / 2;

      particle.position.set(
        centerX - (Math.random() * 500 - 250),
        centerY - (Math.random() * 500 - 250)
      );
      particle.anchor.set(0.5);
      particle.rotation = Math.random() * 360;
      particle.alpha = 0.05 + Math.random() * 0.05;
      particle.blendMode = PIXI.BLEND_MODES.SCREEN;
      const purpleTints = [
        0xffb6c1, 0xdda0dd, 0xda70d6, 0xba55d3, 0x9370db, 0x8b7fa8,
      ];
      particle.tint =
        purpleTints[Math.floor(Math.random() * purpleTints.length)];

      particle._speed = (r(0, 100) - 50) / 10000;

      smokes.addChild(particle);
      smokeParticles.push(particle);

      const duration = 20 + Math.random() * 30;
      const distanceX = (Math.random() - 0.5) * app.screen.width * 0.8;
      const distanceY = (Math.random() - 0.5) * app.screen.height * 0.8;

      gsap.to(particle, {
        x: particle.x + distanceX,
        y: particle.y + distanceY,
        duration: duration,
        ease: "none",
        repeat: -1,
        yoyo: true,
      });

      gsap.to(particle, {
        alpha: 0.03 + Math.random() * 0.07,
        duration: 3 + Math.random() * 4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      const scale = 0.4 + Math.random() * 0.4;
      gsap.to(particle.scale, {
        x: scale * 1.2,
        y: scale * 1.2,
        duration: 4 + Math.random() * 3,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }

    app.ticker.speed = 0.3;
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

  createSparklesContainer(app, count, colors) {
    const container = new PIXI.Container();
    app.stage.addChild(container);

    const sparkles = [];
    const width = app.screen.width;
    const height = app.screen.height;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 2;
      const colorIndex = Math.floor(Math.random() * colors.length);
      const color = colors[colorIndex];

      const sparkle = {
        sprite: new PIXI.Graphics(),
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

    return { container, sparkles, width, height };
  }

  updateSparkles(sparkleData, app) {
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

      if (Math.abs(sparkle.sprite.alpha - finalOpacity) > 0.01) {
        sparkle.sprite.alpha = finalOpacity;
      }
      sparkle.sprite.x = sparkle.x;
      sparkle.sprite.y = sparkle.y;
      sparkle.sprite.rotation = sparkle.angle;

      sparkle.sprite.clear();
      sparkle.sprite.beginFill(sparkle.color.glow, finalOpacity);
      sparkle.sprite.drawEllipse(0, 0, depthLength / 2, depthSize);
      sparkle.sprite.endFill();

      sparkle.sprite.beginFill(sparkle.color.glow, finalOpacity * 0.8);
      sparkle.sprite.drawEllipse(0, 0, depthSize * 1.5, depthSize * 0.6);
      sparkle.sprite.endFill();
    }
  }

  showChestScreen() {
    requestAnimationFrame(() => {
      if (this.loadingScreen) {
        this.loadingScreen.classList.remove("active");
      }
      if (this.chestScreen) {
        this.chestScreen.classList.add("active");
      }
      this.isLoaded = true;

      this.setupChestInteractions();
      this.setupCustomCursor();
      this.startChestPulseAnimation();
    });

    const winCount = Math.floor(Math.random() * 2) + 1;
    const indices = [0, 1, 2];
    for (let i = 0; i < winCount; i++) {
      const randomIndex = Math.floor(Math.random() * indices.length);
      const winIndex = indices.splice(randomIndex, 1)[0];
      this.winningChests.push(winIndex);
      const winAmount = Math.floor(Math.random() * 9900) + 100;
      this.winAmounts[winIndex] = winAmount;
    }
  }

  setupCustomCursor() {
    if (!this.customCursor) return;

    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      this.customCursor.style.display = "none";
      return;
    }

    let rafId = null;
    let needsUpdate = false;

    const updateCursor = () => {
      if (needsUpdate) {
        if (
          this.chestScreen?.classList.contains("active") &&
          this.selectedChest === null &&
          this.customCursor
        ) {
          this.customCursor.style.transform = `translate3d(${this.mouseX}px, ${this.mouseY}px, 0) translate(-50%, -50%)`;
        }
        needsUpdate = false;
      }
      rafId = requestAnimationFrame(updateCursor);
      this.animationFrames.add(rafId);
    };

    document.addEventListener(
      "mousemove",
      (e) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        needsUpdate = true;
        if (rafId === null) {
          updateCursor();
        }
      },
      { passive: true }
    );

    document.addEventListener("mouseleave", () => {
      if (this.customCursor) {
        this.customCursor.classList.remove("active");
      }
    });

    this.chestWrappers.forEach((wrapper) => {
      wrapper.addEventListener("mouseenter", () => {
        if (
          !wrapper.classList.contains("disabled") &&
          this.selectedChest === null &&
          this.customCursor
        ) {
          this.customCursor.classList.add("active");
        }
      });
      wrapper.addEventListener("mouseleave", () => {
        if (this.selectedChest === null && this.customCursor) {
          this.customCursor.classList.remove("active");
        }
      });
    });
  }

  setupChestInteractions() {
    this.chestWrappers.forEach((wrapper, index) => {
      wrapper.setAttribute("data-chest-index", index);
      wrapper._chestIndex = index;

      const handleChestClick = (e) => {
        e.stopPropagation();
        if (this.selectedChest !== null) return;
        const chestIndex = wrapper._chestIndex;
        if (chestIndex !== undefined) {
          this.selectChest(chestIndex);
        }
      };

      wrapper.addEventListener("click", handleChestClick, { passive: false });

      wrapper.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (this.selectedChest !== null) return;
          const chestIndex = wrapper._chestIndex;
          if (chestIndex !== undefined) {
            this.selectChest(chestIndex);
          }
        },
        { passive: false }
      );

      const handleMouseEnter = () => {
        if (
          this.selectedChest !== null ||
          wrapper.classList.contains("disabled") ||
          wrapper.classList.contains("opened") ||
          wrapper.classList.contains("selected")
        ) {
          return;
        }

        if (this.chestPulseAnimationsByIndex[index]) {
          this.chestPulseAnimationsByIndex[index].pause();
        }

        const activePulseTweens = gsap
          .getTweensOf(wrapper)
          .filter(
            (tween) =>
              tween.vars.scale !== undefined && tween.vars.repeat !== undefined
          );
        activePulseTweens.forEach((tween) => {
          if (!tween.paused()) {
            tween.pause();
          }
        });

        if (this.chestHoverAnimations[index]) {
          this.chestHoverAnimations[index].kill();
        }

        this.chestHoverAnimations[index] = gsap.to(wrapper, {
          scale: 1.2,
          duration: 0.3,
          ease: "sine.out",
          force3D: true,
        });
      };

      const handleMouseLeave = () => {
        if (
          this.selectedChest !== null ||
          wrapper.classList.contains("disabled") ||
          wrapper.classList.contains("opened") ||
          wrapper.classList.contains("selected")
        ) {
          return;
        }

        if (this.chestHoverAnimations[index]) {
          this.chestHoverAnimations[index].kill();
        }

        this.chestHoverAnimations[index] = gsap.to(wrapper, {
          scale: 1,
          duration: 0.3,
          ease: "sine.out",
          force3D: true,
          onComplete: () => {
            if (this.chestPulseAnimationsByIndex[index]) {
              this.chestPulseAnimationsByIndex[index].resume();
            }

            const pausedPulseTweens = gsap
              .getTweensOf(wrapper)
              .filter(
                (tween) =>
                  tween.paused() &&
                  tween.vars.scale !== undefined &&
                  tween.vars.repeat !== undefined
              );
            pausedPulseTweens.forEach((tween) => {
              tween.resume();
            });
          },
        });
      };

      wrapper.addEventListener("mouseenter", handleMouseEnter);
      wrapper.addEventListener("mouseleave", handleMouseLeave);
    });
  }

  startChestPulseAnimation() {
    this.stopChestPulseAnimation();

    const pulseScale = 1.12;
    const duration = 0.8;

    const pulseChest = (index) => {
      if (this.selectedChest !== null) {
        return;
      }

      const wrapper = this.chestWrappers[index];
      if (
        !wrapper ||
        wrapper.classList.contains("selected") ||
        wrapper.classList.contains("disabled")
      ) {
        const nextIndex = (index + 1) % this.chestWrappers.length;
        pulseChest(nextIndex);
        return;
      }

      const animation = gsap.to(wrapper, {
        scale: pulseScale,
        duration: duration / 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: 1,
        force3D: true,
        onComplete: () => {
          const nextIndex = (index + 1) % this.chestWrappers.length;
          pulseChest(nextIndex);
        },
      });

      this.chestPulseAnimations.push(animation);
      this.chestPulseAnimationsByIndex[index] = animation;
    };

    pulseChest(0);
  }

  stopChestPulseAnimation() {
    this.chestPulseAnimations.forEach((animation) => {
      if (animation) {
        animation.kill();
      }
    });
    this.chestPulseAnimations = [];
    this.chestPulseAnimationsByIndex = {};

    this.chestWrappers.forEach((wrapper) => {
      gsap.set(wrapper, { scale: 1 });
    });
  }

  selectChest(index) {
    this.stopChestPulseAnimation();

    this.selectedChest = index;
    const wrapper = this.chestWrappers[index];

    if (this.customCursor) {
      this.customCursor.classList.remove("active");
      this.customCursor.style.display = "none";
    }
    if (this.chestScreen) {
      this.chestScreen.classList.add("cursor-normal");
    }

    wrapper.classList.add("selected", "win");

    this.winAmounts[index] = "100$ + 5 FREE SPINS";
    this.showWinAmount(wrapper, index);

    this.chestWrappers.forEach((w, i) => {
      if (i !== index) {
        w.classList.add("disabled", "dimmed");
      }
    });

    this.animateChestOpening(index, () => {
      wrapper.classList.add("opened");

      setTimeout(() => {
        this.chestWrappers.forEach((w, i) => {
          if (i !== index) {
            this.openDimmedChest(w);

            if (this.winningChests.includes(i)) {
              w.classList.add("win");
              this.showWinAmount(w, i);
            } else {
              if (!this.winAmounts[i]) {
                const smallAmount = Math.floor(Math.random() * 50) + 10;
                this.winAmounts[i] = smallAmount;
              }
              w.classList.add("win");
              this.showWinAmount(w, i);
            }
          }
        });
      }, 300);
    });
  }

  openDimmedChest(wrapper) {
    const closedImage = wrapper.querySelector(".chest-closed");
    const openedImage = wrapper.querySelector(".chest-opened");

    if (!closedImage || !openedImage) return;

    closedImage.style.opacity = "0";
    closedImage.style.display = "none";

    openedImage.style.display = "block";
    openedImage.style.opacity = "0";

    openedImage.style.filter = "saturate(0.3) brightness(0.7)";

    gsap.to(openedImage, {
      opacity: 1,
      duration: 0.3,
      ease: "sine.out",
      force3D: true,
    });

    gsap.to(wrapper, {
      scale: 0.9,
      duration: 0.5,
      ease: "sine.out",
      force3D: true,
    });
  }

  async animateChestOpening(index, onComplete) {
    const wrapper = this.chestWrappers[index];
    if (!wrapper) {
      if (onComplete) onComplete();
      return;
    }

    const chestOpenResource = this.resources.chestOpenSheet;
    if (!chestOpenResource) {
      if (onComplete) onComplete();
      return;
    }

    const texture =
      chestOpenResource instanceof PIXI.Texture
        ? chestOpenResource
        : chestOpenResource;

    if (!texture || !(texture instanceof PIXI.Texture)) {
      if (onComplete) onComplete();
      return;
    }

    const baseTexture = texture.baseTexture;

    if (!baseTexture) {
      if (onComplete) onComplete();
      return;
    }

    baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;

    if (!baseTexture.width || !baseTexture.height) {
      if (onComplete) onComplete();
      return;
    }

    const closedImage = wrapper.querySelector(".chest-closed");
    if (closedImage) {
      closedImage.style.opacity = "0";
    }
    wrapper.classList.add("animating");

    const canvas = wrapper.querySelector(".chest-animation-canvas");
    if (!canvas) {
      if (onComplete) onComplete();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const canvasWidth = rect.width || canvas.offsetWidth || 200;
    const canvasHeight = rect.height || canvas.offsetHeight || 200;

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

    const totalWidth = baseTexture.width;
    const totalHeight = baseTexture.height;
    const totalFrames = 15;

    const cols = 5;
    const rows = 3;
    const firstCols = 4;

    const spriteWidth = Math.floor(totalWidth / cols);
    const spriteHeight = Math.floor(totalHeight / rows);

    const textures = [];
    let frameCount = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < firstCols; col++) {
        const frameX = col * spriteWidth;
        const frameY = row * spriteHeight;

        let frameW = spriteWidth;
        let frameH = spriteHeight;

        const actualX = Math.floor(frameX);
        const actualY = Math.floor(frameY);
        const actualW = Math.floor(frameW);
        const actualH = Math.floor(frameH);

        const clampedX = Math.max(0, Math.min(actualX, totalWidth - 1));
        const clampedY = Math.max(0, Math.min(actualY, totalHeight - 1));
        const clampedW = Math.min(actualW, totalWidth - clampedX);
        const clampedH = Math.min(actualH, totalHeight - clampedY);

        if (clampedW > 0 && clampedH > 0) {
          const frameRect = new PIXI.Rectangle(
            clampedX,
            clampedY,
            clampedW,
            clampedH
          );
          const frameTexture = new PIXI.Texture(baseTexture, frameRect);
          frameTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;

          if (frameTexture && frameTexture.valid !== false) {
            textures.push(frameTexture);
            frameCount++;
          }
        }
      }
    }

    const lastCol = 4;
    for (let row = 0; row < rows; row++) {
      const frameX = lastCol * spriteWidth;
      const frameY = row * spriteHeight;

      let frameW = totalWidth - frameX;
      let frameH = spriteHeight;

      const actualX = Math.floor(frameX);
      const actualY = Math.floor(frameY);
      const actualW = Math.floor(frameW);
      const actualH = Math.floor(frameH);

      const clampedX = Math.max(0, Math.min(actualX, totalWidth - 1));
      const clampedY = Math.max(0, Math.min(actualY, totalHeight - 1));
      const clampedW = Math.min(actualW, totalWidth - clampedX);
      const clampedH = Math.min(actualH, totalHeight - clampedY);

      if (clampedW > 0 && clampedH > 0) {
        const frameRect = new PIXI.Rectangle(
          clampedX,
          clampedY,
          clampedW,
          clampedH
        );
        const frameTexture = new PIXI.Texture(baseTexture, frameRect);
        frameTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;

        if (frameTexture && frameTexture.valid !== false) {
          textures.push(frameTexture);
          frameCount++;
        }
      }
    }

    const animatedSprite = new PIXI.AnimatedSprite(textures);
    animatedSprite.anchor.set(0.5);
    animatedSprite.x = Math.round(app.screen.width / 2);
    animatedSprite.y = Math.round(app.screen.height / 2);
    animatedSprite.roundPixels = true;

    const firstFrame = textures[0];
    const frameAspectRatio = firstFrame.width / firstFrame.height;
    const canvasAspectRatio = app.screen.width / app.screen.height;

    const scaleMultiplier = 2.5;

    if (frameAspectRatio > canvasAspectRatio) {
      animatedSprite.width = app.screen.width * scaleMultiplier;
      animatedSprite.height =
        (app.screen.width * scaleMultiplier) / frameAspectRatio;
    } else {
      animatedSprite.height = app.screen.height * scaleMultiplier;
      animatedSprite.width =
        app.screen.height * scaleMultiplier * frameAspectRatio;
    }

    animatedSprite.animationSpeed = 0.2;
    animatedSprite.loop = false;
    animatedSprite.visible = true;

    app.stage.addChild(animatedSprite);

    if (!app.ticker.started) {
      app.ticker.start();
    }

    animatedSprite.onComplete = () => {
      animatedSprite.stop();
      animatedSprite.gotoAndStop(animatedSprite.textures.length - 1);

      const finalScale = 1.1;

      gsap.to(animatedSprite.scale, {
        x: finalScale,
        y: finalScale,
        duration: 0.5,
        ease: "sine.out",
        force3D: true,
        onComplete: () => {
          this.animateChestsFlyAway();
        },
      });

      if (onComplete) onComplete();
    };

    animatedSprite.play();
  }

  animateChestsFlyAway() {
    const delayBetweenChests = 0.3;
    const screenHeight = window.innerHeight;
    const lastChestIndex = this.chestWrappers.length - 1;

    this.chestWrappers.forEach((wrapper, index) => {
      const delay = index * delayBetweenChests;

      const tl = gsap.timeline({ delay: delay });

      tl.to(wrapper, {
        y: "+=30",
        duration: 0.2,
        ease: "sine.out",
        force3D: true,
      });

      tl.to(wrapper, {
        y: `-=${screenHeight + 200}`,
        duration: 0.8,
        ease: "power2.in",
        opacity: 0,
        force3D: true,
      });
    });
  }

  showWinAmount(wrapper, chestIndex) {
    const winAmountElement = wrapper.querySelector(".win-amount");
    if (winAmountElement && this.winAmounts[chestIndex]) {
      const amount = this.winAmounts[chestIndex];

      if (typeof amount === "string") {
        const parts = amount.split(" FREE SPINS");
        if (parts.length === 2) {
          winAmountElement.innerHTML = `${parts[0]}<br>FREE SPINS`;
        } else {
          winAmountElement.textContent = amount;
        }
      } else {
        const formattedAmount = amount
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        winAmountElement.textContent = `$${formattedAmount}`;
      }
    }
  }

  destroy() {
    this.animationFrames.forEach((id) => cancelAnimationFrame(id));
    this.animationFrames.clear();

    if (this.loadingApp) {
      this.loadingApp.destroy(true);
    }
    if (this.chestApp) {
      this.chestApp.destroy(true);
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new Game();
  });
} else {
  new Game();
}
