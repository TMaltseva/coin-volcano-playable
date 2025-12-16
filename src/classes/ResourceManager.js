export class ResourceManager {
  constructor() {
    this.timers = new Set();
    this.intervals = new Set();
    this.animationFrames = new Set();
    this.animations = new Set();
    this.pixiApps = new Set();
  }

  setTimeout(callback, delay) {
    const id = setTimeout(() => {
      this.timers.delete(id);
      callback();
    }, delay);
    this.timers.add(id);
    return id;
  }

  clearTimeout(id) {
    if (id) {
      clearTimeout(id);
      this.timers.delete(id);
    }
  }

  setInterval(callback, delay) {
    const id = setInterval(callback, delay);
    this.intervals.add(id);
    return id;
  }

  clearInterval(id) {
    if (id) {
      clearInterval(id);
      this.intervals.delete(id);
    }
  }

  requestAnimationFrame(callback) {
    const id = requestAnimationFrame(callback);
    this.animationFrames.add(id);
    return id;
  }

  cancelAnimationFrame(id) {
    if (id) {
      cancelAnimationFrame(id);
      this.animationFrames.delete(id);
    }
  }

  registerAnimation(animation) {
    if (animation) {
      this.animations.add(animation);
    }
  }

  unregisterAnimation(animation) {
    if (animation) {
      this.animations.delete(animation);
    }
  }

  registerPixiApp(app) {
    if (app) {
      this.pixiApps.add(app);
    }
  }

  unregisterPixiApp(app) {
    if (app) {
      this.pixiApps.delete(app);
    }
  }

  destroy() {
    this.timers.forEach((id) => clearTimeout(id));
    this.timers.clear();

    this.intervals.forEach((id) => clearInterval(id));
    this.intervals.clear();

    this.animationFrames.forEach((id) => cancelAnimationFrame(id));
    this.animationFrames.clear();

    this.animations.forEach((anim) => {
      try {
        anim?.kill();
      } catch (e) {
        // ignore
      }
    });
    this.animations.clear();

    this.pixiApps.forEach((app) => {
      try {
        if (app?.ticker) {
          app.ticker.stop();
        }
        if (app?.stage) {
          app.stage.removeChildren();
          app.stage.destroy({ children: true });
        }
        if (app?.renderer && !app.renderer.destroyed) {
          app.renderer.destroy(true);
        }
        app?.destroy(true, { children: true });
      } catch (e) {
        // ignore
      }
    });
    this.pixiApps.clear();
  }

  getStats() {
    return {
      timers: this.timers.size,
      intervals: this.intervals.size,
      animationFrames: this.animationFrames.size,
      animations: this.animations.size,
      pixiApps: this.pixiApps.size,
    };
  }
}
