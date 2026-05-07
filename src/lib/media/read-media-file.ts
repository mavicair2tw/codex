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

interface NativeMediaMetadata {
  duration?: number | null;
  naturalSize?: Size | null;
  mimeType?: string | null;
}

const defaultMetadata = (kind: ImportedMediaFile["kind"]): { duration: number; naturalSize?: Size } => {
  if (kind === "video") {
    return { duration: 10, naturalSize: { width: 1920, height: 1080 } };
  }

  if (kind === "image") {
    return { duration: 5, naturalSize: { width: 1280, height: 720 } };
  }

  return { duration: 10 };
};

const withMetadataTimeout = async <T>(reader: Promise<T>, kind: ImportedMediaFile["kind"]): Promise<T> => {
  let timeoutId: number | undefined;
  try {
    return await Promise.race([
      reader,
      new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error(`Could not read ${kind} metadata.`)), 5000);
      })
    ]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
};

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
    video.muted = true;
    video.playsInline = true;
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

const readBrowserMetadata = async (url: string, kind: ImportedMediaFile["kind"]) =>
  withMetadataTimeout(
    kind === "image" ? readImageMetadata(url) : kind === "video" ? readVideoMetadata(url) : readAudioMetadata(url),
    kind
  );

const readBrowserMetadataOrFallback = async (url: string, kind: ImportedMediaFile["kind"]) => {
  try {
    return await readBrowserMetadata(url, kind);
  } catch {
    return defaultMetadata(kind);
  }
};

const readNativeMetadata = async (sourcePath: string, kind: ImportedMediaFile["kind"]): Promise<NativeMediaMetadata | null> => {
  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) {
    return null;
  }

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<NativeMediaMetadata>("read_media_metadata", { sourcePath, kind });
  } catch {
    return null;
  }
};

const hasNaturalSize = (metadata: { duration: number } | { duration: number; naturalSize: Size }): metadata is { duration: number; naturalSize: Size } =>
  "naturalSize" in metadata;

export const readMediaFile = async (file: File, kind: ImportedMediaFile["kind"]): Promise<ImportedMediaFile> => {
  const previewUrl = URL.createObjectURL(file);
  const metadata = await readBrowserMetadataOrFallback(previewUrl, kind);

  return {
    kind,
    name: file.name.replace(/\.[^.]+$/, "") || file.name,
    sourcePath: file.name,
    previewUrl,
    mimeType: file.type,
    duration: metadata.duration,
    naturalSize: hasNaturalSize(metadata) ? metadata.naturalSize : undefined
  };
};

export const readMediaPath = async (sourcePath: string, kind: ImportedMediaFile["kind"]): Promise<ImportedMediaFile> => {
  const { convertFileSrc } = await import("@tauri-apps/api/core");
  const previewUrl = convertFileSrc(sourcePath);
  const fileName = sourcePath.split(/[\\/]/).pop() ?? sourcePath;
  const name = fileName.replace(/\.[^.]+$/, "") || fileName;
  const nativeMetadata = await readNativeMetadata(sourcePath, kind);
  const browserMetadata = nativeMetadata ? null : await readBrowserMetadataOrFallback(previewUrl, kind);
  const fallbackMetadata = defaultMetadata(kind);
  const browserOrFallbackMetadata = browserMetadata ?? fallbackMetadata;
  const metadata = {
    duration:
      typeof nativeMetadata?.duration === "number" && Number.isFinite(nativeMetadata.duration) && nativeMetadata.duration > 0
        ? nativeMetadata.duration
        : browserOrFallbackMetadata.duration,
    naturalSize: nativeMetadata?.naturalSize ?? (hasNaturalSize(browserOrFallbackMetadata) ? browserOrFallbackMetadata.naturalSize : undefined)
  };

  return {
    kind,
    name,
    sourcePath,
    previewUrl,
    mimeType: nativeMetadata?.mimeType ?? "",
    duration: metadata.duration,
    naturalSize: metadata.naturalSize
  };
};
