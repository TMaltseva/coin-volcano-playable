import { sdk } from "@smoud/playable-sdk";

export const createAudio = (url) => {
  const audio = new Audio(url);
  const volume = window.game?.currentVolume ?? sdk.volume ?? 0.5;

  audio.volume = volume;
  audio.muted = volume === 0;

  return audio;
};

const audioCache = new Map();

export const preloadAudio = (url) => {
  if (audioCache.has(url)) {
    return audioCache.get(url);
  }

  const audio = createAudio(url);
  audio.preload = "auto";
  audio.load();
  audioCache.set(url, audio);
  return audio;
};

export const playSound = (url, playImmediately = true) => {
  try {
    let audio = audioCache.get(url);

    if (!audio) {
      audio = createAudio(url);
      audioCache.set(url, audio);
      audio.preload = "auto";
      audio.load();
    }

    if (playImmediately) {
      if (audio.readyState >= 2) {
        audio.currentTime = 0;
        const promise = audio.play();
        if (promise !== undefined) {
          promise.catch(() => {
            // autoplay blocked
          });
        }
      } else {
        audio.addEventListener(
          "canplaythrough",
          () => {
            audio.currentTime = 0;
            const promise = audio.play();
            if (promise !== undefined) {
              promise.catch(() => {
                // autoplay blocked
              });
            }
          },
          { once: true }
        );
        if (audio.readyState === 0) {
          audio.load();
        }
      }
    }

    return audio;
  } catch (e) {
    if (import.meta.env.DEV) {
      console.error("Error playing sound:", url, e);
    }
    return null;
  }
};

export const playSoundSequentially = async (url, times) => {
  for (let i = 0; i < times; i++) {
    let audio = audioCache.get(url);
    if (!audio) {
      audio = createAudio(url);
      audioCache.set(url, audio);
      audio.preload = "auto";
      audio.load();
    }

    try {
      if (audio.readyState < 2) {
        await new Promise((resolve, reject) => {
          audio.addEventListener("canplaythrough", resolve, { once: true });
          audio.addEventListener("error", reject, { once: true });
          if (audio.readyState === 0) {
            audio.load();
          }
        });
      }

      audio.currentTime = 0;
      await new Promise((resolve, reject) => {
        audio.onended = resolve;
        audio.onerror = reject;

        const promise = audio.play();
        if (promise !== undefined) {
          promise.catch((e) => {
            // autoplay blocked - this is expected on some platforms
            // Resolve anyway to continue sequence
            resolve();
          });
        }
      });
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error("Error playing sound sequentially:", url, e);
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
};
