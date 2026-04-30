import type { ExportPreset, Size } from "@/types/editor";

export const exportPresetSizes: Record<ExportPreset, Size> = {
  "1080p": { width: 1920, height: 1080 },
  "2k": { width: 2560, height: 1440 },
  "4k": { width: 3840, height: 2160 }
};

export const exportPresetLabels: Record<ExportPreset, string> = {
  "1080p": "1080p",
  "2k": "2K",
  "4k": "4K"
};
