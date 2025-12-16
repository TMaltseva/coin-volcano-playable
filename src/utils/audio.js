import { sdk } from "@smoud/playable-sdk";

export const createAudio = (url) => {
  const audio = new Audio(url);
  const volume = window.game?.currentVolume ?? sdk.volume ?? 0.5;

  audio.volume = volume;
  audio.muted = volume === 0;

  return audio;
};

export const playSound = (url) => {
  try {
    const audio = createAudio(url);

    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch(() => {
        // autoplay blocked
      });
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
    const audio = createAudio(url);

    try {
      await new Promise((resolve, reject) => {
        audio.onended = resolve;
        audio.onerror = reject;

        const promise = audio.play();
        if (promise !== undefined) {
          promise.catch(reject);
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
