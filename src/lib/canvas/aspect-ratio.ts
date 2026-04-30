import type { CanvasAspectRatio, ExportPreset, Size } from "@/types/editor";

export const canvasAspectRatioLabels: Record<CanvasAspectRatio, string> = {
  "1:1": "1:1",
  "9:16": "9:16",
  "16:9": "16:9"
};

export const canvasAspectRatios: CanvasAspectRatio[] = ["16:9", "9:16", "1:1"];

const presetShortEdge: Record<ExportPreset, number> = {
  "1080p": 1080,
  "2k": 1440,
  "4k": 2160
};

export const getCanvasSize = (aspectRatio: CanvasAspectRatio, shortEdge = presetShortEdge["1080p"]): Size => {
  if (aspectRatio === "1:1") {
    return { width: shortEdge, height: shortEdge };
  }

  if (aspectRatio === "9:16") {
    return { width: shortEdge, height: Math.round((shortEdge * 16) / 9) };
  }

  return { width: Math.round((shortEdge * 16) / 9), height: shortEdge };
};

export const getExportSize = (preset: ExportPreset, aspectRatio: CanvasAspectRatio): Size => getCanvasSize(aspectRatio, presetShortEdge[preset]);
