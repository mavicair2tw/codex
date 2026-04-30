export type LayerKind = "video" | "audio" | "text" | "image";

export type ExportPreset = "1080p" | "2k" | "4k";

export type CanvasAspectRatio = "1:1" | "9:16" | "16:9";

export type PlaybackState = "playing" | "paused" | "stopped";

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface ClipTiming {
  start: number;
  duration: number;
  sourceIn: number;
  sourceDuration: number;
}

export interface LayerTransform {
  position: Point;
  size: Size;
  scale: number;
  rotation: number;
  opacity: number;
}

export interface FadeSettings {
  fadeIn: number;
  fadeOut: number;
}

export interface BaseClip {
  id: string;
  trackId: string;
  name: string;
  kind: LayerKind;
  timing: ClipTiming;
  transform: LayerTransform;
  fades: FadeSettings;
  locked?: boolean;
  muted?: boolean;
}

export interface MediaClip extends BaseClip {
  kind: "video" | "image";
  sourcePath: string;
  previewUrl?: string;
  fileName?: string;
  mimeType?: string;
}

export interface AudioClip extends BaseClip {
  kind: "audio";
  sourcePath: string;
  previewUrl?: string;
  fileName?: string;
  mimeType?: string;
  volume: number;
  volumeFadeIn: number;
  volumeFadeOut: number;
}

export interface TextClip extends BaseClip {
  kind: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
}

export type EditorClip = MediaClip | AudioClip | TextClip;

export interface Track {
  id: string;
  name: string;
  kind: LayerKind;
  muted?: boolean;
  hidden?: boolean;
}

export interface TimelineSettings {
  duration: number;
  fps: number;
  zoom: number;
  snapEnabled: boolean;
  snapStep: number;
}

export interface ProjectSettings {
  name: string;
  canvas: Size;
  aspectRatio: CanvasAspectRatio;
  backgroundColor: string;
}

export interface EditorProject {
  settings: ProjectSettings;
  timeline: TimelineSettings;
  tracks: Track[];
  clips: EditorClip[];
  mediaAssets: MediaAsset[];
}

export interface ExportJob {
  id: string;
  preset: ExportPreset;
  status: "idle" | "preparing" | "running" | "complete" | "failed";
  progress: number;
  message: string;
}

export interface MediaAsset {
  id: string;
  kind: LayerKind;
  name: string;
  sourcePath?: string;
  previewUrl?: string;
  mimeType?: string;
  duration: number;
  naturalSize?: Size;
  importedAt: string;
}
