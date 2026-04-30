import type { TimelineSettings } from "@/types/editor";

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const roundToFrame = (seconds: number, fps: number) => Math.round(seconds * fps) / fps;

export const snapTime = (seconds: number, settings: TimelineSettings) => {
  const frameRounded = roundToFrame(seconds, settings.fps);
  if (!settings.snapEnabled) {
    return clamp(frameRounded, 0, settings.duration);
  }

  const snapped = Math.round(frameRounded / settings.snapStep) * settings.snapStep;
  return clamp(roundToFrame(snapped, settings.fps), 0, settings.duration);
};

export const secondsToPixels = (seconds: number, zoom: number) => seconds * zoom;

export const pixelsToSeconds = (pixels: number, zoom: number) => pixels / zoom;

export const formatTimecode = (seconds: number, fps: number) => {
  const totalFrames = Math.max(0, Math.round(seconds * fps));
  const frames = totalFrames % fps;
  const totalSeconds = Math.floor(totalFrames / fps);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);

  return [h, m, s].map((part) => String(part).padStart(2, "0")).join(":") + `:${String(frames).padStart(2, "0")}`;
};

export const getClipOpacityAtTime = (clipStart: number, duration: number, fadeIn: number, fadeOut: number, opacity: number, time: number) => {
  const localTime = time - clipStart;
  const fadeInValue = fadeIn > 0 ? clamp(localTime / fadeIn, 0, 1) : 1;
  const fadeOutStart = duration - fadeOut;
  const fadeOutValue = fadeOut > 0 && localTime > fadeOutStart ? clamp((duration - localTime) / fadeOut, 0, 1) : 1;

  return opacity * Math.min(fadeInValue, fadeOutValue);
};
