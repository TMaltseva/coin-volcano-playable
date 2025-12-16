import { sdk } from "@smoud/playable-sdk";
import "./style.css";
import { Game } from "./game.js";

const initSDKVariables = () => {
  const defaults = {
    AD_NETWORK: "local",
    AD_PROTOCOL: "local",
    GOOGLE_PLAY_URL:
      "https://play.google.com/store/apps/details?id=com.coinvolcanoes",
    APP_STORE_URL: "https://apps.apple.com/app/coin-volcanoes",
  };

  Object.keys(defaults).forEach((key) => {
    if (typeof window[key] === "undefined") {
      window[key] = defaults[key];
    }
  });
};

initSDKVariables();

sdk.init((width, height) => {
  // SDK initialized
  window.game = new Game(width, height);
});

sdk.on("resize", (width, height) => {
  // SDK resize
  window.game?.handleResize(width, height);
});

sdk.on("pause", () => {
  // SDK pause
  window.game?.pause();
});

sdk.on("resume", () => {
  // SDK resume
  window.game?.resume();
});

sdk.on("volume", (level) => {
  // SDK volume
  window.game?.setVolume(level);
});

sdk.on("finish", () => {
  // SDK finish
  window.game?.onFinish();
});

sdk.on("interaction", (count) => {
  // SDK interaction
});
