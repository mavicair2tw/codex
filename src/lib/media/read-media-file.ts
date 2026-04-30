import type { LayerKind, Size } from "@/types/editor";

export interface ImportedMediaFile {
  kind: Extract<LayerKind, "video" | "audio" | "image">;
  name: string;
  sourcePath: string;
  previewUrl: string;
  mimeType: string;
  duration: number;
  naturalSize?: Size;
}

const readImageMetadata = (url: string): Promise<{ duration: number; naturalSize: Size }> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ duration: 5, naturalSize: { width: image.naturalWidth || 1280, height: image.naturalHeight || 720 } });
    image.onerror = () => reject(new Error("Could not read image metadata."));
    image.src = url;
  });

const readVideoMetadata = (url: string): Promise<{ duration: number; naturalSize: Size }> =>
  new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () =>
      resolve({
        duration: Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 10,
        naturalSize: { width: video.videoWidth || 1920, height: video.videoHeight || 1080 }
      });
    video.onerror = () => reject(new Error("Could not read video metadata."));
    video.src = url;
  });

const readAudioMetadata = (url: string): Promise<{ duration: number }> =>
  new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => resolve({ duration: Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 10 });
    audio.onerror = () => reject(new Error("Could not read audio metadata."));
    audio.src = url;
  });

const hasNaturalSize = (metadata: { duration: number } | { duration: number; naturalSize: Size }): metadata is { duration: number; naturalSize: Size } =>
  "naturalSize" in metadata;

export const readMediaFile = async (file: File, kind: ImportedMediaFile["kind"]): Promise<ImportedMediaFile> => {
  const previewUrl = URL.createObjectURL(file);
  try {
    const metadata =
      kind === "image"
        ? await readImageMetadata(previewUrl)
        : kind === "video"
          ? await readVideoMetadata(previewUrl)
          : await readAudioMetadata(previewUrl);

    return {
      kind,
      name: file.name.replace(/\.[^.]+$/, "") || file.name,
      sourcePath: file.name,
      previewUrl,
      mimeType: file.type,
      duration: metadata.duration,
      naturalSize: hasNaturalSize(metadata) ? metadata.naturalSize : undefined
    };
  } catch (error) {
    URL.revokeObjectURL(previewUrl);
    throw error;
  }
};

export const readMediaPath = async (sourcePath: string, kind: ImportedMediaFile["kind"]): Promise<ImportedMediaFile> => {
  const { convertFileSrc } = await import("@tauri-apps/api/core");
  const previewUrl = convertFileSrc(sourcePath);
  const fileName = sourcePath.split(/[\\/]/).pop() ?? sourcePath;
  const name = fileName.replace(/\.[^.]+$/, "") || fileName;
  const metadata =
    kind === "image"
      ? await readImageMetadata(previewUrl)
      : kind === "video"
        ? await readVideoMetadata(previewUrl)
        : await readAudioMetadata(previewUrl);

  return {
    kind,
    name,
    sourcePath,
    previewUrl,
    mimeType: "",
    duration: metadata.duration,
    naturalSize: hasNaturalSize(metadata) ? metadata.naturalSize : undefined
  };
};
