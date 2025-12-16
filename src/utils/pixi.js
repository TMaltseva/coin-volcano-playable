import * as PIXI from "pixi.js";

export const PIXIUtils = {
  createTexturesFromSpritesheet(baseTexture, cols, rows) {
    const frameWidth = baseTexture.width / cols;
    const frameHeight = baseTexture.height / rows;
    const textures = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const frameRect = new PIXI.Rectangle(
          col * frameWidth,
          row * frameHeight,
          frameWidth,
          frameHeight
        );
        const frameTexture = new PIXI.Texture(baseTexture, frameRect);
        textures.push(frameTexture);
      }
    }

    return textures;
  },

  createAnimatedSprite(textures, config = {}) {
    const {
      animationSpeed = 0.2,
      loop = true,
      anchor = { x: 0.5, y: 0.5 },
    } = config;

    const sprite = new PIXI.AnimatedSprite(textures);
    sprite.anchor.set(anchor.x, anchor.y);
    sprite.animationSpeed = animationSpeed;
    sprite.loop = loop;

    return sprite;
  },
};
